"use client";

import { useEffect, useState } from "react";

const KEY = "cookie_decision";
const DECISION_EVENT = "cookie:decision";
const REQUEST_EVENT = "cookie:request";
const MODAL_STATE_EVENT = "cookie:modal-state";
const LEADER_SHOWN_KEY = "sbozh:leader_shown";

export type CookieDecision = "allow" | "dismiss" | null;

export function readDecision(): CookieDecision {
  if (typeof window === "undefined") return null;
  try {
    const v = localStorage.getItem(KEY);
    if (v === "allow" || v === "dismiss") return v;
    // Migrate the old consent record: analytics-granted counts as allow, denied as dismiss
    const old = localStorage.getItem("cookie_consent");
    if (old) {
      const parsed = JSON.parse(old) as { analytics?: boolean };
      const d: CookieDecision = parsed.analytics ? "allow" : "dismiss";
      localStorage.setItem(KEY, d);
      return d;
    }
  } catch {
    // localStorage blocked or old record corrupt: treat as undecided
  }
  return null;
}

export function setDecision(d: Exclude<CookieDecision, null>) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(KEY, d);
  } catch {
    // localStorage blocked: still emit so the UI updates this tab
  }
  window.dispatchEvent(new CustomEvent<CookieDecision>(DECISION_EVENT, { detail: d }));
}

/** Ask the CookieGate to open its modal now (used by the home-page scroll timer). */
export function requestCookieModal() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(REQUEST_EVENT));
}

export function useCookieDecision(): CookieDecision {
  // null until mount: the server can't read localStorage, and a wrong guess would flicker
  const [d, setD] = useState<CookieDecision>(null);
  useEffect(() => {
    setD(readDecision());
    const onChange = (e: Event) => setD((e as CustomEvent<CookieDecision>).detail);
    window.addEventListener(DECISION_EVENT, onChange);
    return () => window.removeEventListener(DECISION_EVENT, onChange);
  }, []);
  return d;
}

export function onCookieModalRequest(handler: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(REQUEST_EVENT, handler);
  return () => window.removeEventListener(REQUEST_EVENT, handler);
}

/** The gate calls this when its Emperor Cookie modal opens or closes. */
export function emitCookieModalState(open: boolean) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<boolean>(MODAL_STATE_EVENT, { detail: open }));
}

/**
 * The 3-2-1 film leader runs once per tab session: whichever page shows it first
 * (home hero or corner widget) marks the flag, and the other one skips to the
 * video. sessionStorage clears on tab close, so a new session gets the countdown
 * again.
 */
export function wasLeaderShown(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return sessionStorage.getItem(LEADER_SHOWN_KEY) === "1";
  } catch {
    return false;
  }
}

export function markLeaderShown() {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(LEADER_SHOWN_KEY, "1");
  } catch {
    // sessionStorage blocked (private mode on some browsers): the leader runs
    // again, which is survivable
  }
}

/** Subscribe to the gate's modal-open state (false until a first event arrives). */
export function useCookieModalOpen(): boolean {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const handler = (e: Event) => setOpen((e as CustomEvent<boolean>).detail);
    window.addEventListener(MODAL_STATE_EVENT, handler);
    return () => window.removeEventListener(MODAL_STATE_EVENT, handler);
  }, []);
  return open;
}
