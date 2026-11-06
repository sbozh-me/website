"use client";

import { useRef, useState } from "react";

import { Button } from "@sbozh/react-ui/components/ui/button";
import { Input } from "@sbozh/react-ui/components/ui/input";
import { Textarea } from "@sbozh/react-ui/components/ui/textarea";

import { useAnalytics } from "@/hooks/useAnalytics";
import { contactEmail } from "@/lib/site-config";

/**
 * Name (optional), email, message. POSTs to /api/contact, which mails the
 * inbox and sends the visitor an acknowledgement they can reply to.
 *
 * Bot brake without a third party: a visually hidden `website` field that
 * humans never fill, and the time the form was rendered (`startedAt`) so the
 * server can drop instant submissions.
 */
export function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [website, setWebsite] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<"idle" | "sent" | "error" | "rate_limited">("idle");
  const startedAt = useRef(Date.now());
  const { track } = useAnalytics();

  if (status === "sent") {
    return (
      <p aria-live="polite" className="mt-10 border-t border-border pt-8 text-muted-foreground">
        Thanks — your message is on its way. A copy went to your inbox; reply
        to it any time to add something.
      </p>
    );
  }

  return (
    <form
      className="mt-10 flex flex-col gap-4 border-t border-border pt-8"
      onSubmit={async (event) => {
        event.preventDefault();
        setBusy(true);
        setStatus("idle");
        try {
          const response = await fetch("/api/contact", {
            body: JSON.stringify({
              email,
              message,
              name,
              startedAt: startedAt.current,
              website,
            }),
            headers: { "content-type": "application/json" },
            method: "POST",
          });
          if (response.status === 429) {
            setStatus("rate_limited");
            return;
          }
          if (!response.ok) throw new Error(`contact ${response.status}`);
          setStatus("sent");
          // Only that a message was sent — never who or what.
          track("contact_sent", { where: "contact_page" });
        } catch {
          // Keep the typed message so a retry is one click, not a re-type.
          setStatus("error");
        } finally {
          setBusy(false);
        }
      }}
    >
      <Input
        aria-label="Name (optional)"
        autoComplete="name"
        maxLength={120}
        onChange={(event) => setName(event.target.value)}
        placeholder="Name (optional)"
        type="text"
        value={name}
      />

      <Input
        aria-label="Email"
        autoComplete="email"
        maxLength={254}
        onChange={(event) => setEmail(event.target.value)}
        placeholder="Email"
        required
        type="email"
        value={email}
      />

      <Textarea
        aria-label="Message"
        className="min-h-40 resize-y"
        maxLength={5000}
        onChange={(event) => setMessage(event.target.value)}
        placeholder="Message"
        required
        value={message}
      />

      {/* Honeypot — off-screen, skipped by keyboard and screen readers. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label>
          Website
          <input
            autoComplete="off"
            name="website"
            onChange={(event) => setWebsite(event.target.value)}
            tabIndex={-1}
            type="text"
            value={website}
          />
        </label>
      </div>

      <Button className="self-start" disabled={busy} type="submit">
        {busy ? "Sending…" : "Send message"}
      </Button>

      {status === "error" && (
        <p aria-live="polite" className="text-sm text-muted-foreground">
          Something went wrong and the message was not sent. Please try again,
          or write me directly at{" "}
          <a className="text-primary hover:underline" href={`mailto:${contactEmail}`}>
            {contactEmail}
          </a>
          .
        </p>
      )}
      {status === "rate_limited" && (
        <p aria-live="polite" className="text-sm text-muted-foreground">
          Too many messages in a short time. Please wait a few minutes, or write
          me directly at{" "}
          <a className="text-primary hover:underline" href={`mailto:${contactEmail}`}>
            {contactEmail}
          </a>
          .
        </p>
      )}
    </form>
  );
}
