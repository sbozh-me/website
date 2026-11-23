"use client";

// The single place that talks to PostHog. Every caller imports from here, never
// from 'posthog-js' directly: that is what keeps the Emperor Cookie gate honest.
// The tracker reads /api/config once, lazy-loads the SDK, inits it the first
// time an allowed capture happens, and no-ops when the visitor has not allowed
// cookies. AnalyticsProvider drives its lifecycle on decision flips.

import { readDecision } from "@/lib/privacy/decision";

type Props = Record<string, unknown>;
type PostHog = typeof import("posthog-js").default;

interface PostHogConfig {
  key: string;
  host: string;
}

let configPromise: Promise<PostHogConfig | null> | null = null;
let posthogPromise: Promise<PostHog | null> | null = null;

async function loadConfig(): Promise<PostHogConfig | null> {
  if (!configPromise) {
    configPromise = fetch("/api/config")
      .then((r) => r.json())
      .then((data) => {
        const key = data?.analytics?.posthogKey ?? "";
        const host = data?.analytics?.posthogHost ?? "https://eu.i.posthog.com";
        return key ? { key, host } : null;
      })
      .catch(() => null);
  }
  return configPromise;
}

async function ensureStarted(): Promise<PostHog | null> {
  if (!posthogPromise) {
    posthogPromise = (async () => {
      const cfg = await loadConfig();
      if (!cfg) return null;
      const { default: posthog } = await import("posthog-js");
      posthog.init(cfg.key, {
        api_host: cfg.host,
        person_profiles: "identified_only",
        capture_pageview: true,
        capture_pageleave: true,
        disable_session_recording: true,
        persistence: "localStorage+cookie",
      });
      return posthog;
    })();
  }
  return posthogPromise;
}

function allowed() {
  return typeof window !== "undefined" && readDecision() === "allow";
}

export async function capture(event: string, props?: Props) {
  if (!allowed()) return;
  const posthog = await ensureStarted();
  posthog?.capture(event, props);
}

export async function captureException(error: unknown, props?: Props) {
  if (!allowed()) return;
  const posthog = await ensureStarted();
  posthog?.captureException(error, props);
}

/** AnalyticsProvider calls this when the decision flips to "allow" */
export async function start() {
  if (!allowed()) return;
  const posthog = await ensureStarted();
  posthog?.opt_in_capturing();
}

/** AnalyticsProvider calls this when the decision flips to "dismiss" */
export async function stop() {
  if (!posthogPromise) return;
  const posthog = await posthogPromise;
  posthog?.opt_out_capturing();
  posthog?.reset();
}
