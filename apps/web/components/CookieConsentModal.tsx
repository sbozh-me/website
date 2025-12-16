'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Cookie } from 'lucide-react';
import { Button } from '@sbozh/react-ui/components/ui/button';
import { Switch } from '@sbozh/react-ui/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@sbozh/react-ui/components/ui/dialog';
import { consentManager, ConsentType } from '@/lib/privacy/consent';

export function CookieConsentModal() {
  const [open, setOpen] = useState(false);
  const [showFloatingButton, setShowFloatingButton] = useState(false);
  const [consent, setConsent] = useState({
    analytics: false,
    marketing: false,
    functional: true,
  });

  useEffect(() => {
    // Check if user has already made a consent decision
    const hasConsentDecision = localStorage.getItem('cookie_consent') !== null;
    setShowFloatingButton(!hasConsentDecision);

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
    setConsent(prev => ({ ...prev, [type]: !prev[type] }));
  };

  const handleSave = () => {
    consentManager.saveConsent({
      [ConsentType.Analytics]: consent.analytics,
      [ConsentType.Marketing]: consent.marketing,
      [ConsentType.Functional]: consent.functional,
    });
    setShowFloatingButton(false);
    setOpen(false);
    toast.success('Cookie preferences saved');
  };

  const handleAcceptAll = () => {
    consentManager.grantAll();
    setShowFloatingButton(false);
    setOpen(false);
    toast.success('All cookies accepted');
  };

  const handleDenyAll = () => {
    consentManager.denyAll();
    setShowFloatingButton(false);
    setOpen(false);
    toast.success('Only necessary cookies enabled');
  };

  // Don't render floating button after user makes a choice
  if (!showFloatingButton) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!open && (
        <DialogTrigger asChild>
          <Button
            className="fixed bottom-4 left-1/2 -translate-x-1/2 sm:left-auto sm:right-4 sm:translate-x-0 z-50 shadow-lg transition-transform hover:scale-105 animate-pulse print:hidden"
            aria-label="Cookie settings"
          >
            <Cookie className="h-5 w-5" />
            <span>Cookie Settings</span>
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Cookie Preferences</DialogTitle>
          <DialogDescription>
            We use cookies to enhance your experience. Choose which cookies you allow.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
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

        <DialogFooter className="flex-col gap-2 sm:flex-row">
          <Button variant="outline" onClick={handleDenyAll} className="w-full sm:w-auto">
            Deny All
          </Button>
          <Button variant="outline" onClick={handleSave} className="w-full sm:w-auto">
            Save Preferences
          </Button>
          <Button onClick={handleAcceptAll} className="w-full sm:w-auto">
            Accept All
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
