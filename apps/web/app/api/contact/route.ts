// POST /api/contact — the /contact page form.
//
// Two mails leave here (same flow as tecraft.cz):
//   1. a notification to the inbox (CONTACT_INBOX, default siteConfig.email)
//      with Reply-To set to the visitor, so answering it reaches them;
//   2. a Roman-styled acknowledgement to the visitor, from noreply (MAIL_FROM,
//      or CONTACT_FROM if set) with Reply-To = the inbox, echoing their
//      message — their reply still lands with Sem.
//
// Spam brake is self-hosted (no third-party captcha): a hidden honeypot field,
// a minimum fill time, and a small per-IP rate limit held in memory.
//
// With no SMTP configured mail.ts logs instead of sending and the route still
// answers ok, so the form is walkable locally. In production a notification
// that failed to send is a 502, so the visitor knows to use email instead.

import { NextResponse } from "next/server";

import { contactAckMail, contactNotificationMail } from "@/lib/contact/mail-templates";
import { clientIp, rateLimited } from "@/lib/contact/rate-limit";
import { sendMail, smtpConfig } from "@/lib/mail";
import { siteConfig } from "@/lib/site-config";

/** Deliberately loose — the real proof of an address is that a reply arrives. */
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const MAX_NAME = 120;
const MAX_EMAIL = 254;
const MAX_MESSAGE = 5000;

/** Submissions faster than this after the form rendered are bots. */
const MIN_FILL_MS = 2000;

export interface ContactResponse {
  readonly ok: boolean;
  /** Whether the notification actually left — false in dev mode. */
  readonly delivered?: boolean;
  readonly reason?: "invalid" | "rate_limited" | "send_failed";
}

function fail(reason: NonNullable<ContactResponse["reason"]>, status: number) {
  return NextResponse.json({ ok: false, reason } satisfies ContactResponse, { status });
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return fail("invalid", 400);
  }
  if (!body || typeof body !== "object") return fail("invalid", 400);

  const str = (value: unknown) => (typeof value === "string" ? value.trim() : "");
  const email = str(body.email);
  const message = str(body.message);
  const name = str(body.name).slice(0, MAX_NAME).replace(/[\r\n]+/g, " ");

  if (
    !EMAIL.test(email) ||
    email.length > MAX_EMAIL ||
    !message ||
    message.length > MAX_MESSAGE
  ) {
    return fail("invalid", 400);
  }

  // Honeypot filled, or submitted faster than a human types: pretend it went
  // through so the bot learns nothing, and send nothing.
  const startedAt = typeof body.startedAt === "number" ? body.startedAt : 0;
  if (str(body.website) || Date.now() - startedAt < MIN_FILL_MS) {
    console.warn("[contact] dropped as bot");
    return NextResponse.json({ ok: true, delivered: false } satisfies ContactResponse);
  }

  if (rateLimited(clientIp(request))) {
    return fail("rate_limited", 429);
  }

  const inbox = process.env.CONTACT_INBOX || siteConfig.email;
  // Unset → MAIL_FROM (noreply@sbozh.me) via mail.ts.
  const from = process.env.CONTACT_FROM || undefined;

  const notification = await sendMail({
    ...contactNotificationMail({ email, message, name }),
    replyTo: email,
    to: inbox,
  });

  if (!notification.delivered && smtpConfig()) {
    return fail("send_failed", 502);
  }

  // The acknowledgement. Its failure must not fail the request — the message
  // is already in the inbox by now. Reply-To is the inbox, since it leaves
  // from noreply.
  await sendMail({
    ...contactAckMail({ message, name }),
    from,
    replyTo: inbox,
    to: email,
  });

  return NextResponse.json({
    delivered: notification.delivered,
    ok: true,
  } satisfies ContactResponse);
}
