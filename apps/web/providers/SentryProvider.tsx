"use client";

import { useEffect, useState } from "react";
import * as Sentry from "@sentry/nextjs";

let sentryInitialized = false;

export function SentryProvider({ children }: { children: React.ReactNode }) {
  const [initialized, setInitialized] = useState(sentryInitialized);

  useEffect(() => {
    if (sentryInitialized) return;

    async function initSentry() {
      try {
        const response = await fetch("/api/config");
        const config = await response.json();
        const dsn = config.analytics?.sentryDSN;

        console.log("[Sentry] Config received:", { dsn: dsn ? "present" : "missing" });

        if (dsn) {
          Sentry.init({
            dsn,
            tracesSampleRate: 1,
            debug: false,
            // Session Replay disabled - GlitchTip has limited support
          });
          sentryInitialized = true;
          setInitialized(true);
          console.log("[Sentry] Initialized successfully");
        } else {
          console.warn("[Sentry] No DSN provided, skipping initialization");
        }
      } catch (error) {
        console.warn("[Sentry] Failed to initialize:", error);
      }
    }

    initSentry();
  }, []);

  return <>{children}</>;
}
