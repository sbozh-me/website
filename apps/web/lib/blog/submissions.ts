// Anonymous post submissions from /blog/submit.
//
// A submission is raw text (SDS allowed) plus an optional title and pen name.
// It lands in the Directus `blog_submissions` collection as `new` and is never
// rendered on the site from there: Sem reads it in Directus, edits it, and
// copies what he accepts into `posts` by hand.
//
// Anonymity is a promise, so nothing here takes an identity: no email, no IP,
// no user agent. The route's rate limiter keeps IPs in process memory only.

import { createRateLimiter } from "@/lib/contact/rate-limit";
import { directusRest } from "@/lib/directus/rest";

import { MAX_CONTENT, MAX_PEN_NAME, MAX_TITLE, MIN_CONTENT } from "./submission-limits";

export { MAX_CONTENT, MAX_PEN_NAME, MAX_TITLE, MIN_CONTENT };

export interface SubmissionInput {
  readonly title: string | null;
  readonly pen_name: string | null;
  readonly content: string;
}

const oneLine = (value: string) => value.replace(/[\r\n]+/g, " ").trim();

/** Returns the cleaned submission, or null when it doesn't fit the limits. */
export function parseSubmission(body: unknown): SubmissionInput | null {
  if (!body || typeof body !== "object") return null;
  const record = body as Record<string, unknown>;
  const str = (value: unknown) => (typeof value === "string" ? value : "");

  const content = str(record.content).replace(/\r\n/g, "\n").trim();
  const title = oneLine(str(record.title));
  const penName = oneLine(str(record.penName));

  if (content.length < MIN_CONTENT || content.length > MAX_CONTENT) return null;
  if (title.length > MAX_TITLE || penName.length > MAX_PEN_NAME) return null;

  return { content, pen_name: penName || null, title: title || null };
}

/** Stores the submission as `new` and returns its id. */
export async function createSubmission(input: SubmissionInput): Promise<number> {
  const { data } = await directusRest<{ data: { id: number } }>("/items/blog_submissions", {
    body: JSON.stringify({ ...input, status: "new" }),
    method: "POST",
  });
  return data.id;
}

/** Three submissions per IP per hour, counted in memory only. */
const limiter = createRateLimiter(3, 60 * 60 * 1000);

/** Records a hit and returns true when the key is over the limit. */
export function submitRateLimited(key: string, now: number = Date.now()): boolean {
  return limiter.hit(key, now);
}

/** Test hook — the limiter is module state. */
export function resetSubmitRateLimit(): void {
  limiter.reset();
}
