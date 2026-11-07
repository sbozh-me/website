"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";

import { Button } from "@sbozh/react-ui/components/ui/button";
import { Input } from "@sbozh/react-ui/components/ui/input";
import { Switch } from "@sbozh/react-ui/components/ui/switch";

import { TOPIC_LABELS, TOPICS, type Topic } from "@/lib/subscribers/topics";

type FormState = "idle" | "sending" | "sent" | "error";

export function SubscribeForm() {
  const [state, setState] = useState<FormState>("idle");
  const [error, setError] = useState("");
  const [topics, setTopics] = useState<Topic[]>([...TOPICS]);

  function toggleTopic(topic: Topic, checked: boolean) {
    setTopics((current) => TOPICS.filter((t) => (t === topic ? checked : current.includes(t))));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState("sending");

    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.get("email"), website: form.get("website"), topics }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.error ?? "Could not subscribe, try again later");
      }
      setState("sent");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not subscribe, try again later");
      setState("error");
    }
  }

  if (state === "sent") {
    return (
      <p className="text-sm text-muted-foreground" role="status">
        Check your inbox and confirm the subscription.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-md">
      <div className="flex gap-2">
        <Input
          type="email"
          name="email"
          required
          placeholder="you@example.com"
          aria-label="Email address"
          autoComplete="email"
        />
        {/* Honeypot: off-screen for people, tempting for bots */}
        <input
          type="text"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          className="absolute -left-[9999px]"
        />
        <Button type="submit" disabled={state === "sending" || topics.length === 0}>
          Subscribe
        </Button>
      </div>
      <fieldset className="mt-3 flex flex-wrap gap-x-5 gap-y-2">
        <legend className="sr-only">What to send</legend>
        {TOPICS.map((topic) => (
          <label key={topic} className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
            <Switch
              checked={topics.includes(topic)}
              onCheckedChange={(checked) => toggleTopic(topic, checked)}
            />
            {TOPIC_LABELS[topic]}
          </label>
        ))}
      </fieldset>
      <p className="mt-2 text-xs text-muted-foreground" role={state === "error" ? "alert" : undefined}>
        {state === "error" ? (
          error
        ) : (
          <>
            News from sbozh.me, unsubscribe anytime. See{" "}
            <Link href="/privacy" className="underline hover:text-foreground">
              Privacy
            </Link>
            .
          </>
        )}
      </p>
    </form>
  );
}
