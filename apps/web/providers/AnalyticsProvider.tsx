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

  // Render script only when config is loaded and enabled
  const shouldRenderScript =
    config?.enabled &&
    config.umamiWebsiteId &&
    config.umamiScriptUrl;

  return (
    <>
      {shouldRenderScript && (
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
      )}
      {children}
    </>
  );
}
