import { directusRest } from "@/lib/directus/rest";
import { sendMail, smtpConfig } from "@/lib/mail";

import { SITE_URL } from "@/lib/feed/entries";

import { createToken, type TokenPayload } from "./token";
import { describeTopics, TOPICS, type Topic } from "./topics";

type SubscriberStatus = "pending" | "confirmed" | "unsubscribed";

interface Subscriber {
  id: number;
  status: SubscriberStatus;
  confirmation_sent_at: string | null;
}

/** A pending address gets at most one confirmation email per hour */
const RESEND_AFTER_MS = 60 * 60 * 1000;


function subscribers(path: string, init?: RequestInit) {
  return directusRest<{ data: unknown }>(`/items/subscribers${path}`, init);
}

async function findSubscriber(email: string): Promise<Subscriber | null> {
  const query = new URLSearchParams({
    "filter[email][_eq]": email,
    fields: "id,status,confirmation_sent_at",
    limit: "1",
  });
  const { data } = (await subscribers(`?${query}`)) as { data: Subscriber[] };
  return data[0] ?? null;
}

async function sendConfirmation(email: string, topics: Topic[], now: number, isUpdate: boolean) {
  const url = `${SITE_URL}/subscribe?token=${createToken(email, "confirm", now, topics)}`;
  const { delivered } = await sendMail({
    to: email,
    subject: isUpdate ? "Confirm your sbozh.me subscription change" : "Confirm your sbozh.me subscription",
    text: [
      isUpdate
        ? `Someone asked to change what sbozh.me sends to this address: ${describeTopics(topics)}.`
        : `Someone asked to send ${describeTopics(topics)} from sbozh.me to this address.`,
      `Confirm here: ${url}`,
      "If it wasn't you, ignore this email and nothing will change.",
    ].join("\n\n"),
  });
  // Without SMTP config (local dev) sendMail logs the mail instead; only a real failure is an error
  if (!delivered && smtpConfig()) throw new Error("Confirmation mail was not delivered");
}

/**
 * Starts double opt-in. Resolves the same way for new, pending and confirmed addresses,
 * so the signup form can't be used to find out who is subscribed. A confirmed address
 * gets a confirmation for the new topics; nothing changes until it is confirmed.
 */
export async function requestSubscription(
  email: string,
  topics: Topic[] = [...TOPICS],
  now = Date.now()
): Promise<void> {
  const subscriber = await findSubscriber(email);

  const sentAt = subscriber?.confirmation_sent_at;
  const recentlySent = sentAt && now - Date.parse(sentAt) < RESEND_AFTER_MS;
  if (subscriber?.status !== "unsubscribed" && recentlySent) return;

  const confirmation_sent_at = new Date(now).toISOString();
  if (!subscriber) {
    await subscribers("", {
      method: "POST",
      body: JSON.stringify({ email, status: "pending", confirmation_sent_at }),
    });
  } else if (subscriber.status === "confirmed") {
    // Stays confirmed with the old topics until the new link is used
    await subscribers(`/${subscriber.id}`, { method: "PATCH", body: JSON.stringify({ confirmation_sent_at }) });
  } else {
    await subscribers(`/${subscriber.id}`, {
      method: "PATCH",
      body: JSON.stringify({ status: "pending", confirmation_sent_at }),
    });
  }

  await sendConfirmation(email, topics, now, subscriber?.status === "confirmed");
}

/** Applies a verified confirm or unsubscribe token. */
export async function applyToken({ email, action, topics }: TokenPayload, now = Date.now()): Promise<void> {
  const subscriber = await findSubscriber(email);
  if (!subscriber) return;

  const timestamp = new Date(now).toISOString();
  const update =
    action === "confirm"
      ? {
          status: "confirmed",
          confirmed_at: timestamp,
          unsubscribed_at: null,
          // Links sent before topics existed carry none: keep what Directus has
          ...(topics?.length ? { topics } : {}),
        }
      : { status: "unsubscribed", unsubscribed_at: timestamp };

  await subscribers(`/${subscriber.id}`, { method: "PATCH", body: JSON.stringify(update) });
}

/** Confirmed addresses that want this topic */
export async function getRecipients(topic: Topic): Promise<string[]> {
  const query = new URLSearchParams({
    "filter[status][_eq]": "confirmed",
    "filter[topics][_contains]": topic,
    fields: "email",
    limit: "-1",
  });
  const { data } = (await subscribers(`?${query}`)) as { data: { email: string }[] };
  return data.map(({ email }) => email);
}
