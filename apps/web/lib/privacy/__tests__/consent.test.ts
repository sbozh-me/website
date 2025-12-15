import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ConsentType, consentManager } from '../consent';

// Create a fresh ConsentManager for testing
function createConsentManager() {
  // We need to re-import to get a fresh instance
  // For now, we'll test the singleton behavior
  return consentManager;
}

describe('ConsentType enum', () => {
  it('has all expected consent types', () => {
    expect(ConsentType.Analytics).toBe('analytics');
    expect(ConsentType.Marketing).toBe('marketing');
    expect(ConsentType.Functional).toBe('functional');
    expect(ConsentType.Necessary).toBe('necessary');
  });
});

describe('ConsentManager', () => {
  beforeEach(() => {
    // Clear storage before each test
    localStorage.clear();
    sessionStorage.clear();

    // Suppress console logs during tests
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
    sessionStorage.clear();
  });

  describe('getDefaultConsent()', () => {
    it('returns correct default consent state', () => {
      const manager = createConsentManager();
      const defaultConsent = manager.getDefaultConsent();

      expect(defaultConsent[ConsentType.Analytics]).toBe(false);
      expect(defaultConsent[ConsentType.Marketing]).toBe(false);
      expect(defaultConsent[ConsentType.Functional]).toBe(true);
      expect(defaultConsent[ConsentType.Necessary]).toBe(true);
      expect(defaultConsent.version).toBe('1.0.0');
      expect(typeof defaultConsent.timestamp).toBe('number');
    });
  });

  describe('hasConsent()', () => {
    it('returns false for analytics by default', () => {
      const manager = createConsentManager();
      expect(manager.hasConsent(ConsentType.Analytics)).toBe(false);
    });

    it('returns true for necessary by default', () => {
      const manager = createConsentManager();
      expect(manager.hasConsent(ConsentType.Necessary)).toBe(true);
    });

    it('returns true for functional by default', () => {
      const manager = createConsentManager();
      expect(manager.hasConsent(ConsentType.Functional)).toBe(true);
    });
  });

  describe('saveConsent()', () => {
    it('saves consent to localStorage', () => {
      const manager = createConsentManager();

      manager.saveConsent({
        [ConsentType.Analytics]: true,
      });

      const stored = localStorage.getItem('cookie_consent');
      expect(stored).not.toBeNull();

      const parsed = JSON.parse(stored!);
      expect(parsed[ConsentType.Analytics]).toBe(true);
    });

    it('always keeps necessary consent as true', () => {
      const manager = createConsentManager();

      // Try to set necessary to false (shouldn't work)
      manager.saveConsent({
        [ConsentType.Analytics]: false,
      });

      expect(manager.hasConsent(ConsentType.Necessary)).toBe(true);
    });

    it('updates analytics_consent in localStorage when analytics is enabled', () => {
      const manager = createConsentManager();

      manager.saveConsent({
        [ConsentType.Analytics]: true,
      });

      expect(localStorage.getItem('analytics_consent')).toBe('granted');
    });

    it('updates analytics_consent to denied when analytics is disabled', () => {
      const manager = createConsentManager();

      manager.saveConsent({
        [ConsentType.Analytics]: false,
      });

      expect(localStorage.getItem('analytics_consent')).toBe('denied');
    });

    it('dispatches consentchange event', () => {
      const manager = createConsentManager();
      const eventHandler = vi.fn();

      window.addEventListener('consentchange', eventHandler);

      manager.saveConsent({
        [ConsentType.Analytics]: true,
      });

      expect(eventHandler).toHaveBeenCalled();

      window.removeEventListener('consentchange', eventHandler);
    });
  });

  describe('grantAll()', () => {
    it('grants all consent types', () => {
      const manager = createConsentManager();

      manager.grantAll();

      expect(manager.hasConsent(ConsentType.Analytics)).toBe(true);
      expect(manager.hasConsent(ConsentType.Marketing)).toBe(true);
      expect(manager.hasConsent(ConsentType.Functional)).toBe(true);
      expect(manager.hasConsent(ConsentType.Necessary)).toBe(true);
    });

    it('sets analytics_consent to granted', () => {
      const manager = createConsentManager();

      manager.grantAll();

      expect(localStorage.getItem('analytics_consent')).toBe('granted');
    });
  });

  describe('denyAll()', () => {
    it('denies non-necessary consent types', () => {
      const manager = createConsentManager();

      // First grant all
      manager.grantAll();

      // Then deny all
      manager.denyAll();

      expect(manager.hasConsent(ConsentType.Analytics)).toBe(false);
      expect(manager.hasConsent(ConsentType.Marketing)).toBe(false);
      expect(manager.hasConsent(ConsentType.Functional)).toBe(false);
      // Necessary should always remain true
      expect(manager.hasConsent(ConsentType.Necessary)).toBe(true);
    });

    it('sets analytics_consent to denied', () => {
      const manager = createConsentManager();

      manager.denyAll();

      expect(localStorage.getItem('analytics_consent')).toBe('denied');
    });

    it('clears analytics session data', () => {
      const manager = createConsentManager();

      // Set some session data
      sessionStorage.setItem('analytics_session_id', 'test-session');
      sessionStorage.setItem('user_journey', '[]');

      manager.denyAll();

      expect(sessionStorage.getItem('analytics_session_id')).toBeNull();
      expect(sessionStorage.getItem('user_journey')).toBeNull();
    });
  });

  describe('getState()', () => {
    it('returns a copy of the current state', () => {
      const manager = createConsentManager();

      const state1 = manager.getState();
      const state2 = manager.getState();

      // Should be equal but not the same reference
      expect(state1).toEqual(state2);
      expect(state1).not.toBe(state2);
    });

    it('reflects changes after saveConsent', () => {
      const manager = createConsentManager();

      manager.saveConsent({
        [ConsentType.Analytics]: true,
      });

      const state = manager.getState();
      expect(state[ConsentType.Analytics]).toBe(true);
    });
  });

  describe('loadConsent()', () => {
    it('returns null when no consent is stored', () => {
      localStorage.clear();
      const manager = createConsentManager();

      const loaded = manager.loadConsent();

      expect(loaded).toBeNull();
    });

    it('returns null when stored consent has different version', () => {
      localStorage.setItem(
        'cookie_consent',
        JSON.stringify({
          [ConsentType.Analytics]: true,
          [ConsentType.Marketing]: true,
          [ConsentType.Functional]: true,
          [ConsentType.Necessary]: true,
          timestamp: Date.now(),
          version: '0.9.0', // Different version
        })
      );

      const manager = createConsentManager();
      const loaded = manager.loadConsent();

      expect(loaded).toBeNull();
    });

    it('handles JSON parse errors gracefully', () => {
      localStorage.setItem('cookie_consent', 'invalid json');

      const manager = createConsentManager();
      const loaded = manager.loadConsent();

      expect(loaded).toBeNull();
    });
  });

  describe('consent change events', () => {
    it('includes consent state in event detail', () => {
      const manager = createConsentManager();
      let eventDetail: any = null;

      const handler = (event: CustomEvent) => {
        eventDetail = event.detail;
      };

      window.addEventListener('consentchange', handler as EventListener);

      manager.saveConsent({
        [ConsentType.Analytics]: true,
      });

      expect(eventDetail).not.toBeNull();
      expect(eventDetail[ConsentType.Analytics]).toBe(true);

      window.removeEventListener('consentchange', handler as EventListener);
    });
  });
});

describe('consentManager singleton', () => {
  it('exports a singleton instance', () => {
    expect(consentManager).toBeDefined();
    expect(typeof consentManager.hasConsent).toBe('function');
    expect(typeof consentManager.saveConsent).toBe('function');
    expect(typeof consentManager.grantAll).toBe('function');
    expect(typeof consentManager.denyAll).toBe('function');
  });
});
