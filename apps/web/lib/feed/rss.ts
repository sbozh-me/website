import { TOPIC_LABELS } from "@/lib/subscribers/topics";

import type { FeedChannel } from "./channels";
import { SITE_URL, type FeedEntry } from "./entries";

export type FeedFormat = "rss" | "atom";

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
    `<atom:link href="${SITE_URL}${channel.rss}" rel="self" type="application/rss+xml"/>`,
    lastBuildDate,
    ...items,
    "</channel>",
    "</rss>",
  ].join("");
}

// Atom requires an <updated> on the feed even when it is empty
const EPOCH = new Date(0).toISOString();

export function renderAtom(channel: FeedChannel, entries: FeedEntry[]): string {
  const items = entries.map((entry) => {
    const date = new Date(entry.date).toISOString();
    return [
      "<entry>",
      `<title>${escapeXml(entry.title)}</title>`,
      `<link href="${entry.url}"/>`,
      `<id>${entry.url}</id>`,
      `<published>${date}</published>`,
      `<updated>${date}</updated>`,
      `<category term="${entry.topic}" label="${TOPIC_LABELS[entry.topic]}"/>`,
      `<summary>${escapeXml(entry.description)}</summary>`,
      "</entry>",
    ].join("");
  });

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<feed xmlns="http://www.w3.org/2005/Atom">',
    `<title>${escapeXml(channel.title)}</title>`,
    `<subtitle>${escapeXml(channel.description)}</subtitle>`,
    `<id>${SITE_URL}${channel.atom}</id>`,
    `<link href="${SITE_URL}${channel.link}"/>`,
    `<link href="${SITE_URL}${channel.atom}" rel="self" type="application/atom+xml"/>`,
    `<updated>${entries[0] ? new Date(entries[0].date).toISOString() : EPOCH}</updated>`,
    "<author><name>Sem Bozhyk</name></author>",
    ...items,
    "</feed>",
  ].join("");
}

const FORMATS = {
  rss: { render: renderRss, contentType: "application/rss+xml; charset=utf-8" },
  atom: { render: renderAtom, contentType: "application/atom+xml; charset=utf-8" },
};

/** Feed route body: a 503 rather than an empty feed, which readers take as "everything was removed" */
export async function feedResponse(channel: FeedChannel, format: FeedFormat): Promise<Response> {
  const { render, contentType } = FORMATS[format];
  try {
    return new Response(render(channel, await channel.load()), {
      headers: { "Content-Type": contentType, "Cache-Control": "public, max-age=900" },
    });
  } catch (error) {
    console.error(`[Feed] Failed to build ${channel[format]}:`, error);
    return new Response("Feed temporarily unavailable", { status: 503 });
  }
}
