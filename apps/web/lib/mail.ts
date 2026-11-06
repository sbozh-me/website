// The mail transport — nodemailer over SMTP, straight from the server to
// mailbox.org. No API vendor in between. Same variables as tecraft.cz.
//
// ── The port matters more than anything else here ──────────────────────────
// Hetzner blocks outbound 25 AND 465 by default on cloud servers. mailbox.org
// offers 465 (implicit TLS) and 587 (STARTTLS); only **587** leaves a stock
// Hetzner box, so it is the default. If mail works locally and silently fails
// in production, this is the first thing to check.
//
// Unset SMTP_HOST/USER/PASSWORD is a working dev mode: the message is written
// to the server log and reported undelivered, so the contact form is walkable
// locally with no credentials at all.

import nodemailer from "nodemailer";

import type { Transporter } from "nodemailer";

export interface MailMessage {
  readonly to: string;
  readonly subject: string;
  readonly text: string;
  readonly html?: string;
  /**
   * Overrides `MAIL_FROM` for this one message ("Name <a@b.c>"). The SMTP
   * account must be allowed to send as it — mailbox.org rejects a From it
   * does not own.
   */
  readonly from?: string;
  /** Reply-To header — where an answer should go, when it differs from `from`. */
  readonly replyTo?: string;
}

export interface MailResult {
  /** False when nothing left the building — callers must not claim "sent". */
  readonly delivered: boolean;
}

interface SmtpConfig {
  readonly host: string;
  readonly port: number;
  readonly secure: boolean;
  readonly user: string;
  readonly pass: string;
  readonly from: string;
}

export function smtpConfig(): SmtpConfig | null {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD;
  if (!host || !user || !pass) return null;

  // 587 + STARTTLS by default (see the Hetzner note above). `secure` means
  // implicit TLS from the first byte, which is only correct for 465.
  const port = Number(process.env.SMTP_PORT ?? 587);
  return {
    from: process.env.MAIL_FROM || user,
    host,
    pass,
    port,
    secure: port === 465,
    user,
  };
}

// One pooled transporter per process: a transport per send would mean a fresh
// TCP + TLS + AUTH handshake every time, and mailbox.org counts connections.
let cached: { key: string; transporter: Transporter } | null = null;

function transporterFor(config: SmtpConfig): Transporter {
  const key = `${config.host}:${config.port}:${config.user}`;
  if (cached?.key === key) return cached.transporter;
  const transporter = nodemailer.createTransport({
    auth: { pass: config.pass, user: config.user },
    host: config.host,
    maxConnections: 2,
    pool: true,
    port: config.port,
    secure: config.secure,
    // Fail rather than hang when the port is blocked.
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 20_000,
  });
  cached = { key, transporter };
  return transporter;
}

export async function sendMail(message: MailMessage): Promise<MailResult> {
  const config = smtpConfig();

  if (!config) {
    console.info(
      `[mail] no SMTP_HOST/USER/PASSWORD — not sent. To: ${message.to}\n` +
        `[mail] ${message.subject}\n${message.text}`,
    );
    return { delivered: false };
  }

  try {
    await transporterFor(config).sendMail({
      from: message.from ?? config.from,
      html: message.html,
      replyTo: message.replyTo,
      subject: message.subject,
      text: message.text,
      to: message.to,
    });
    return { delivered: true };
  } catch (error) {
    console.error("[mail] SMTP send failed:", error);
    return { delivered: false };
  }
}
