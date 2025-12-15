'use client';

import Script from 'next/script';
import { useEffect, useState } from 'react';

interface AnalyticsConfig {
  enabled: boolean;
  umamiWebsiteId: string;
  umamiScriptUrl: string;
}

interface AnalyticsProviderProps {
  children: React.ReactNode;
}

export function AnalyticsProvider({ children }: AnalyticsProviderProps) {
  const [config, setConfig] = useState<AnalyticsConfig | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch('/api/config')
      .then(res => res.json())
      .then(data => {
        setConfig(data.analytics);
        setLoaded(true);
      })
      .catch(() => {
        console.warn('Analytics: Failed to load config');
        setLoaded(true);
      });
  }, []);

  // Don't block rendering while loading config
  if (!loaded) {
    return <>{children}</>;
  }

  // Skip if analytics disabled or missing config
  if (!config?.enabled || !config.umamiWebsiteId || !config.umamiScriptUrl) {
    return <>{children}</>;
  }

  return (
    <>
      <Script
        src={config.umamiScriptUrl}
        data-website-id={config.umamiWebsiteId}
        strategy="afterInteractive"
        onLoad={() => {
          if (process.env.NODE_ENV === 'development') {
            console.log('Analytics: Umami loaded');
          }
        }}
      />
      {children}
    </>
  );
}
