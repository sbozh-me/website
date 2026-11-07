import { hasTitleMarkup, plainTitle } from "@/lib/blog/title";
import { directusRest } from "@/lib/directus/rest";
import {
  postUrl,
  RELEASE_FIELDS,
  releaseTitle,
  releaseUrl,
  SITE_URL,
  type DirectusRelease,
} from "@/lib/feed/entries";
import { sendMail, smtpConfig } from "@/lib/mail";
import { getRecipients } from "@/lib/subscribers/service";
import { createToken } from "@/lib/subscribers/token";
import { TOPIC_LABELS, type Topic } from "@/lib/subscribers/topics";

/**
 * Emails subscribers about newly published posts and release notes.
 *
 * Directus flows only say "something may have changed" (on every save, and on a
 * schedule); this sweep decides what is due. An item is due when it is published,
 * its date has come, `notify_subscribers` is on and `announced_at` is empty.
 * `announced_at` is claimed BEFORE sending, so an item goes out at most once:
 * a crash mid-send can miss a few people, but never mails anyone twice.
 */

type Collection = "posts" | "release_notes";

export interface Announcement {
  collection: Collection;
  id: string;
  topic: Topic;
  subject: string;
  title: string;
  url: string;
  body: string;
  date: string;
}

export interface AnnouncementResult {
  collection: Collection;
  id: string;
  title: string;
  /** sent; stale = too old, marked without mail; taken = another sweep had it; failed = released for retry */
  outcome: "sent" | "stale" | "taken" | "failed";
  recipients: number;
  failed: number;
}

/** Older items are marked announced without mail: a backdated post or a forgotten toggle never blasts the archive */
export const MAX_AGE_MS = 3 * 24 * 60 * 60 * 1000;

/** Personal SMTP mailboxes throttle bursts */
const SEND_INTERVAL_MS = 1000;

/**
 * Releasing a failed claim is itself a save, which fires the on-save flow again.
 * Failed items sit out this long, so only the scheduled flow retries them, not a loop.
 */
export const RETRY_AFTER_MS = 10 * 60 * 1000;
const cooldown = new Map<string, number>();

interface DirectusPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  date_published: string;
}

function dueQuery(dateField: string, fields: string): string {
  return new URLSearchParams({
    "filter[status][_eq]": "published",
    "filter[notify_subscribers][_eq]": "true",
    "filter[announced_at][_null]": "true",
    [`filter[${dateField}][_lte]`]: "$NOW",
    fields,
    sort: dateField,
    limit: "-1",
  }).toString();
}

export async function findDue(): Promise<Announcement[]> {
  const [posts, releases] = await Promise.all([
    directusRest<{ data: DirectusPost[] }>(
      `/items/posts?${dueQuery("date_published", "id,title,slug,excerpt,date_published")}`
    ),
    directusRest<{ data: DirectusRelease[] }>(`/items/release_notes?${dueQuery("date_released", RELEASE_FIELDS)}`),
  ]);

  const postAnnouncements = await Promise.all(
    posts.data.map(async (post): Promise<Announcement> => {
      const title = hasTitleMarkup(post.title) ? await plainTitle(post.title) : post.title;
      return {
        collection: "posts",
        id: post.id,
        topic: "blog",
        subject: `New post: ${title}`,
        title,
        url: postUrl(post.slug),
        body: post.excerpt ?? "",
        date: post.date_published,
      };
    })
  );

  const releaseAnnouncements = releases.data.map((release): Announcement => {
    const title = releaseTitle(release);
    return {
      collection: "release_notes",
      id: release.id,
      topic: "releases",
      subject: title,
      title,
      url: releaseUrl(release),
      body: release.summary ?? "",
      date: release.date_released,
    };
  });

  return [...postAnnouncements, ...releaseAnnouncements];
}

/**
 * Sets announced_at only if it is still empty. Directus reads the matching keys and then
 * updates them, so this narrows the race rather than closing it; the in-process queue
 * below closes it for the single web container.
 */
async function claim(item: Announcement, now: number): Promise<boolean> {
  const { data } = await directusRest<{ data: unknown[] }>(`/items/${item.collection}?fields=id`, {
    method: "PATCH",
    body: JSON.stringify({
      query: { filter: { id: { _eq: item.id }, announced_at: { _null: true } } },
      data: { announced_at: new Date(now).toISOString() },
    }),
  });
  return data.length > 0;
}

async function release(item: Announcement): Promise<void> {
  await directusRest(`/items/${item.collection}/${item.id}`, {
    method: "PATCH",
    body: JSON.stringify({ announced_at: null }),
  });
}

export function composeEmail(item: Announcement, email: string) {
  const unsubscribeToken = createToken(email, "unsubscribe");
  return {
    to: email,
    subject: item.subject,
    text: [
      item.title,
      item.body.trim(),
      `Read it on sbozh.me: ${item.url}`,
      [
        "—",
        `You get this because you subscribed to ${TOPIC_LABELS[item.topic].toLowerCase()} from sbozh.me.`,
        `Unsubscribe: ${SITE_URL}/subscribe?token=${unsubscribeToken}`,
      ].join("\n"),
    ]
      .filter(Boolean)
      .join("\n\n"),
    headers: {
      // RFC 8058 one-click: mail clients POST here, no page visit needed
      "List-Unsubscribe": `<${SITE_URL}/api/unsubscribe?token=${unsubscribeToken}>`,
      "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
    },
  };
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function broadcast(item: Announcement, interval: number) {
  const recipients = await getRecipients(item.topic);
  let failed = 0;
  for (const [index, email] of recipients.entries()) {
    if (index > 0) await wait(interval);
    // sendMail logs SMTP errors itself and reports them as not delivered
    const { delivered } = await sendMail(composeEmail(item, email));
    if (!delivered) failed += 1;
  }
  return { recipients: recipients.length, failed };
}

export interface SweepOptions {
  now?: number;
  interval?: number;
}

async function sweep({ now = Date.now(), interval = SEND_INTERVAL_MS }: SweepOptions): Promise<AnnouncementResult[]> {
  const due = (await findDue()).filter((item) => (cooldown.get(`${item.collection}/${item.id}`) ?? 0) <= now);
  if (due.length === 0) return [];

  // Before any claim: without SMTP, sendMail only logs, and items must not be marked announced
  if (!smtpConfig()) throw new Error("SMTP is not configured");

  const results: AnnouncementResult[] = [];
  for (const item of due) {
    const base = { collection: item.collection, id: item.id, title: item.title, recipients: 0, failed: 0 };
    if (!(await claim(item, now))) {
      results.push({ ...base, outcome: "taken" });
      continue;
    }
    if (now - Date.parse(item.date) > MAX_AGE_MS) {
      results.push({ ...base, outcome: "stale" });
      continue;
    }
    const sent = await broadcast(item, interval);
    if (sent.recipients > 0 && sent.failed === sent.recipients) {
      // Nobody got it (SMTP down?): release the claim so the next sweep retries without duplicates
      await release(item);
      cooldown.set(`${item.collection}/${item.id}`, now + RETRY_AFTER_MS);
      results.push({ ...base, ...sent, outcome: "failed" });
      continue;
    }
    results.push({ ...base, ...sent, outcome: "sent" });
  }
  return results;
}

let queue: Promise<unknown> = Promise.resolve();

/**
 * Sweeps run one after another: a save during a sweep queues another one,
 * which then sees the fresh state instead of racing the first for the same items.
 */
export function runAnnouncements(options: SweepOptions = {}): Promise<AnnouncementResult[]> {
  const run = queue.then(() => sweep(options));
  queue = run.catch(() => undefined);
  return run;
}
