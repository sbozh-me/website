"use client";

import { useEffect, useRef, useState } from "react";

import { Button } from "@sbozh/react-ui/components/ui/button";
import { Input } from "@sbozh/react-ui/components/ui/input";
import { Switch } from "@sbozh/react-ui/components/ui/switch";

import { useAnalytics } from "@/hooks/useAnalytics";
import {
  MAX_CONTENT,
  MAX_PEN_NAME,
  MAX_TITLE,
  MIN_CONTENT,
} from "@/lib/blog/submission-limits";

import { MarkdownEditor } from "./MarkdownEditor";
import { SubmissionPreview } from "./SubmissionPreview";

/** The unsent draft stays in this browser only, so a closed tab doesn't eat a long text. */
const DRAFT_KEY = "blog-submit-draft";

/** Blocks around the preview; the page sets the width (the blog grid's max-w-6xl). */
const NARROW = "w-full";

type Status = "idle" | "sent" | "error" | "rate_limited" | "invalid";

interface Draft {
  title: string;
  penName: string;
  content: string;
}

function readDraft(): Draft | null {
  try {
    const raw = window.localStorage.getItem(DRAFT_KEY);
    return raw ? (JSON.parse(raw) as Draft) : null;
  } catch {
    return null;
  }
}

function writeDraft(draft: Draft | null) {
  try {
    if (draft) window.localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    else window.localStorage.removeItem(DRAFT_KEY);
  } catch {
    // Private window or blocked storage: the draft just isn't kept.
  }
}

/**
 * Title and pen name (both optional), the text, and a consent switch.
 * POSTs to /api/blog/submit. Same bot brake as the contact form: a hidden
 * `website` honeypot and the render time (`startedAt`).
 */
export function SubmitForm() {
  const [title, setTitle] = useState("");
  const [penName, setPenName] = useState("");
  const [content, setContent] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [mode, setMode] = useState<"write" | "preview">("write");
  const [website, setWebsite] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const startedAt = useRef(Date.now());
  const restored = useRef(false);
  const { track } = useAnalytics();

  useEffect(() => {
    const draft = readDraft();
    if (draft) {
      setTitle(draft.title ?? "");
      setPenName(draft.penName ?? "");
      setContent(draft.content ?? "");
    }
    restored.current = true;
  }, []);

  useEffect(() => {
    if (!restored.current || status === "sent") return;
    writeDraft(
      title || penName || content ? { content, penName, title } : null,
    );
  }, [title, penName, content, status]);

  if (status === "sent") {
    return (
      <div
        aria-live="polite"
        className="mt-10 border-t border-border pt-8 text-muted-foreground"
      >
        <p className="text-foreground">Sent. Thank you.</p>
        <p className="mt-2">
          Your text is waiting to be read. It may be published, redacted or
          cancelled, and nobody can trace it back to you.
        </p>
        <Button
          className="mt-6"
          onClick={() => {
            setTitle("");
            setPenName("");
            setContent("");
            setAgreed(false);
            setMode("write");
            startedAt.current = Date.now();
            setStatus("idle");
          }}
          size="sm"
          variant="outline"
        >
          Write another
        </Button>
      </div>
    );
  }

  const length = content.trim().length;
  const tooShort = length < MIN_CONTENT;

  return (
    <form
      className="mt-10 flex flex-col gap-4"
      onSubmit={async (event) => {
        event.preventDefault();
        if (tooShort || !agreed) return;
        setBusy(true);
        setStatus("idle");
        try {
          const response = await fetch("/api/blog/submit", {
            body: JSON.stringify({
              content,
              penName,
              startedAt: startedAt.current,
              title,
              website,
            }),
            headers: { "content-type": "application/json" },
            method: "POST",
          });
          if (response.status === 429) return setStatus("rate_limited");
          if (response.status === 400) return setStatus("invalid");
          if (!response.ok) throw new Error(`submit ${response.status}`);
          writeDraft(null);
          setStatus("sent");
          // Only that something was sent — never what or by whom.
          track("blog_submission_sent", { where: "blog_submit" });
        } catch {
          // Keep the text so a retry is one click.
          setStatus("error");
        } finally {
          setBusy(false);
        }
      }}
    >
      <div
        className={`${NARROW} flex flex-col gap-4 border-t border-border pt-8`}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            aria-label="Title (optional)"
            maxLength={MAX_TITLE}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Title (optional)"
            type="text"
            value={title}
          />
          <Input
            aria-label="Pen name (optional)"
            autoComplete="off"
            maxLength={MAX_PEN_NAME}
            onChange={(event) => setPenName(event.target.value)}
            placeholder="Pen name (optional)"
            type="text"
            value={penName}
          />
        </div>

        <div role="tablist" aria-label="Editor" className="flex gap-2">
          {(["write", "preview"] as const).map((tab) => (
            <Button
              key={tab}
              aria-selected={mode === tab}
              onClick={() => setMode(tab)}
              role="tab"
              size="sm"
              type="button"
              variant={mode === tab ? "default" : "outline"}
            >
              {tab === "write" ? "Write" : "Preview"}
            </Button>
          ))}
        </div>
      </div>

      {mode === "preview" ? (
        <SubmissionPreview content={content} penName={penName} title={title} />
      ) : (
        <div className={NARROW}>
          <MarkdownEditor
            label="Your text"
            maxLength={MAX_CONTENT}
            onChange={setContent}
            placeholder={"Write here. ==Words|teal:meanings== welcome."}
            value={content}
          />
        </div>
      )}
      <div className={`${NARROW} flex flex-col gap-4`}>
        <p className="-mt-2 text-right text-xs text-muted-foreground">
          {length.toLocaleString("en")} / {MAX_CONTENT.toLocaleString("en")}
          {tooShort && length > 0 ? ` · at least ${MIN_CONTENT}` : ""}
        </p>

        <label className="flex items-start gap-3 text-sm text-muted-foreground">
          <Switch
            aria-label="I understand the rules"
            checked={agreed}
            className="mt-0.5"
            onCheckedChange={setAgreed}
          />
          <span>
            I understand my text may be redacted or never published, that I
            can&apos;t take it back after sending, and that sbozh.me may publish
            it under my pen name or as Anonymous.
          </span>
        </label>

        {/* Honeypot — off-screen, skipped by keyboard and screen readers. */}
        <div
          aria-hidden="true"
          className="absolute -left-[9999px] h-px w-px overflow-hidden"
        >
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

        <Button
          className="self-start"
          disabled={busy || tooShort || !agreed}
          type="submit"
        >
          {busy ? "Sending…" : "Submit anonymously"}
        </Button>

        {status === "error" && (
          <p aria-live="polite" className="text-sm text-muted-foreground">
            Something went wrong and nothing was sent. Your text is still here,
            try again in a minute.
          </p>
        )}
        {status === "invalid" && (
          <p aria-live="polite" className="text-sm text-muted-foreground">
            The text is too short or too long. Between {MIN_CONTENT} and{" "}
            {MAX_CONTENT.toLocaleString("en")} characters, please.
          </p>
        )}
        {status === "rate_limited" && (
          <p aria-live="polite" className="text-sm text-muted-foreground">
            Too many texts in a short time. Your draft is kept in this browser,
            come back in an hour.
          </p>
        )}
      </div>
    </form>
  );
}
