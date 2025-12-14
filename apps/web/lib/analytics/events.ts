export enum EventCategory {
  Navigation = 'navigation',
  Content = 'content',
  Social = 'social',
  Form = 'form',
  Commerce = 'commerce',
  Media = 'media',
  Search = 'search',
  User = 'user',
  Performance = 'performance',
}

export enum EventAction {
  Click = 'click',
  View = 'view',
  Submit = 'submit',
  Share = 'share',
  Download = 'download',
  Play = 'play',
  Pause = 'pause',
  Complete = 'complete',
  Error = 'error',
  Success = 'success',
}

interface EventData {
  category: EventCategory;
  action: EventAction;
  label?: string;
  value?: number;
  metadata?: Record<string, any>;
}

declare global {
  interface Window {
    umami?: {
      track: (event: string, data?: Record<string, any>) => void;
    };
  }
}

export class AnalyticsEvents {
  private queue: EventData[] = [];
  private isOnline = true;

  constructor() {
    if (typeof window !== 'undefined') {
      this.isOnline = navigator.onLine;
      window.addEventListener('online', () => this.handleOnline());
      window.addEventListener('offline', () => this.handleOffline());
    }
  }

  track(event: EventData) {
    // Check consent
    if (!this.hasConsent()) {
      console.log('[Analytics] Tracking blocked - no consent');
      return;
    }

    // Add timestamp
    const enrichedEvent = {
      ...event,
      timestamp: Date.now(),
      sessionId: this.getSessionId(),
    };

    if (this.isOnline) {
      this.send(enrichedEvent);
    } else {
      this.queue.push(event);
    }
  }

  private send(event: EventData & { timestamp: number; sessionId: string }) {
    if (window.umami) {
      window.umami.track(event.category + '_' + event.action, {
        label: event.label,
        value: event.value,
        ...event.metadata,
      });
    }
  }

  private handleOnline() {
    this.isOnline = true;
    // Flush queued events
    while (this.queue.length > 0) {
      const event = this.queue.shift();
      if (event) {
        this.track(event);
      }
    }
  }

  private handleOffline() {
    this.isOnline = false;
  }

  private hasConsent(): boolean {
    // Check localStorage for consent
    const consent = localStorage.getItem('analytics_consent');
    return consent === 'granted';
  }

  private getSessionId(): string {
    let sessionId = sessionStorage.getItem('analytics_session_id');
    if (!sessionId) {
      sessionId = crypto.randomUUID();
      sessionStorage.setItem('analytics_session_id', sessionId);
    }
    return sessionId;
  }
}

export const analyticsEvents = new AnalyticsEvents();