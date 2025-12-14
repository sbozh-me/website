'use client';

import { Button } from '@sbozh/react-ui/components/ui/button';
import { analyticsEvents, EventCategory, EventAction } from '@/lib/analytics/events';
import { userJourney } from '@/lib/analytics/journey';
import { consentManager } from '@/lib/privacy/consent';
import { useExternalLinkTracking } from '@/hooks/useExternalLinkTracking';
import { notFound } from 'next/navigation';

export default function TestAnalyticsPage() {
  // Only show this page in development mode
  if (process.env.NODE_ENV === 'production') {
    notFound();
  }

  const { trackRepositoryClick, trackDiscordInviteClick, trackExternalLink } = useExternalLinkTracking();

  const testPerformanceEvent = () => {
    analyticsEvents.track({
      category: EventCategory.Performance,
      action: EventAction.View,
      label: 'test_metric',
      value: Math.round(Math.random() * 1000),
      metadata: {
        test: true,
        timestamp: new Date().toISOString(),
      },
    });
    console.log('✅ Performance event sent');
  };

  const testUserJourney = () => {
    userJourney.track('test_page_view', {
      page: '/test-analytics',
      action: 'button_click',
    });
    console.log('✅ Journey step tracked');
  };

  const testNavigationEvent = () => {
    analyticsEvents.track({
      category: EventCategory.Navigation,
      action: EventAction.Click,
      label: 'test_navigation',
      metadata: {
        from: '/test-analytics',
        to: '/home',
      },
    });
    console.log('✅ Navigation event sent');
  };

  const testRepositoryClick = () => {
    trackRepositoryClick({
      repository: 'https://github.com/sbozh/website',
      projectName: 'sbozh.me',
      platform: 'github',
      location: 'test_page',
    });
    console.log('✅ Repository click tracked');
  };

  const testDiscordInviteClick = () => {
    trackDiscordInviteClick({
      inviteCode: 'test123',
      serverName: 'sbozh.me Community',
      location: 'test_page',
    });
    console.log('✅ Discord invite click tracked');
  };

  const checkConsent = () => {
    const state = consentManager.getState();
    console.log('Consent state:', state);
    alert(`Analytics consent: ${state.analytics ? '✅ Granted' : '❌ Denied'}`);
  };

  const grantConsent = () => {
    consentManager.saveConsent({ analytics: true });
    console.log('✅ Analytics consent granted');
    alert('Analytics consent granted!');
  };

  const denyConsent = () => {
    consentManager.saveConsent({ analytics: false });
    console.log('❌ Analytics consent denied');
    alert('Analytics consent denied!');
  };

  const showJourney = () => {
    const journey = userJourney.getJourney();
    console.log('User Journey:', journey);
    alert(`User has ${journey.length} steps in their journey. Check console for details.`);
  };

  return (
    <div className="container mx-auto p-8 space-y-8">
      <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
        <h1 className="text-2xl font-bold text-yellow-900 dark:text-yellow-100">
          🧪 Analytics Testing Page (Dev Only)
        </h1>
        <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-2">
          This page is only accessible in development mode for testing analytics events.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Consent Management */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            🔐 Consent Management
          </h2>
          <div className="space-y-2">
            <Button onClick={checkConsent} className="w-full" variant="outline">
              Check Current Consent
            </Button>
            <div className="flex gap-2">
              <Button onClick={grantConsent} className="flex-1" variant="default">
                ✅ Grant Consent
              </Button>
              <Button onClick={denyConsent} className="flex-1" variant="destructive">
                ❌ Deny Consent
              </Button>
            </div>
          </div>
        </div>

        {/* Event Testing */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            📊 Test Events
          </h2>
          <div className="space-y-2">
            <Button onClick={testPerformanceEvent} className="w-full" variant="outline">
              📈 Send Performance Event
            </Button>
            <Button onClick={testNavigationEvent} className="w-full" variant="outline">
              🧭 Send Navigation Event
            </Button>
            <Button onClick={testUserJourney} className="w-full" variant="outline">
              🛤️ Track Journey Step
            </Button>
          </div>
        </div>

        {/* External Link Tracking */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            🔗 External Link Tracking
          </h2>
          <div className="space-y-2">
            <Button onClick={testRepositoryClick} className="w-full" variant="outline">
              <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
              GitHub Repository Click
            </Button>
            <Button onClick={testDiscordInviteClick} className="w-full" variant="outline">
              <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.182 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z"/>
              </svg>
              Discord Invite Click
            </Button>
          </div>
        </div>

        {/* Journey Analysis */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            🗺️ Journey Analysis
          </h2>
          <div className="space-y-2">
            <Button onClick={showJourney} className="w-full" variant="outline">
              View Current Journey
            </Button>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6 pt-8 border-t">
        <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
          <h3 className="font-semibold mb-2">📍 How to Use</h3>
          <ol className="text-sm space-y-1 list-decimal list-inside text-muted-foreground">
            <li>Grant analytics consent first</li>
            <li>Click any test button to send events</li>
            <li>Check browser console for logs</li>
            <li>View events in Umami dashboard</li>
          </ol>
        </div>

        <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
          <h3 className="font-semibold mb-2">🔗 Quick Links</h3>
          <div className="space-y-2 text-sm">
            <a
              href="http://localhost:3001"
              target="_blank"
              className="flex items-center gap-2 text-blue-600 hover:underline"
            >
              📊 Umami Dashboard →
            </a>
            <a
              href="/privacy"
              className="flex items-center gap-2 text-blue-600 hover:underline"
            >
              🔐 Privacy Settings →
            </a>
          </div>
        </div>
      </div>

      <div className="text-xs text-center text-muted-foreground pt-4">
        💡 Tip: Open DevTools Console (F12) to see detailed event logs
      </div>
    </div>
  );
}