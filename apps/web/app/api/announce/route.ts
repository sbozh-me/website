import { createHash, timingSafeEqual } from "node:crypto";
import { after, NextResponse } from "next/server";

import { runAnnouncements } from "@/lib/announcements/service";

function digest(value: string) {
  return createHash("sha256").update(value).digest();
}

function isAuthorized(request: Request): boolean {
  const secret = process.env.ANNOUNCE_SECRET;
  if (!secret) return false;
  // Hashing first gives equal lengths, so timingSafeEqual can't throw or leak the length
  return timingSafeEqual(digest(request.headers.get("x-announce-secret") ?? ""), digest(secret));
}

/**
 * Called by the Directus flows (deploy/directus/flows): on every save of a post or
 * release note, and every 15 minutes. It never trusts the caller about WHAT changed;
 * it sweeps for everything due. Answers at once and sends in the background, so a slow
 * mailbox can't time the flow out.
 */
export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  after(async () => {
    try {
      const results = await runAnnouncements();
      if (results.length > 0) console.log("[Announce]", JSON.stringify(results));
    } catch (error) {
      console.error("[Announce] Sweep failed:", error);
    }
  });

  return NextResponse.json({ ok: true }, { status: 202 });
}
