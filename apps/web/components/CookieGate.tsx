"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { toast } from "sonner";
import {
  emitCookieModalState,
  onCookieModalRequest,
  readDecision,
  setDecision,
  type CookieDecision,
} from "@/lib/privacy/decision";
import { Button } from "@sbozh/react-ui/components/ui/button";
import { EmperorCookieModal } from "@/components/EmperorCookieModal";
import { CookieCornerVideo } from "@/components/CookieCornerVideo";

function agreementBanner() {
  toast.success(
    <span>
      You're aware of{" "}
      <a href="/terms" className="underline underline-offset-2">Terms of Use</a>,{" "}
      <a href="/privacy" className="underline underline-offset-2">Privacy Policy</a>{" "}
      and the{" "}
      <a
        href="/library/laws/declaration-of-the-digital-principate"
        className="underline underline-offset-2"
      >
        Digital Principate Declaration
      </a>
      .
    </span>,
    { duration: 7000 }
  );
}

/**
 * Sits at the root and decides whether to present the cookie choice.
 *
 * Non-main page, no decision yet: a picture-in-picture Pan Dude clip plays in the
 * bottom-right corner (CookieCornerVideo) with a 3-2-1 leader, and the Emperor Cookie
 * modal opens the moment the countdown ends. The clip stays visible after the choice
 * too, until the visitor closes it with its own button.
 *
 * Main page, no decision yet: HomeVideoHero fires a cookie:request the moment its
 * own 3-2-1 leader runs out (and again after 3 seconds of black-and-white scroll-away
 * as a backup); the gate opens the modal and locks the scroll.
 *
 * Dismissed: the site stays grayscale forever (data-site-bw on <html>) until the visitor
 * clears their choice.
 */
export function CookieGate() {
  const pathname = usePathname();
  const isMain = pathname === "/";
  // Keep the corner widget above the demo call bar on phones
  const aboveDemoBar = !!pathname?.startsWith("/demo/");
  const [decision, setLocalDecision] = useState<CookieDecision>(null);
  const [hydrated, setHydrated] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  // The corner video is mounted iff the page loaded with no decision, and stays mounted
  // until the visitor hits its close button (even after they pick a side)
  const [cornerVisible, setCornerVisible] = useState(false);

  // Read the stored decision and mark hydrated in one commit, so a returning visitor
  // never sees a flash of the widget before the "already decided" branch fires
  useEffect(() => {
    const initial = readDecision();
    setLocalDecision(initial);
    // Non-main pages get the picture-in-picture clip on a fresh visit and keep getting
    // it on every subsequent visit until the visitor switches to "allow" -- a dismiss
    // doesn't make Pan Dude go away. The main page has the full hero so the corner
    // clip stays hidden there.
    setCornerVisible(!isMain && initial !== "allow");
    setHydrated(true);
    const onChange = (e: Event) =>
      setLocalDecision((e as CustomEvent<CookieDecision>).detail);
    window.addEventListener("cookie:decision", onChange);
    return () => window.removeEventListener("cookie:decision", onChange);
  }, [isMain]);

  // Main page: wait for HomeVideoHero to call for the modal
  useEffect(() => {
    if (!isMain) return;
    return onCookieModalRequest(() => {
      if (readDecision() !== "allow") setModalOpen(true);
    });
  }, [isMain]);

  // Grayscale is the cost of dismissing
  useEffect(() => {
    if (!hydrated) return;
    if (decision !== "dismiss") return;
    const html = document.documentElement;
    html.setAttribute("data-site-bw", "");
    return () => html.removeAttribute("data-site-bw");
  }, [decision, hydrated]);

  // Lock scroll only while the modal is up
  useEffect(() => {
    if (!hydrated || !modalOpen) return;
    const body = document.body;
    const prev = body.style.overflow;
    body.style.overflow = "hidden";
    return () => {
      body.style.overflow = prev;
    };
  }, [modalOpen, hydrated]);

  // Broadcast modal open/close so the home-page hero can pause its video while the
  // visitor has to pick a side
  useEffect(() => {
    if (!hydrated) return;
    emitCookieModalState(modalOpen);
  }, [modalOpen, hydrated]);

  const handleAllow = () => {
    setDecision("allow");
    setModalOpen(false);
    agreementBanner();
  };
  const handleDismiss = () => {
    setDecision("dismiss");
    setModalOpen(false);
  };
  // Close on the corner widget:
  //   before a decision -- hand off to the modal, so they still have to pick a side
  //   after a decision  -- hide the widget (they already settled it)
  const handleCornerClose = () => {
    if (readDecision() === null) setModalOpen(true);
    else setCornerVisible(false);
  };
  // Opening the modal the moment the 3-2-1 leader runs out is the gate's main nudge:
  // every visit that hasn't landed on "allow" gets the prompt again, so a dismisser
  // keeps being asked until they switch.
  const handleCornerLeaderDone = useCallback(() => {
    if (readDecision() !== "allow") setModalOpen(true);
  }, []);
  // Escape during the countdown skips to the end and always shows the modal, so a
  // returning dismisser can ask for cookies again
  const handleCornerLeaderSkip = useCallback(() => setModalOpen(true), []);

  if (!hydrated) return null;

  return (
    <>
      {cornerVisible && (
        <CookieCornerVideo
          onClose={handleCornerClose}
          onLeaderDone={handleCornerLeaderDone}
          onLeaderSkip={handleCornerLeaderSkip}
          aboveDemoBar={aboveDemoBar}
          shouldPlay={!modalOpen}
        />
      )}
      {decision === "dismiss" && !modalOpen && (
        <Button
          onClick={() => setModalOpen(true)}
          className={`fixed ${aboveDemoBar ? "bottom-24 md:bottom-4" : "bottom-4"} left-1/2 z-50 -translate-x-1/2 rounded-full shadow-lg print:hidden`}
          aria-label="Return colors"
          title="Change your cookie choice"
        >
          Return colors
        </Button>
      )}
      <EmperorCookieModal open={modalOpen} onAllow={handleAllow} onDismiss={handleDismiss} />
    </>
  );
}
