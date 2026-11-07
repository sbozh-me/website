// Shared between POST /api/donations/reveal and the /donate client.

import { createRateLimiter } from "@/lib/contact/rate-limit";

/** Reveals faster than this after the page rendered are bots. */
export const MIN_WAIT_MS = 1000;
export const REVEAL_LIMIT = 20;
export const REVEAL_WINDOW_MS = 10 * 60 * 1000;

export const revealLimiter = createRateLimiter(REVEAL_LIMIT, REVEAL_WINDOW_MS);

export interface RevealedWallet {
  readonly asset: string;
  readonly network: string;
  readonly networkLabel: string;
  readonly address: string;
  readonly memo: string | null;
  readonly warning: string;
  /** SVG markup of the QR code. */
  readonly qr: string;
}

export interface RevealResponse {
  readonly ok: boolean;
  readonly wallet?: RevealedWallet;
  readonly reason?: "invalid" | "rate_limited" | "not_found" | "unavailable";
}
