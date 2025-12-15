import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  AnalyticsEvents,
  EventCategory,
  EventAction,
  analyticsEvents,
} from '../events';

describe('EventCategory enum', () => {
  it('has all expected categories', () => {
    expect(EventCategory.Navigation).toBe('navigation');
    expect(EventCategory.Content).toBe('content');
    expect(EventCategory.Social).toBe('social');
    expect(EventCategory.Form).toBe('form');
    expect(EventCategory.Commerce).toBe('commerce');
    expect(EventCategory.Media).toBe('media');
    expect(EventCategory.Search).toBe('search');
    expect(EventCategory.User).toBe('user');
    expect(EventCategory.Performance).toBe('performance');
  });
});

describe('EventAction enum', () => {
  it('has all expected actions', () => {
    expect(EventAction.Click).toBe('click');
    expect(EventAction.View).toBe('view');
    expect(EventAction.Submit).toBe('submit');
    expect(EventAction.Share).toBe('share');
    expect(EventAction.Download).toBe('download');
    expect(EventAction.Play).toBe('play');
    expect(EventAction.Pause).toBe('pause');
    expect(EventAction.Complete).toBe('complete');
    expect(EventAction.Error).toBe('error');
    expect(EventAction.Success).toBe('success');
  });
});

describe('AnalyticsEvents', () => {
  let analytics: AnalyticsEvents;
  let mockUmami: { track: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    // Mock window.umami
    mockUmami = { track: vi.fn() };
    (window as any).umami = mockUmami;

    // Mock navigator.onLine
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      configurable: true,
      value: true,
    });

    // Setup localStorage with granted consent
    localStorage.clear();
    localStorage.setItem('analytics_consent', 'granted');

    // Setup sessionStorage
    sessionStorage.clear();

    // Mock crypto.randomUUID
    vi.spyOn(crypto, 'randomUUID').mockReturnValue(
      '12345678-1234-1234-1234-123456789abc'
    );

    // Create new instance
    analytics = new AnalyticsEvents();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    delete (window as any).umami;
    localStorage.clear();
    sessionStorage.clear();
  });

  describe('track()', () => {
    it('tracks events when consent is granted', () => {
      analytics.track({
        category: EventCategory.Navigation,
        action: EventAction.Click,
        label: 'header-link',
        value: 1,
      });

      expect(mockUmami.track).toHaveBeenCalledWith('navigation_click', {
        label: 'header-link',
        value: 1,
      });
    });

    it('blocks tracking when consent is denied', () => {
      localStorage.setItem('analytics_consent', 'denied');

      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      analytics.track({
        category: EventCategory.Navigation,
        action: EventAction.Click,
      });

      expect(mockUmami.track).not.toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith(
        '[Analytics] Tracking blocked - no consent'
      );
    });

    it('blocks tracking when consent is not set', () => {
      localStorage.removeItem('analytics_consent');

      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      analytics.track({
        category: EventCategory.Content,
        action: EventAction.View,
      });

      expect(mockUmami.track).not.toHaveBeenCalled();
    });

    it('includes metadata in tracked events', () => {
      analytics.track({
        category: EventCategory.Form,
        action: EventAction.Submit,
        label: 'contact-form',
        metadata: {
          formId: 'contact',
          fields: ['name', 'email'],
        },
      });

      expect(mockUmami.track).toHaveBeenCalledWith('form_submit', {
        label: 'contact-form',
        formId: 'contact',
        fields: ['name', 'email'],
      });
    });

    it('queues events when offline', () => {
      Object.defineProperty(navigator, 'onLine', {
        value: false,
        configurable: true,
      });

      // Create new instance to pick up offline state
      const offlineAnalytics = new AnalyticsEvents();

      offlineAnalytics.track({
        category: EventCategory.Content,
        action: EventAction.View,
      });

      // Should not send immediately when offline
      expect(mockUmami.track).not.toHaveBeenCalled();
    });
  });

  describe('offline/online handling', () => {
    it('sets up event listeners for online/offline', () => {
      const addEventListenerSpy = vi.spyOn(window, 'addEventListener');

      new AnalyticsEvents();

      expect(addEventListenerSpy).toHaveBeenCalledWith(
        'online',
        expect.any(Function)
      );
      expect(addEventListenerSpy).toHaveBeenCalledWith(
        'offline',
        expect.any(Function)
      );
    });

    it('flushes queued events when coming back online', () => {
      // Start offline
      Object.defineProperty(navigator, 'onLine', {
        value: false,
        configurable: true,
      });

      const offlineAnalytics = new AnalyticsEvents();

      // Queue some events while offline
      offlineAnalytics.track({
        category: EventCategory.Navigation,
        action: EventAction.Click,
        label: 'queued-event',
      });

      expect(mockUmami.track).not.toHaveBeenCalled();

      // Come back online
      Object.defineProperty(navigator, 'onLine', {
        value: true,
        configurable: true,
      });

      // Trigger online event
      window.dispatchEvent(new Event('online'));

      // Events should now be sent
      expect(mockUmami.track).toHaveBeenCalled();
    });
  });

  describe('session management', () => {
    it('generates a unique session ID', () => {
      analytics.track({
        category: EventCategory.User,
        action: EventAction.View,
      });

      expect(sessionStorage.getItem('analytics_session_id')).toBe(
        '12345678-1234-1234-1234-123456789abc'
      );
    });

    it('reuses existing session ID', () => {
      sessionStorage.setItem('analytics_session_id', 'existing-session-id');

      analytics.track({
        category: EventCategory.User,
        action: EventAction.View,
      });

      // Should still have the existing session ID
      expect(sessionStorage.getItem('analytics_session_id')).toBe(
        'existing-session-id'
      );
    });
  });

  describe('event formatting', () => {
    it('combines category and action for event name', () => {
      analytics.track({
        category: EventCategory.Social,
        action: EventAction.Share,
      });

      expect(mockUmami.track).toHaveBeenCalledWith('social_share', {});
    });

    it('handles all category/action combinations', () => {
      analytics.track({
        category: EventCategory.Commerce,
        action: EventAction.Success,
        label: 'purchase',
      });

      expect(mockUmami.track).toHaveBeenCalledWith('commerce_success', {
        label: 'purchase',
      });
    });
  });

  describe('graceful degradation', () => {
    it('handles missing umami gracefully', () => {
      delete (window as any).umami;

      expect(() => {
        analytics.track({
          category: EventCategory.Navigation,
          action: EventAction.Click,
        });
      }).not.toThrow();
    });
  });
});

describe('analyticsEvents singleton', () => {
  it('exports a singleton instance', () => {
    expect(analyticsEvents).toBeInstanceOf(AnalyticsEvents);
  });
});
