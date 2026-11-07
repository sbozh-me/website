import { NextResponse } from "next/server";

import { requestSubscription } from "@/lib/subscribers/service";
import { parseTopics, TOPICS } from "@/lib/subscribers/topics";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_EMAIL_LENGTH = 254;

const RATE_LIMIT = 5;
const RATE_WINDOW_MS = 60 * 60 * 1000;
const attempts = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(ip: string, now = Date.now()): boolean {
  // Expired entries are dropped here so the map can't grow without bound
  for (const [key, entry] of attempts) {
    if (entry.resetAt <= now) attempts.delete(key);
  }
  const entry = attempts.get(ip) ?? { count: 0, resetAt: now + RATE_WINDOW_MS };
  entry.count += 1;
  attempts.set(ip, entry);
  return entry.count > RATE_LIMIT;
}

export async function POST(request: Request) {
  // Nginx appends the real client, so the last entry is the one a client can't spoof
  const ip = request.headers.get("x-forwarded-for")?.split(",").pop()?.trim() ?? "unknown";
  if (isRateLimited(ip)) {
    return NextResponse.json({ error: "Too many attempts, try again later" }, { status: 429 });
  }

  const body = await request.json().catch(() => null);

  // Honeypot: hidden from people, filled in by bots. Pretend it worked.
  if (body?.website) return NextResponse.json({ ok: true });

  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  if (email.length > MAX_EMAIL_LENGTH || !EMAIL_PATTERN.test(email)) {
    return NextResponse.json({ error: "Enter a valid email address" }, { status: 400 });
  }

  // Older clients send no topics: they get everything
  const topics = body?.topics === undefined ? [...TOPICS] : parseTopics(body.topics);
  if (topics.length === 0) {
    return NextResponse.json({ error: "Pick at least one thing to get" }, { status: 400 });
  }

  try {
    await requestSubscription(email, topics);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[Subscribe API] Error:", error);
    return NextResponse.json({ error: "Could not subscribe, try again later" }, { status: 500 });
  }
}
