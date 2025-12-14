'use client';

import { useAnalytics } from '@/hooks/useAnalytics';
import { Button } from '@sbozh/react-ui/components/ui/button';

export function AnalyticsTest() {
  const { trackClick, trackFormSubmit, trackShare } = useAnalytics();

  return (
    <div className="mt-8 p-4 border rounded-lg bg-muted/50">
      <h3 className="text-sm font-semibold mb-3">Analytics Test (Development Only)</h3>
      <div className="flex gap-2 flex-wrap">
        <Button
          variant="outline"
          size="sm"
          onClick={() => trackClick('test_button', 'test_category')}
        >
          Test Click Event
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => trackFormSubmit('test_form')}
        >
          Test Form Submit
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => trackShare('twitter', window.location.href)}
        >
          Test Share Event
        </Button>
      </div>
      <p className="text-xs text-muted-foreground mt-3">
        Open browser console to see [Analytics Dev] logs
      </p>
    </div>
  );
}