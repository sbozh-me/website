export enum ConsentType {
  Analytics = 'analytics',
  Marketing = 'marketing',
  Functional = 'functional',
  Necessary = 'necessary',
}

interface ConsentState {
  [ConsentType.Analytics]: boolean;
  [ConsentType.Marketing]: boolean;
  [ConsentType.Functional]: boolean;
  [ConsentType.Necessary]: boolean;
  timestamp: number;
  version: string;
}

class ConsentManager {
  private storageKey = 'cookie_consent';
  private consentVersion = '1.0.0';
  private state: ConsentState;

  constructor() {
    this.state = this.loadConsent() || this.getDefaultConsent();
  }

  getDefaultConsent(): ConsentState {
    return {
      [ConsentType.Analytics]: false,
      [ConsentType.Marketing]: false,
      [ConsentType.Functional]: true,
      [ConsentType.Necessary]: true, // Always true
      timestamp: Date.now(),
      version: this.consentVersion,
    };
  }

  loadConsent(): ConsentState | null {
    if (typeof window === 'undefined') return null;

    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const consent = JSON.parse(stored) as ConsentState;
        // Check version compatibility
        if (consent.version !== this.consentVersion) {
          return null; // Force re-consent on version change
        }
        return consent;
      }
    } catch (error) {
      console.error('Failed to load consent:', error);
    }
    return null;
  }

  saveConsent(consent: Partial<Omit<ConsentState, 'timestamp' | 'version' | 'necessary'>>) {
    this.state = {
      ...this.state,
      ...consent,
      [ConsentType.Necessary]: true, // Always keep necessary as true
      timestamp: Date.now(),
      version: this.consentVersion,
    };

    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.state));
      this.applyConsent();
      this.notifyConsentChange();
    } catch (error) {
      console.error('Failed to save consent:', error);
    }
  }

  hasConsent(type: ConsentType): boolean {
    return this.state[type];
  }

  grantAll() {
    this.saveConsent({
      [ConsentType.Analytics]: true,
      [ConsentType.Marketing]: true,
      [ConsentType.Functional]: true,
    });
  }

  denyAll() {
    this.saveConsent({
      [ConsentType.Analytics]: false,
      [ConsentType.Marketing]: false,
      [ConsentType.Functional]: false,
    });
  }

  getState(): ConsentState {
    return { ...this.state };
  }

  private applyConsent() {
    // Apply analytics consent
    if (this.state[ConsentType.Analytics]) {
      this.enableAnalytics();
    } else {
      this.disableAnalytics();
    }

    // Apply marketing consent
    if (this.state[ConsentType.Marketing]) {
      this.enableMarketing();
    } else {
      this.disableMarketing();
    }
  }

  private enableAnalytics() {
    // Enable Umami
    localStorage.setItem('analytics_consent', 'granted');

    // Log consent granted
    console.log('[Privacy] Analytics consent granted');
  }

  private disableAnalytics() {
    // Disable Umami
    localStorage.setItem('analytics_consent', 'denied');

    // Clear any stored analytics data
    this.clearAnalyticsData();

    // Log consent denied
    console.log('[Privacy] Analytics consent denied');
  }

  private enableMarketing() {
    // Placeholder for future marketing tools
    console.log('[Privacy] Marketing consent granted');
  }

  private disableMarketing() {
    // Placeholder for future marketing tools
    console.log('[Privacy] Marketing consent denied');
  }

  private clearAnalyticsData() {
    // Clear session storage
    sessionStorage.removeItem('analytics_session_id');
    sessionStorage.removeItem('user_journey');

    // Clear Umami data if possible
    if (typeof window !== 'undefined' && window.umami) {
      // Umami doesn't store client-side data
    }
  }

  private notifyConsentChange() {
    if (typeof window === 'undefined') return;

    // Dispatch custom event for components to react
    window.dispatchEvent(new CustomEvent('consentchange', {
      detail: this.state,
    }));
  }
}

export const consentManager = new ConsentManager();