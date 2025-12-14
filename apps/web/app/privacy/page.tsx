import { PrivacyControls } from '@/components/PrivacyControls';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Settings',
  description: 'Manage your privacy preferences and cookie settings',
};

export default function PrivacyPage() {
  return (
    <div className="container mx-auto px-4 py-16 max-w-3xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">Privacy & Cookie Settings</h1>
        <p className="text-muted-foreground">
          We respect your privacy and give you control over your data. This page allows you to manage
          how we collect and use information about your visit.
        </p>
      </div>

      <PrivacyControls />

      <div className="mt-12 space-y-6 text-sm text-muted-foreground">
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">About Our Analytics</h2>
          <p>
            We use Umami Analytics, a privacy-focused analytics solution that doesn't use cookies
            and doesn't track personal information. It only collects anonymous usage statistics to
            help us understand how our website is used and improve the user experience.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">Performance Monitoring</h2>
          <p>
            We monitor Core Web Vitals and performance metrics to ensure our website loads quickly
            and provides a smooth experience. This data is aggregated and does not identify individual users.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">Data Retention</h2>
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li>Analytics data: 90 days</li>
            <li>Performance metrics: 7 days</li>
            <li>Session data: Until you close your browser</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">Your Rights</h2>
          <p>
            You have the right to opt out of any data collection at any time. Your preferences
            are stored locally in your browser and are respected across all pages of our website.
            No personal data is sent to third parties without your explicit consent.
          </p>
        </section>
      </div>
    </div>
  );
}