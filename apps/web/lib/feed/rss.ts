import { TOPIC_LABELS } from "@/lib/subscribers/topics";

import { SITE_URL, type FeedEntry } from "./entries";

export interface FeedChannel {
  title: string;
  /** Path of the HTML page the feed mirrors, e.g. "/blog" */
  link: string;
  description: string;
  /** Path the feed itself is served at, e.g. "/rss.xml" */
  self: string;
}

// Control characters are illegal in XML 1.0 and make readers reject the whole feed
export function escapeXml(value: string): string {
  return value
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function renderRss(channel: FeedChannel, entries: FeedEntry[]): string {
  const items = entries.map((entry) =>
    [
      "<item>",
      `<title>${escapeXml(entry.title)}</title>`,
      `<link>${entry.url}</link>`,
      `<guid isPermaLink="true">${entry.url}</guid>`,
      `<pubDate>${new Date(entry.date).toUTCString()}</pubDate>`,
      `<category>${TOPIC_LABELS[entry.topic]}</category>`,
      `<description>${escapeXml(entry.description)}</description>`,
      "</item>",
    ].join("")
  );

  const lastBuildDate = entries[0]
    ? `<lastBuildDate>${new Date(entries[0].date).toUTCString()}</lastBuildDate>`
    : "";

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
    "<channel>",
    `<title>${escapeXml(channel.title)}</title>`,
    `<link>${SITE_URL}${channel.link}</link>`,
    `<description>${escapeXml(channel.description)}</description>`,
    `<atom:link href="${SITE_URL}${channel.self}" rel="self" type="application/rss+xml"/>`,
    lastBuildDate,
    ...items,
    "</channel>",
    "</rss>",
  ].join("");
}

/** Feed route body: a 503 rather than an empty feed, which readers take as "everything was removed" */
export async function feedResponse(channel: FeedChannel, load: () => Promise<FeedEntry[]>): Promise<Response> {
  try {
    return new Response(renderRss(channel, await load()), {
      headers: {
        "Content-Type": "application/rss+xml; charset=utf-8",
        "Cache-Control": "public, max-age=900",
      },
    });
  } catch (error) {
    console.error(`[RSS] Failed to build ${channel.self}:`, error);
    return new Response("Feed temporarily unavailable", { status: 503 });
  }
}
