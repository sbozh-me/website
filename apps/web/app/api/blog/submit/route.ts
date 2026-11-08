// POST /api/blog/submit — the anonymous /blog/submit form.
//
// Stores the text in Directus (`blog_submissions`, status `new`) and drops a
// short note in the inbox so Sem knows something is waiting. Nothing is
// published from here.
//
// Same self-hosted spam brake as /api/contact: a honeypot field, a minimum
// fill time and a per-IP limit held in memory. The IP is never stored with
// the text — that's the anonymity promise on the page.

import { NextResponse } from "next/server";

import { createSubmission, parseSubmission, submitRateLimited } from "@/lib/blog/submissions";
import { clientIp } from "@/lib/contact/rate-limit";
import { sendMail } from "@/lib/mail";
import { siteConfig } from "@/lib/site-config";

/** Writing a post takes longer than this; pasting one doesn't, but bots are faster still. */
const MIN_FILL_MS = 3000;

export interface SubmitResponse {
  readonly ok: boolean;
  readonly reason?: "invalid" | "rate_limited" | "store_failed";
}

function fail(reason: NonNullable<SubmitResponse["reason"]>, status: number) {
  return NextResponse.json({ ok: false, reason } satisfies SubmitResponse, { status });
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body || typeof body !== "object") return fail("invalid", 400);

  // Honeypot filled, or faster than a human: pretend it worked, store nothing.
  const startedAt = typeof body.startedAt === "number" ? body.startedAt : 0;
  if ((typeof body.website === "string" && body.website.trim()) || Date.now() - startedAt < MIN_FILL_MS) {
    console.warn("[blog-submit] dropped as bot");
    return NextResponse.json({ ok: true } satisfies SubmitResponse);
  }

  const submission = parseSubmission(body);
  if (!submission) return fail("invalid", 400);

  if (submitRateLimited(clientIp(request))) return fail("rate_limited", 429);

  let id: number;
  try {
    id = await createSubmission(submission);
  } catch (error) {
    console.error("[blog-submit] store failed:", error);
    return fail("store_failed", 502);
  }

  // Best effort: the text is already safe in Directus.
  const directusUrl = process.env.DIRECTUS_ADMIN_URL || "https://directus.sbozh.me";
  await sendMail({
    subject: `New anonymous submission${submission.title ? `: ${submission.title}` : ""}`,
    text: [
      `Signed: ${submission.pen_name ?? "nobody"}`,
      `${submission.content.length} characters. First lines:`,
      submission.content.slice(0, 400),
      `Review it: ${directusUrl}/admin/content/blog_submissions/${id}`,
    ].join("\n\n"),
    to: process.env.CONTACT_INBOX || siteConfig.email,
  }).catch((error) => console.error("[blog-submit] notification failed:", error));

  return NextResponse.json({ ok: true } satisfies SubmitResponse);
}
