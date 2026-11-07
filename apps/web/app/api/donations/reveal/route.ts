// POST /api/donations/reveal — hands out ONE donation address at a time.
//
// The /donate page renders only asset + network; addresses live in Directus
// (donation_wallets) behind the server token and never enter the HTML, so a
// crawler reading pages gets nothing. To get an address a client has to:
//   - send the wallet id it was shown (UUID, not guessable),
//   - leave the hidden `website` honeypot empty,
//   - ask no sooner than MIN_WAIT_MS after the page rendered,
//   - stay under a per-IP rate limit separate from the contact form's.
// The answer carries the address, the network warning and a QR code (SVG,
// generated here — no third-party QR service sees the address).

import { NextResponse } from "next/server";
import QRCode from "qrcode";

import { clientIp } from "@/lib/contact/rate-limit";
import { networkInfo } from "@/lib/donations/networks";
import {
  MIN_WAIT_MS,
  revealLimiter,
  type RevealResponse,
} from "@/lib/donations/reveal";
import { getWallet, UUID } from "@/lib/donations/repository";

const HEADERS = {
  "Cache-Control": "no-store",
  "X-Robots-Tag": "noindex, nofollow",
};

function reply(body: RevealResponse, status = 200) {
  return NextResponse.json(body, { headers: HEADERS, status });
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return reply({ ok: false, reason: "invalid" }, 400);
  }
  if (!body || typeof body !== "object") return reply({ ok: false, reason: "invalid" }, 400);

  const id = typeof body.id === "string" ? body.id : "";
  const startedAt = typeof body.startedAt === "number" ? body.startedAt : 0;
  const honeypot = typeof body.website === "string" ? body.website.trim() : "";

  const waited = Date.now() - startedAt;
  // No start time, a start in the future, or a too-quick reveal: a bot.
  if (!UUID.test(id) || honeypot || startedAt <= 0 || waited < MIN_WAIT_MS) {
    console.warn("[donations] reveal refused");
    return reply({ ok: false, reason: "invalid" }, 400);
  }

  if (revealLimiter.hit(clientIp(request))) {
    return reply({ ok: false, reason: "rate_limited" }, 429);
  }

  let wallet;
  try {
    wallet = await getWallet(id);
  } catch (error) {
    console.error("[donations] Directus read failed", error);
    return reply({ ok: false, reason: "unavailable" }, 502);
  }
  if (!wallet) return reply({ ok: false, reason: "not_found" }, 404);

  const info = networkInfo(wallet.network);
  const qr = await QRCode.toString(info.qrPayload(wallet.address), {
    color: { dark: "#0a0a0f", light: "#ffffff" },
    errorCorrectionLevel: "M",
    margin: 2,
    type: "svg",
  });

  return reply({
    ok: true,
    wallet: {
      address: wallet.address,
      asset: wallet.asset,
      memo: wallet.memo || null,
      network: wallet.network,
      networkLabel: info.label,
      qr,
      warning: wallet.warning?.trim() || info.warning(wallet.asset),
    },
  });
}
