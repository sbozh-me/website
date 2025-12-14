import { onCLS, onFCP, onINP, onLCP, onTTFB, Metric } from 'web-vitals';
import { analyticsEvents, EventCategory, EventAction } from './events';

interface MetricData extends Metric {
  rating: 'good' | 'needs-improvement' | 'poor';
}

export function initPerformanceTracking() {
  if (typeof window === 'undefined') return;

  const sendMetric = (metric: Metric) => {
    // Determine rating based on thresholds
    const rating = getMetricRating(metric);

    // Send to analytics
    analyticsEvents.track({
      category: EventCategory.Performance,
      action: EventAction.View,
      label: metric.name,
      value: Math.round(metric.value),
      metadata: {
        rating,
        delta: metric.delta,
        id: metric.id,
        url: window.location.pathname,
        navigationType: metric.navigationType,
      },
    });

    // Log in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Web Vital] ${metric.name}: ${metric.value} (${rating})`);
    }
  };

  // Core Web Vitals
  onCLS(sendMetric); // Cumulative Layout Shift
  onFCP(sendMetric); // First Contentful Paint
  onINP(sendMetric); // Interaction to Next Paint (replaces FID)
  onLCP(sendMetric); // Largest Contentful Paint
  onTTFB(sendMetric); // Time to First Byte

  // Custom performance metrics
  observeResourceTiming();
  observeNavigationTiming();
  observeLongTasks();
}

function getMetricRating(metric: Metric): 'good' | 'needs-improvement' | 'poor' {
  // Based on Web Vitals thresholds
  const thresholds: Record<string, [number, number]> = {
    CLS: [0.1, 0.25],
    FCP: [1800, 3000],
    INP: [200, 500],
    LCP: [2500, 4000],
    TTFB: [800, 1800],
  };

  const [good, poor] = thresholds[metric.name] || [0, Infinity];

  if (metric.value <= good) return 'good';
  if (metric.value <= poor) return 'needs-improvement';
  return 'poor';
}

function observeResourceTiming() {
  if (!('PerformanceObserver' in window)) return;

  try {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'resource') {
          const resource = entry as PerformanceResourceTiming;

          // Track slow resources
          if (resource.duration > 1000) {
            analyticsEvents.track({
              category: EventCategory.Performance,
              action: EventAction.View,
              label: 'slow_resource',
              value: Math.round(resource.duration),
              metadata: {
                name: resource.name,
                type: resource.initiatorType,
                size: resource.transferSize,
              },
            });
          }
        }
      }
    });

    observer.observe({ entryTypes: ['resource'] });
  } catch (e) {
    // PerformanceObserver not supported
    console.warn('PerformanceObserver not supported:', e);
  }
}

function observeNavigationTiming() {
  if (!('PerformanceObserver' in window)) return;

  try {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'navigation') {
          const nav = entry as PerformanceNavigationTiming;

          analyticsEvents.track({
            category: EventCategory.Performance,
            action: EventAction.View,
            label: 'navigation',
            value: Math.round(nav.loadEventEnd - nav.fetchStart),
            metadata: {
              domContentLoaded: Math.round(nav.domContentLoadedEventEnd - nav.fetchStart),
              domInteractive: Math.round(nav.domInteractive - nav.fetchStart),
              type: nav.type, // navigate, reload, back_forward
            },
          });
        }
      }
    });

    observer.observe({ entryTypes: ['navigation'] });
  } catch (e) {
    console.warn('Navigation timing not supported:', e);
  }
}

function observeLongTasks() {
  if (!('PerformanceObserver' in window) || !('PerformanceLongTaskTiming' in window)) return;

  try {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        // Track tasks longer than 50ms
        analyticsEvents.track({
          category: EventCategory.Performance,
          action: EventAction.View,
          label: 'long_task',
          value: Math.round(entry.duration),
          metadata: {
            startTime: entry.startTime,
            name: entry.name,
          },
        });
      }
    });

    observer.observe({ entryTypes: ['longtask'] });
  } catch (e) {
    // Long task timing not supported
    console.warn('Long task timing not supported:', e);
  }
}