'use client';

import { toast } from 'sonner';
import { Button } from '@sbozh/react-ui/components/ui/button';
import { setDecision, useCookieDecision } from '@/lib/privacy/decision';

/**
 * The one honest control: it reflects, and writes, the same `cookie_decision`
 * localStorage key that the Emperor modal and CookieGate read. Flipping it
 * drives grayscale + PostHog/Umami routing live, in every open tab.
 */
export function PrivacyControls() {
  const decision = useCookieDecision();

  const onAllow = () => {
    setDecision('allow');
    toast.success(
      <span>
        You're aware of{' '}
        <a href="/terms" className="underline underline-offset-2">Terms of Use</a>,{' '}
        <a href="/privacy" className="underline underline-offset-2">Privacy Policy</a>{' '}
        and the{' '}
        <a
          href="/library/laws/declaration-of-the-digital-principate"
          className="underline underline-offset-2"
        >
          Digital Principate Declaration
        </a>
        .
      </span>,
      { duration: 7000 }
    );
  };
  const onDismiss = () => {
    setDecision('dismiss');
    toast.success('Cookies dismissed — only cookieless Umami runs');
  };

  return (
    <div className="space-y-5 border border-border bg-muted rounded-lg p-6">
      <div>
        <h3 className="text-lg font-medium mb-1">Cookie preference</h3>
        <p className="text-sm text-muted-foreground">
          One switch. It picks the same side as the &quot;Take The
          Piece&quot; dialog and is remembered in this browser only.
        </p>
      </div>

      <div className="text-sm">
        <span className="text-muted-foreground">Current choice: </span>
        <strong>
          {decision === 'allow'
            ? 'Allow — PostHog EU loads (cookies, colour on)'
            : decision === 'dismiss'
              ? 'Dismiss — only Umami loads (cookieless, grayscale on)'
              : 'Not chosen yet'}
        </strong>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          variant={decision === 'dismiss' ? 'default' : 'outline'}
          onClick={onDismiss}
        >
          Dismiss cookies
        </Button>
        <Button
          variant={decision === 'allow' ? 'default' : 'outline'}
          onClick={onAllow}
        >
          Allow cookies
        </Button>
      </div>
    </div>
  );
}
