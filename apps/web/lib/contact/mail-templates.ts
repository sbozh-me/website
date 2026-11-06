// The two letters a contact-form submission produces, in the Roman Empire
// house style (packages/themes/src/roman-empire): travertine vellum, basalt
// text, oxidized-bronze rules, Tyrian purple for the heading only, Cinzel
// capitals — "a senatorial dossier rendered by an engineer".
//
//  1. `contactNotificationMail` — to the inbox (CONTACT_INBOX). The visitor's
//     letter and identity; the route sets Reply-To to the visitor, so
//     answering it from the mailbox reaches them directly.
//  2. `contactAckMail` — to the visitor, from noreply (MAIL_FROM) with
//     Reply-To set to the inbox: the scriptorium's receipt, echoing their
//     words, so a reply still lands with Sem.
//
// Email clients ignore most CSS, so this is table layout with inline styles;
// Cinzel is requested but every heading falls back to a serif.

import { romanDateLine } from "./roman-date";

export interface RenderedMail {
  readonly subject: string;
  readonly text: string;
  readonly html: string;
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const C = {
  vellum: "#F4EFE6",
  basalt: "#1C1A17",
  stone: "#5C5346",
  bronze: "#6E4A1F",
  tyrian: "#4A1C2A",
  mortar: "#C9BFA8",
} as const;

const CAPITALS = "'Cinzel','Trajan Pro',Georgia,'Times New Roman',serif";
const BODY = "Inter,-apple-system,'Segoe UI',Helvetica,Arial,sans-serif";
const MONO = "'JetBrains Mono',Menlo,Consolas,monospace";

interface Letter {
  /** Small capitals above the heading — the office the letter comes from. */
  readonly seal: string;
  readonly heading: string;
  /** Inbox preview line. */
  readonly preheader: string;
  readonly paragraphs: readonly string[];
  /** Caption above the quoted message. */
  readonly quoteLabel: string;
  readonly quote: string;
  readonly closing: string;
  readonly signature: string;
  readonly footnote: string;
  readonly dateLine: string;
}

function renderHtml(letter: Letter): string {
  const p = (text: string) =>
    `<p style="margin:0 0 16px;font-family:${BODY};font-size:15px;line-height:1.6;color:${C.basalt};">${escapeHtml(text)}</p>`;

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@600&display=swap" rel="stylesheet">
<title>${escapeHtml(letter.heading)}</title>
</head>
<body style="margin:0;padding:0;background:${C.vellum};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(letter.preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.vellum};">
  <tr><td align="center" style="padding:32px 16px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;border-top:3px solid ${C.bronze};border-bottom:1px solid ${C.mortar};">
      <tr><td style="padding:28px 4px 8px;">
        <p style="margin:0 0 6px;font-family:${CAPITALS};font-size:11px;letter-spacing:0.28em;text-transform:uppercase;color:${C.bronze};">${escapeHtml(letter.seal)}</p>
        <h1 style="margin:0 0 6px;font-family:${CAPITALS};font-weight:600;font-size:26px;letter-spacing:0.06em;text-transform:uppercase;color:${C.tyrian};">${escapeHtml(letter.heading)}</h1>
        <p style="margin:0 0 24px;font-family:${MONO};font-size:11px;letter-spacing:0.08em;color:${C.stone};">${escapeHtml(letter.dateLine)}</p>
        ${letter.paragraphs.map(p).join("\n        ")}
        <p style="margin:8px 0 6px;font-family:${CAPITALS};font-size:11px;letter-spacing:0.22em;text-transform:uppercase;color:${C.stone};">${escapeHtml(letter.quoteLabel)}</p>
        <div style="margin:0 0 24px;padding:14px 18px;border-left:2px solid ${C.bronze};background:#EDE6D9;font-family:${BODY};font-size:14px;line-height:1.6;color:${C.basalt};white-space:pre-wrap;">${escapeHtml(letter.quote)}</div>
        <p style="margin:0 0 2px;font-family:${BODY};font-size:15px;color:${C.basalt};">${escapeHtml(letter.closing)}</p>
        <p style="margin:0 0 28px;font-family:${CAPITALS};font-size:13px;letter-spacing:0.14em;text-transform:uppercase;color:${C.tyrian};">${escapeHtml(letter.signature)}</p>
      </td></tr>
      <tr><td style="padding:14px 4px 24px;border-top:1px solid ${C.mortar};">
        <p style="margin:0;font-family:${BODY};font-size:12px;line-height:1.6;color:${C.stone};">${escapeHtml(letter.footnote)}</p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>`;
}

function renderText(letter: Letter): string {
  const quoted = letter.quote
    .split("\n")
    .map((line) => `> ${line}`)
    .join("\n");
  return [
    letter.seal.toUpperCase(),
    letter.heading.toUpperCase(),
    letter.dateLine,
    "",
    ...letter.paragraphs.flatMap((p) => [p, ""]),
    `${letter.quoteLabel}:`,
    quoted,
    "",
    letter.closing,
    letter.signature,
    "",
    "—",
    letter.footnote,
    "",
  ].join("\n");
}

function render(subject: string, letter: Letter): RenderedMail {
  return { subject, text: renderText(letter), html: renderHtml(letter) };
}

export interface ContactNotificationProps {
  /** Empty when the sender left it blank. */
  readonly name: string;
  readonly email: string;
  readonly message: string;
  readonly date?: Date;
}

/** To Sem: a letter has arrived at the gates. */
export function contactNotificationMail({
  date = new Date(),
  email,
  message,
  name,
}: ContactNotificationProps): RenderedMail {
  const who = name ? `${name} <${email}>` : email;
  return render(`Nuntius: a letter from ${name || email}`, {
    seal: "Tabularium · sbozh.me",
    heading: "Nuntius advenit",
    preheader: `A letter from ${who} awaits your answer.`,
    dateLine: romanDateLine(date),
    paragraphs: [
      "Ave, Sem. A courier of the cursus publicus has reached the gates of sbozh.me and laid this letter before you.",
      `It bears the seal of ${who}.`,
    ],
    quoteLabel: "The letter",
    quote: message,
    closing: "Answer it as you see fit — a reply to this scroll travels straight to the sender.",
    signature: "The Scriptorium",
    footnote: "Filed by the contact form at sbozh.me/contact.",
  });
}

export interface ContactAckProps {
  readonly name: string;
  readonly message: string;
  readonly date?: Date;
}

/** To the visitor: the scriptorium's receipt, echoing their letter. */
export function contactAckMail({ date = new Date(), message, name }: ContactAckProps): RenderedMail {
  return render("Litterae acceptae — your letter reached sbozh.me", {
    seal: "Scriptorium · sbozh.me",
    heading: "Litterae acceptae",
    preheader: "Your letter is sealed in the tabularium. Sem will answer it personally.",
    dateLine: romanDateLine(date),
    paragraphs: [
      name ? `Salve, ${name}.` : "Salve, traveller.",
      "Your letter has crossed the cursus publicus and now lies sealed in the tabularium of sbozh.me. No clerk will answer in Sem's stead: every scroll is read by Sem personally, and a reply will be written as soon as the day's campaigns allow.",
      "Below is a faithful copy of your words, as they were entrusted to us.",
    ],
    quoteLabel: "Exemplum",
    quote: message,
    closing: "Vale.",
    signature: "The Scriptorium of sbozh.me",
    footnote:
      "This receipt was dispatched by the scribes from noreply@sbozh.me. To add to your letter, simply reply — the courier will carry it straight to Sem.",
  });
}
