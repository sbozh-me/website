"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { toast } from "sonner";
import {
  emitCookieModalState,
  onCookieModalRequest,
  readDecision,
  setDecision,
} from "@/lib/privacy/decision";
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
 * bottom-right corner on desktop (or full-screen on phones) via CookieCornerVideo
 * with a 3-2-1 leader, and the Emperor Cookie modal opens the moment the countdown
 * ends. The clip stays visible after the choice too, until the visitor closes it
 * with its own button.
 *
 * Main page, no decision yet: HomeVideoHero fires a cookie:request the moment its
 * own 3-2-1 leader runs out; the gate opens the modal and locks the scroll.
 */
export function CookieGate() {
  const pathname = usePathname();
  const isMain = pathname === "/";
  const [hydrated, setHydrated] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  // The corner video is mounted iff the page loaded with no decision, and stays mounted
  // until the visitor hits its close button (even after they pick a side)
  const [cornerVisible, setCornerVisible] = useState(false);

  // Mark hydrated after reading the stored decision, so a returning visitor never sees
  // a flash of the widget before the "already decided" branch fires
  useEffect(() => {
    // Non-main pages get the picture-in-picture clip on a fresh visit and keep getting
    // it on every subsequent visit until the visitor switches to "allow" -- a dismiss
    // doesn't make Pan Dude go away. The main page has the full hero so the corner
    // clip stays hidden there.
    setCornerVisible(!isMain && readDecision() !== "allow");
    setHydrated(true);
  }, [isMain]);

  // Main page: wait for HomeVideoHero to call for the modal
  useEffect(() => {
    if (!isMain) return;
    return onCookieModalRequest(() => {
      if (readDecision() !== "allow") setModalOpen(true);
    });
  }, [isMain]);

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

  // Umami is the cookieless path -- it runs for everyone, so logging the choice
  // itself does not depend on the choice.
  const trackChoice = (choice: "allow" | "dismiss") => {
    window.umami?.track("cookie_choice", { choice });
  };
  const handleAllow = () => {
    setDecision("allow");
    setModalOpen(false);
    trackChoice("allow");
    agreementBanner();
  };
  const handleDismiss = () => {
    setDecision("dismiss");
    setModalOpen(false);
    trackChoice("dismiss");
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
          shouldPlay={!modalOpen}
        />
      )}
      <EmperorCookieModal
        open={modalOpen}
        onAllow={handleAllow}
        onDismiss={handleDismiss}
      />
    </>
  );
}
