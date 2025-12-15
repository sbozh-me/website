'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Button } from '@sbozh/react-ui/components/ui/button';
import { Switch } from '@sbozh/react-ui/components/ui/switch';
import { consentManager, ConsentType } from '@/lib/privacy/consent';

export function PrivacyControls() {
  const [consent, setConsent] = useState({
    analytics: false,
    marketing: false,
    functional: true,
  });

  useEffect(() => {
    // Load current consent state
    setConsent({
      analytics: consentManager.hasConsent(ConsentType.Analytics),
      marketing: consentManager.hasConsent(ConsentType.Marketing),
      functional: consentManager.hasConsent(ConsentType.Functional),
    });

    // Listen for consent changes
    const handleConsentChange = (event: CustomEvent) => {
      const state = event.detail;
      setConsent({
        analytics: state[ConsentType.Analytics],
        marketing: state[ConsentType.Marketing],
        functional: state[ConsentType.Functional],
      });
    };

    window.addEventListener('consentchange', handleConsentChange as any);
    return () => {
      window.removeEventListener('consentchange', handleConsentChange as any);
    };
  }, []);

  const handleToggle = (type: keyof typeof consent) => {
    const newValue = !consent[type];
    setConsent(prev => ({ ...prev, [type]: newValue }));

    // Update consent manager
    consentManager.saveConsent({
      [type]: newValue,
    });
    toast.success('Cookie preferences saved');
  };

  const handleDenyAll = () => {
    consentManager.denyAll();
    toast.success('Only necessary cookies enabled');
  };

  const handleAcceptAll = () => {
    consentManager.grantAll();
    toast.success('All cookies accepted');
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-4">Privacy Settings</h3>
        <p className="text-sm text-muted-foreground mb-6">
          Control how your data is collected and used. These settings apply immediately.
        </p>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="flex-1">
            <h4 className="font-medium">Necessary Cookies</h4>
            <p className="text-sm text-muted-foreground">
              Essential for the website to function. Cannot be disabled.
            </p>
          </div>
          <Switch checked={true} disabled />
        </div>

        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="flex-1">
            <h4 className="font-medium">Analytics Cookies</h4>
            <p className="text-sm text-muted-foreground">
              Help us understand how visitors use our website.
            </p>
          </div>
          <Switch
            checked={consent.analytics}
            onCheckedChange={() => handleToggle('analytics')}
          />
        </div>

        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="flex-1">
            <h4 className="font-medium">Functional Cookies</h4>
            <p className="text-sm text-muted-foreground">
              Enable enhanced functionality and personalization.
            </p>
          </div>
          <Switch
            checked={consent.functional}
            onCheckedChange={() => handleToggle('functional')}
          />
        </div>

        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="flex-1">
            <h4 className="font-medium">Marketing Cookies</h4>
            <p className="text-sm text-muted-foreground">
              Used to track visitors across websites for advertising.
            </p>
          </div>
          <Switch
            checked={consent.marketing}
            onCheckedChange={() => handleToggle('marketing')}
          />
        </div>
      </div>

      <div className="flex gap-4">
        <Button
          variant="outline"
          onClick={handleDenyAll}
        >
          Deny All
        </Button>
        <Button
          onClick={handleAcceptAll}
        >
          Accept All
        </Button>
      </div>

      <div className="text-xs text-muted-foreground">
        <p>Your preferences are saved locally and respected across all pages.</p>
        <p>We use Umami Analytics (privacy-friendly, no cookies) for anonymous usage statistics.</p>
      </div>
    </div>
  );
}