'use client';

import Script from 'next/script';
import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect, Suspense } from 'react';

interface AnalyticsProviderProps {
  children: React.ReactNode;
}

function AnalyticsContent({ children }: AnalyticsProviderProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Log page views in development when Umami is not loaded
  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && !window.umami) {
      console.log('[Analytics Dev] pageview', {
        url: pathname,
        referrer: document.referrer,
      });
    }
    // Umami automatically tracks page views when data-auto-track="true"
  }, [pathname, searchParams]);

  return <>{children}</>;
}

export function AnalyticsProvider({ children }: AnalyticsProviderProps) {
  const websiteId = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID;
  const scriptSrc = process.env.NEXT_PUBLIC_UMAMI_SCRIPT_URL;
  const isDevelopment = process.env.NODE_ENV === 'development';
  const analyticsEnabled = process.env.NEXT_PUBLIC_ANALYTICS_ENABLED === 'true';

  // Always wrap with AnalyticsContent for development logging
  const content = (
    <Suspense fallback={children}>
      <AnalyticsContent>{children}</AnalyticsContent>
    </Suspense>
  );

  // Skip loading Umami script in development unless explicitly enabled
  if (!analyticsEnabled || (isDevelopment && !process.env.NEXT_PUBLIC_FORCE_ANALYTICS)) {
    return content;
  }

  if (!websiteId || !scriptSrc) {
    console.warn('Analytics: Missing configuration');
    return content;
  }

  return (
    <>
      <Script
        src={scriptSrc}
        data-website-id={websiteId}
        data-host-url="http://localhost:3001"
        strategy="afterInteractive"
        onLoad={() => {
          console.log('Analytics: Umami loaded');
        }}
      />
      {content}
    </>
  );
}