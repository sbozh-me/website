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

    window.addEventListener('consentchange', handleConsentChange as EventListener);
    return () => {
      window.removeEventListener('consentchange', handleConsentChange as EventListener);
    };
  }, []);

  const handleToggle = (type: keyof typeof consent) => {
    const newValue = !consent[type];
    setConsent(prev => ({ ...prev, [type]: newValue }));

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
    <div className="space-y-6 border border-border bg-muted rounded-lg p-6">
      <div>
        <h3 className="text-lg font-medium mb-2">Cookie Settings</h3>
        <p className="text-sm text-muted-foreground">
          Choose which cookies you allow. Your preferences are saved locally.
        </p>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1">
            <p className="text-sm font-medium">Necessary</p>
            <p className="text-xs text-muted-foreground">Required for the site to work</p>
          </div>
          <Switch checked={true} disabled />
        </div>

        <div className="flex items-center justify-between gap-4">
          <div className="flex-1">
            <p className="text-sm font-medium">Analytics</p>
            <p className="text-xs text-muted-foreground">Help us improve the site</p>
          </div>
          <Switch
            checked={consent.analytics}
            onCheckedChange={() => handleToggle('analytics')}
          />
        </div>

        <div className="flex items-center justify-between gap-4">
          <div className="flex-1">
            <p className="text-sm font-medium">Functional</p>
            <p className="text-xs text-muted-foreground">Enhanced features</p>
          </div>
          <Switch
            checked={consent.functional}
            onCheckedChange={() => handleToggle('functional')}
          />
        </div>

        <div className="flex items-center justify-between gap-4">
          <div className="flex-1">
            <p className="text-sm font-medium">Marketing</p>
            <p className="text-xs text-muted-foreground">Personalized ads</p>
          </div>
          <Switch
            checked={consent.marketing}
            onCheckedChange={() => handleToggle('marketing')}
          />
        </div>
      </div>

      <div className="flex gap-2">
        <Button variant="outline" onClick={handleDenyAll}>
          Deny All
        </Button>
        <Button onClick={handleAcceptAll}>
          Accept All
        </Button>
      </div>
    </div>
  );
}
