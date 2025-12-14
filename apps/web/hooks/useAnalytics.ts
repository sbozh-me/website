import { useCallback } from 'react';

declare global {
  interface Window {
    umami?: {
      track: (event: string, data?: Record<string, any>) => void;
    };
  }
}

interface TrackEventOptions {
  category?: string;
  label?: string;
  value?: number;
  [key: string]: any;
}

export function useAnalytics() {
  const track = useCallback((event: string, options?: TrackEventOptions) => {
    if (typeof window !== 'undefined' && window.umami) {
      window.umami.track(event, options);
    } else if (process.env.NODE_ENV === 'development') {
      console.log('[Analytics Dev]', event, options);
    }
  }, []);

  const trackClick = useCallback((label: string, category = 'click') => {
    track('click', { category, label });
  }, [track]);

  const trackFormSubmit = useCallback((formName: string) => {
    track('form_submit', { form: formName });
  }, [track]);

  const trackError = useCallback((error: string, context?: Record<string, any>) => {
    track('error', { error, ...context });
  }, [track]);

  const trackSearch = useCallback((query: string, results?: number) => {
    track('search', { query, results });
  }, [track]);

  const trackShare = useCallback((platform: string, url: string) => {
    track('share', { platform, url });
  }, [track]);

  const trackDownload = useCallback((file: string, type: string) => {
    track('download', { file, type });
  }, [track]);

  return {
    track,
    trackClick,
    trackFormSubmit,
    trackError,
    trackSearch,
    trackShare,
    trackDownload,
  };
}