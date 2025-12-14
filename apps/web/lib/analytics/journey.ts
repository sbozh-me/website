import { analyticsEvents, EventCategory, EventAction } from './events';

interface JourneyStep {
  step: string;
  timestamp: number;
  metadata?: Record<string, any>;
}

class UserJourney {
  private journey: JourneyStep[] = [];
  private journeyKey = 'user_journey';
  private maxSteps = 50;

  constructor() {
    this.loadJourney();
  }

  track(step: string, metadata?: Record<string, any>) {
    const journeyStep: JourneyStep = {
      step,
      timestamp: Date.now(),
      metadata,
    };

    this.journey.push(journeyStep);

    // Keep journey size manageable
    if (this.journey.length > this.maxSteps) {
      this.journey.shift();
    }

    this.saveJourney();

    // Track the step
    analyticsEvents.track({
      category: EventCategory.User,
      action: EventAction.View,
      label: step,
      metadata: {
        ...metadata,
        journeyLength: this.journey.length,
      },
    });
  }

  getJourney(): JourneyStep[] {
    return [...this.journey];
  }

  clearJourney() {
    this.journey = [];
    sessionStorage.removeItem(this.journeyKey);
  }

  private loadJourney() {
    try {
      const saved = sessionStorage.getItem(this.journeyKey);
      if (saved) {
        this.journey = JSON.parse(saved);
      }
    } catch (error) {
      console.error('Failed to load journey:', error);
    }
  }

  private saveJourney() {
    try {
      sessionStorage.setItem(this.journeyKey, JSON.stringify(this.journey));
    } catch (error) {
      console.error('Failed to save journey:', error);
    }
  }
}

export const userJourney = new UserJourney();

// Journey hooks
export function useJourneyTracking() {
  const trackStep = (step: string, metadata?: Record<string, any>) => {
    userJourney.track(step, metadata);
  };

  const trackConversion = (goal: string, value?: number) => {
    analyticsEvents.track({
      category: EventCategory.Commerce,
      action: EventAction.Success,
      label: goal,
      value,
      metadata: {
        journey: userJourney.getJourney().map(s => s.step).slice(-10), // Last 10 steps
      },
    });
  };

  return { trackStep, trackConversion };
}