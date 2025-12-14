'use client';

import { useEffect, useState } from 'react';
import { Button } from '@sbozh/react-ui/components/ui/button';

export default function TestAnalyticsPage() {
  const [umamiStatus, setUmamiStatus] = useState<string>('Checking...');
  const [websiteId, setWebsiteId] = useState<string>('');

  useEffect(() => {
    // Check environment variables
    const id = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID || 'Not set';
    setWebsiteId(id);

    // Check if Umami is loaded
    const checkUmami = setInterval(() => {
      if (window.umami) {
        setUmamiStatus('✅ Umami loaded');
        clearInterval(checkUmami);

        // Check what's in the umami object
        console.log('Umami object:', window.umami);
        console.log('Umami track function:', window.umami.track);
      } else {
        setUmamiStatus('⏳ Waiting for Umami...');
      }
    }, 500);

    // Cleanup
    return () => clearInterval(checkUmami);
  }, []);

  const testPageView = () => {
    if (window.umami) {
      console.log('Sending test pageview...');
      window.umami.track('pageview');
    } else {
      alert('Umami not loaded!');
    }
  };

  const testCustomEvent = () => {
    if (window.umami) {
      console.log('Sending test event...');
      window.umami.track('test-button-click', {
        button: 'test',
        timestamp: new Date().toISOString()
      });
    } else {
      alert('Umami not loaded!');
    }
  };

  const checkScript = () => {
    const scripts = document.querySelectorAll('script');
    scripts.forEach(script => {
      if (script.src.includes('umami') || script.src.includes('3001')) {
        console.log('Found Umami script:', {
          src: script.src,
          'data-website-id': script.getAttribute('data-website-id'),
          'data-auto-track': script.getAttribute('data-auto-track'),
          'data-domains': script.getAttribute('data-domains'),
        });
      }
    });
  };

  return (
    <div className="mx-auto px-6 md:px-12 lg:px-24 py-24">
      <div className="max-w-3xl mx-auto">
        <h1 className="tracking-tight">Analytics Debug Page</h1>

        <div className="mt-8 space-y-4">
          <div className="p-4 border rounded-lg">
            <h2 className="font-semibold mb-2">Status</h2>
            <p>Umami Status: {umamiStatus}</p>
            <p>Website ID: <code className="text-xs">{websiteId}</code></p>
            <p>Script URL: <code className="text-xs">{process.env.NEXT_PUBLIC_UMAMI_SCRIPT_URL}</code></p>
          </div>

          <div className="p-4 border rounded-lg">
            <h2 className="font-semibold mb-2">Test Actions</h2>
            <div className="flex gap-2 flex-wrap">
              <Button onClick={testPageView} variant="outline">
                Test Page View
              </Button>
              <Button onClick={testCustomEvent} variant="outline">
                Test Custom Event
              </Button>
              <Button onClick={checkScript} variant="outline">
                Check Script Tag
              </Button>
              <Button onClick={() => window.location.reload()} variant="outline">
                Reload Page
              </Button>
            </div>
          </div>

          <div className="p-4 border rounded-lg">
            <h2 className="font-semibold mb-2">Instructions</h2>
            <ol className="list-decimal list-inside space-y-1 text-sm">
              <li>Open browser DevTools (F12)</li>
              <li>Go to Network tab</li>
              <li>Click "Test Page View" or "Test Custom Event"</li>
              <li>Look for requests to <code>localhost:3001/api/send</code></li>
              <li>Check Console for debug output</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}