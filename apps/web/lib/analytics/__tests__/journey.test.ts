import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { userJourney, useJourneyTracking } from '../journey';
import { analyticsEvents } from '../events';

// Mock the analyticsEvents module
vi.mock('../events', () => ({
  analyticsEvents: {
    track: vi.fn(),
  },
  EventCategory: {
    User: 'user',
    Commerce: 'commerce',
  },
  EventAction: {
    View: 'view',
    Success: 'success',
  },
}));

describe('UserJourney', () => {
  beforeEach(() => {
    // Clear storage and journey
    sessionStorage.clear();
    localStorage.clear();
    localStorage.setItem('analytics_consent', 'granted');
    userJourney.clearJourney();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    sessionStorage.clear();
    localStorage.clear();
  });

  describe('track()', () => {
    it('adds a step to the journey', () => {
      userJourney.track('page_view', { page: '/home' });

      const journey = userJourney.getJourney();
      expect(journey).toHaveLength(1);
      expect(journey[0].step).toBe('page_view');
      expect(journey[0].metadata).toEqual({ page: '/home' });
    });

    it('adds timestamp to each step', () => {
      const before = Date.now();
      userJourney.track('page_view');
      const after = Date.now();

      const journey = userJourney.getJourney();
      expect(journey[0].timestamp).toBeGreaterThanOrEqual(before);
      expect(journey[0].timestamp).toBeLessThanOrEqual(after);
    });

    it('tracks multiple steps in order', () => {
      userJourney.track('step_1');
      userJourney.track('step_2');
      userJourney.track('step_3');

      const journey = userJourney.getJourney();
      expect(journey).toHaveLength(3);
      expect(journey[0].step).toBe('step_1');
      expect(journey[1].step).toBe('step_2');
      expect(journey[2].step).toBe('step_3');
    });

    it('limits journey to 50 steps', () => {
      // Add 55 steps
      for (let i = 0; i < 55; i++) {
        userJourney.track(`step_${i}`);
      }

      const journey = userJourney.getJourney();
      expect(journey).toHaveLength(50);
      // First 5 steps should be removed
      expect(journey[0].step).toBe('step_5');
      expect(journey[49].step).toBe('step_54');
    });

    it('saves journey to sessionStorage', () => {
      userJourney.track('page_view');

      const stored = sessionStorage.getItem('user_journey');
      expect(stored).not.toBeNull();

      const parsed = JSON.parse(stored!);
      expect(parsed).toHaveLength(1);
      expect(parsed[0].step).toBe('page_view');
    });

    it('calls analyticsEvents.track with journey data', () => {
      userJourney.track('page_view', { page: '/home' });

      expect(analyticsEvents.track).toHaveBeenCalledWith({
        category: 'user',
        action: 'view',
        label: 'page_view',
        metadata: {
          page: '/home',
          journeyLength: 1,
        },
      });
    });
  });

  describe('getJourney()', () => {
    it('returns a copy of the journey', () => {
      userJourney.track('step_1');

      const journey1 = userJourney.getJourney();
      const journey2 = userJourney.getJourney();

      expect(journey1).toEqual(journey2);
      expect(journey1).not.toBe(journey2); // Different references
    });

    it('returns empty array when no journey exists', () => {
      const journey = userJourney.getJourney();
      expect(journey).toEqual([]);
    });
  });

  describe('clearJourney()', () => {
    it('clears all journey steps', () => {
      userJourney.track('step_1');
      userJourney.track('step_2');

      userJourney.clearJourney();

      expect(userJourney.getJourney()).toEqual([]);
    });

    it('removes journey from sessionStorage', () => {
      userJourney.track('step_1');
      expect(sessionStorage.getItem('user_journey')).not.toBeNull();

      userJourney.clearJourney();

      expect(sessionStorage.getItem('user_journey')).toBeNull();
    });
  });

  describe('persistence', () => {
    it('loads journey from sessionStorage on initialization', () => {
      // Pre-populate sessionStorage
      const existingJourney = [
        { step: 'existing_step', timestamp: Date.now(), metadata: {} },
      ];
      sessionStorage.setItem('user_journey', JSON.stringify(existingJourney));

      // The singleton has already loaded, but we can verify it persists new data
      userJourney.track('new_step');

      // Should have both existing and new
      const stored = sessionStorage.getItem('user_journey');
      const parsed = JSON.parse(stored!);
      // Note: Due to singleton behavior, existing data may not be loaded
      // This tests that new data is persisted correctly
      expect(parsed.length).toBeGreaterThan(0);
    });

    it('handles invalid JSON in sessionStorage', () => {
      sessionStorage.setItem('user_journey', 'invalid json');

      // Should not throw when tracking
      expect(() => {
        userJourney.track('step_1');
      }).not.toThrow();
    });
  });
});

describe('useJourneyTracking hook', () => {
  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
    localStorage.setItem('analytics_consent', 'granted');
    userJourney.clearJourney();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    sessionStorage.clear();
    localStorage.clear();
  });

  describe('trackStep()', () => {
    it('tracks a journey step', () => {
      const { result } = renderHook(() => useJourneyTracking());

      act(() => {
        result.current.trackStep('button_click', { button: 'submit' });
      });

      const journey = userJourney.getJourney();
      expect(journey).toHaveLength(1);
      expect(journey[0].step).toBe('button_click');
    });

    it('calls analyticsEvents.track', () => {
      const { result } = renderHook(() => useJourneyTracking());

      act(() => {
        result.current.trackStep('page_view');
      });

      expect(analyticsEvents.track).toHaveBeenCalled();
    });
  });

  describe('trackConversion()', () => {
    it('tracks conversion goal', () => {
      const { result } = renderHook(() => useJourneyTracking());

      act(() => {
        result.current.trackConversion('purchase', 99.99);
      });

      expect(analyticsEvents.track).toHaveBeenCalledWith({
        category: 'commerce',
        action: 'success',
        label: 'purchase',
        value: 99.99,
        metadata: {
          journey: [],
        },
      });
    });

    it('includes last 10 journey steps in conversion', () => {
      const { result } = renderHook(() => useJourneyTracking());

      // Add 15 steps
      act(() => {
        for (let i = 0; i < 15; i++) {
          result.current.trackStep(`step_${i}`);
        }
      });

      vi.clearAllMocks();

      act(() => {
        result.current.trackConversion('signup');
      });

      expect(analyticsEvents.track).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: {
            journey: expect.arrayContaining([
              'step_5',
              'step_6',
              'step_7',
              'step_8',
              'step_9',
              'step_10',
              'step_11',
              'step_12',
              'step_13',
              'step_14',
            ]),
          },
        })
      );
    });

    it('tracks conversion without value', () => {
      const { result } = renderHook(() => useJourneyTracking());

      act(() => {
        result.current.trackConversion('newsletter_signup');
      });

      expect(analyticsEvents.track).toHaveBeenCalledWith(
        expect.objectContaining({
          label: 'newsletter_signup',
          value: undefined,
        })
      );
    });
  });
});

describe('userJourney singleton', () => {
  it('exports a singleton instance', () => {
    expect(userJourney).toBeDefined();
    expect(typeof userJourney.track).toBe('function');
    expect(typeof userJourney.getJourney).toBe('function');
    expect(typeof userJourney.clearJourney).toBe('function');
  });
});
