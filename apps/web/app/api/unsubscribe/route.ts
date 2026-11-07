import { NextResponse } from "next/server";

import { applyToken } from "@/lib/subscribers/service";
import { verifyToken } from "@/lib/subscribers/token";

function unsubscribeToken(request: Request) {
  const token = new URL(request.url).searchParams.get("token") ?? "";
  const payload = verifyToken(token);
  return payload?.action === "unsubscribe" ? { token, payload } : null;
}

/**
 * RFC 8058 one-click unsubscribe from the List-Unsubscribe header. Mail clients send a
 * POST, which link scanners never do, so it can act without a confirmation page.
 */
export async function POST(request: Request) {
  const verified = unsubscribeToken(request);
  if (!verified) return NextResponse.json({ error: "Invalid link" }, { status: 400 });

  try {
    await applyToken(verified.payload);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[Unsubscribe API] Error:", error);
    return NextResponse.json({ error: "Could not unsubscribe, try again later" }, { status: 500 });
  }
}

/** A GET is a person (or a scanner) opening the link: show the page with the button instead */
export function GET(request: Request) {
  const verified = unsubscribeToken(request);
  const target = verified ? `/subscribe?token=${verified.token}` : "/subscribe";
  return NextResponse.redirect(new URL(target, "https://sbozh.me"), 303);
}
