'use client';

import Script from 'next/script';
import { useEffect, useState } from 'react';
import { useCookieDecision } from '@/lib/privacy/decision';
import { start, stop } from '@/lib/analytics/tracker';

interface AnalyticsConfig {
  enabled: boolean;
  umamiWebsiteId: string;
  umamiScriptUrl: string;
}

interface AnalyticsProviderProps {
  children: React.ReactNode;
}

/**
 * Routes analytics by the visitor's cookie choice:
 *   allow   -> PostHog EU (through lib/analytics/tracker)
 *   dismiss -> Umami fallback (first-party, no cookies)
 *   null    -> nothing yet; waits for a choice
 *
 * The tracker is the single place that talks to posthog-js; this provider only
 * drives its lifecycle on decision flips.
 */
export function AnalyticsProvider({ children }: AnalyticsProviderProps) {
  const [config, setConfig] = useState<AnalyticsConfig | null>(null);
  const decision = useCookieDecision();

  useEffect(() => {
    fetch('/api/config')
      .then(res => res.json())
      .then(data => {
        setConfig(data.analytics);
      })
      .catch(() => {
        console.warn('Analytics: Failed to load config');
      });
  }, []);

  useEffect(() => {
    if (decision === 'allow') {
      void start();
    } else if (decision === 'dismiss') {
      void stop();
    }
  }, [decision]);

  const umamiReady =
    config?.enabled && !!config.umamiWebsiteId && !!config.umamiScriptUrl;
  const showUmami = umamiReady && decision === 'dismiss';

  return (
    <>
      {showUmami && (
        <Script
          src={config.umamiScriptUrl}
          data-website-id={config.umamiWebsiteId}
          strategy="afterInteractive"
        />
      )}
      {children}
    </>
  );
}
