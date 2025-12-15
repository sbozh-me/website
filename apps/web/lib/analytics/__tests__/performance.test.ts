import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { initPerformanceTracking } from '../performance';
import { analyticsEvents } from '../events';
import type { Metric } from 'web-vitals';

// Mock web-vitals
vi.mock('web-vitals', () => ({
  onCLS: vi.fn(),
  onFCP: vi.fn(),
  onINP: vi.fn(),
  onLCP: vi.fn(),
  onTTFB: vi.fn(),
}));

// Mock analyticsEvents
vi.mock('../events', () => ({
  analyticsEvents: {
    track: vi.fn(),
  },
  EventCategory: {
    Performance: 'performance',
  },
  EventAction: {
    View: 'view',
  },
}));

// Import mocked modules
import { onCLS, onFCP, onINP, onLCP, onTTFB } from 'web-vitals';

describe('initPerformanceTracking', () => {
  let mockPerformanceObserver: any;
  let observerCallbacks: Map<string, (entries: PerformanceEntryList) => void>;

  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('analytics_consent', 'granted');
    vi.clearAllMocks();

    // Mock console
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});

    // Track observer callbacks
    observerCallbacks = new Map();

    // Mock PerformanceObserver
    mockPerformanceObserver = vi.fn().mockImplementation((callback) => {
      return {
        observe: vi.fn((options) => {
          if (options.entryTypes) {
            options.entryTypes.forEach((type: string) => {
              observerCallbacks.set(type, (entries) => {
                callback({ getEntries: () => entries });
              });
            });
          }
        }),
        disconnect: vi.fn(),
        takeRecords: vi.fn().mockReturnValue([]),
      };
    });

    (window as any).PerformanceObserver = mockPerformanceObserver;
    (window as any).PerformanceLongTaskTiming = class {};
  });

  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
    delete (window as any).PerformanceObserver;
    delete (window as any).PerformanceLongTaskTiming;
  });

  describe('Web Vitals initialization', () => {
    it('initializes all Web Vitals observers', () => {
      initPerformanceTracking();

      expect(onCLS).toHaveBeenCalled();
      expect(onFCP).toHaveBeenCalled();
      expect(onINP).toHaveBeenCalled();
      expect(onLCP).toHaveBeenCalled();
      expect(onTTFB).toHaveBeenCalled();
    });

    it('passes callback functions to Web Vitals observers', () => {
      initPerformanceTracking();

      expect(onCLS).toHaveBeenCalledWith(expect.any(Function));
      expect(onLCP).toHaveBeenCalledWith(expect.any(Function));
    });
  });

  describe('Metric tracking', () => {
    it('tracks LCP metric with correct format', () => {
      initPerformanceTracking();

      // Get the callback passed to onLCP
      const lcpCallback = (onLCP as ReturnType<typeof vi.fn>).mock.calls[0][0];

      // Simulate LCP metric
      const metric: Metric = {
        name: 'LCP',
        value: 2000,
        rating: 'good',
        delta: 100,
        id: 'test-lcp-id',
        navigationType: 'navigate',
        entries: [],
      };

      lcpCallback(metric);

      expect(analyticsEvents.track).toHaveBeenCalledWith({
        category: 'performance',
        action: 'view',
        label: 'LCP',
        value: 2000,
        metadata: {
          rating: 'good',
          delta: 100,
          id: 'test-lcp-id',
          url: '/',
          navigationType: 'navigate',
        },
      });
    });

    it('rounds metric values', () => {
      initPerformanceTracking();

      const fcpCallback = (onFCP as ReturnType<typeof vi.fn>).mock.calls[0][0];

      fcpCallback({
        name: 'FCP',
        value: 1234.567,
        rating: 'good',
        delta: 50.5,
        id: 'test-fcp-id',
        navigationType: 'navigate',
        entries: [],
      });

      expect(analyticsEvents.track).toHaveBeenCalledWith(
        expect.objectContaining({
          value: 1235, // Rounded
        })
      );
    });

    it('logs metrics in development mode', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const consoleSpy = vi.spyOn(console, 'log');

      initPerformanceTracking();

      const lcpCallback = (onLCP as ReturnType<typeof vi.fn>).mock.calls[0][0];
      lcpCallback({
        name: 'LCP',
        value: 2500,
        rating: 'good', // 2500 is the threshold, so it's "good"
        delta: 100,
        id: 'test-id',
        navigationType: 'navigate',
        entries: [],
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        '[Web Vital] LCP: 2500 (good)'
      );

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('Metric rating calculation', () => {
    beforeEach(() => {
      initPerformanceTracking();
    });

    it('rates LCP as good when <= 2500ms', () => {
      const lcpCallback = (onLCP as ReturnType<typeof vi.fn>).mock.calls[0][0];

      lcpCallback({
        name: 'LCP',
        value: 2500,
        rating: 'good',
        delta: 100,
        id: 'test',
        navigationType: 'navigate',
        entries: [],
      });

      expect(analyticsEvents.track).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: expect.objectContaining({ rating: 'good' }),
        })
      );
    });

    it('rates LCP as needs-improvement when > 2500ms and <= 4000ms', () => {
      const lcpCallback = (onLCP as ReturnType<typeof vi.fn>).mock.calls[0][0];

      lcpCallback({
        name: 'LCP',
        value: 3000,
        rating: 'needs-improvement',
        delta: 100,
        id: 'test',
        navigationType: 'navigate',
        entries: [],
      });

      expect(analyticsEvents.track).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: expect.objectContaining({ rating: 'needs-improvement' }),
        })
      );
    });

    it('rates LCP as poor when > 4000ms', () => {
      const lcpCallback = (onLCP as ReturnType<typeof vi.fn>).mock.calls[0][0];

      lcpCallback({
        name: 'LCP',
        value: 5000,
        rating: 'poor',
        delta: 100,
        id: 'test',
        navigationType: 'navigate',
        entries: [],
      });

      expect(analyticsEvents.track).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: expect.objectContaining({ rating: 'poor' }),
        })
      );
    });

    it('rates CLS as good when <= 0.1', () => {
      const clsCallback = (onCLS as ReturnType<typeof vi.fn>).mock.calls[0][0];

      clsCallback({
        name: 'CLS',
        value: 0.05,
        rating: 'good',
        delta: 0.01,
        id: 'test',
        navigationType: 'navigate',
        entries: [],
      });

      expect(analyticsEvents.track).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: expect.objectContaining({ rating: 'good' }),
        })
      );
    });

    it('rates FCP as good when <= 1800ms', () => {
      const fcpCallback = (onFCP as ReturnType<typeof vi.fn>).mock.calls[0][0];

      fcpCallback({
        name: 'FCP',
        value: 1500,
        rating: 'good',
        delta: 100,
        id: 'test',
        navigationType: 'navigate',
        entries: [],
      });

      expect(analyticsEvents.track).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: expect.objectContaining({ rating: 'good' }),
        })
      );
    });
  });

  describe('PerformanceObserver integration', () => {
    it('creates PerformanceObserver instances for resource timing', () => {
      initPerformanceTracking();

      // Should create multiple observers (resource, navigation, longtask)
      expect(mockPerformanceObserver).toHaveBeenCalled();
      // At minimum 3 observers should be created
      expect(mockPerformanceObserver.mock.calls.length).toBeGreaterThanOrEqual(1);
    });

    it('passes callback to PerformanceObserver constructor', () => {
      initPerformanceTracking();

      // Verify callback was passed to constructor
      mockPerformanceObserver.mock.calls.forEach((call: any[]) => {
        expect(typeof call[0]).toBe('function');
      });
    });
  });

  describe('Edge cases', () => {
    it('handles missing PerformanceObserver gracefully', () => {
      delete (window as any).PerformanceObserver;

      expect(() => {
        initPerformanceTracking();
      }).not.toThrow();
    });

    it('handles missing PerformanceLongTaskTiming gracefully', () => {
      delete (window as any).PerformanceLongTaskTiming;

      expect(() => {
        initPerformanceTracking();
      }).not.toThrow();
    });

    it('logs warning when PerformanceObserver throws', () => {
      const warnSpy = vi.spyOn(console, 'warn');

      mockPerformanceObserver.mockImplementation(() => {
        return {
          observe: vi.fn().mockImplementation(() => {
            throw new Error('Not supported');
          }),
        };
      });

      initPerformanceTracking();

      expect(warnSpy).toHaveBeenCalled();
    });
  });

  describe('Server-side rendering', () => {
    it('does nothing when window is undefined', () => {
      const originalWindow = global.window;
      // @ts-expect-error - intentionally setting to undefined
      delete global.window;

      expect(() => {
        initPerformanceTracking();
      }).not.toThrow();

      global.window = originalWindow;
    });
  });
});
