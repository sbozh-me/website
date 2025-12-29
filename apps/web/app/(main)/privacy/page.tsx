/* v8 ignore file -- @preserve */
import type { Metadata } from 'next';
import { Prose } from '@sbozh/blog/components';
import { PrivacyControls } from '@/components/PrivacyControls';

export const metadata: Metadata = {
  title: 'Privacy',
  description: 'Learn about how we handle your data and privacy on sbozh.me',
};

export default function PrivacyPage() {
  return (
    <div className="container mx-auto px-4 py-12 md:py-16 max-w-3xl">
      <h1 className="text-3xl font-bold mb-4">Privacy</h1>
      <p className="text-muted-foreground mb-8">
        We respect your privacy and give you control over your data. Learn how we collect
        and use information about your visit.
      </p>

      <PrivacyControls />

      <Prose className="mt-12">
        <h2>About Our Analytics</h2>
        <p>
          We use <strong><a href="https://umami.is" target="_blank" rel="noopener noreferrer">Umami Analytics</a></strong>, a privacy-focused, self-hosted analytics solution.
          Unlike traditional analytics:
        </p>
        <ul>
          <li>No cookies are used for tracking</li>
          <li>No personal information is collected</li>
          <li>Data is stored on our own servers, not shared with third parties</li>
          <li>IP addresses are not stored</li>
          <li>Fully GDPR compliant</li>
        </ul>
        <p>
          We only collect anonymous, aggregated statistics like page views, referrers, and
          device types to understand how our website is used.
        </p>

        <h2>Performance Monitoring</h2>
        <p>
          We monitor <strong>Core Web Vitals</strong> and performance metrics to ensure our website
          loads quickly and provides a smooth experience:
        </p>
        <ul>
          <li>Largest Contentful Paint (LCP) - loading performance</li>
          <li>First Contentful Paint (FCP) - initial render time</li>
          <li>Cumulative Layout Shift (CLS) - visual stability</li>
          <li>Interaction to Next Paint (INP) - responsiveness</li>
        </ul>
        <p>
          This data is aggregated and anonymized. It helps us identify and fix performance issues
          but does not identify individual users.
        </p>

        <h2>Error Monitoring</h2>
        <p>
          We use <strong><a href="https://glitchtip.com" target="_blank" rel="noopener noreferrer">GlitchTip</a></strong> (self-hosted) to track application errors.
          This helps us fix bugs and improve reliability. Error reports may include:
        </p>
        <ul>
          <li>Technical information such as browser type and version</li>
          <li>Page URL where the error occurred</li>
          <li>Error messages and stack traces</li>
          <li>Device type and operating system</li>
        </ul>
        <p>
          No personal data is intentionally collected. This information is used solely for debugging
          and improving the website's functionality and user experience.
        </p>

        <h2>Data Retention</h2>
        <p>We retain data only as long as necessary:</p>
        <ul>
          <li><strong>Analytics data:</strong> 90 days</li>
          <li><strong>Error logs:</strong> 30 days</li>
          <li><strong>Performance metrics:</strong> 7 days</li>
          <li><strong>Session data:</strong> Until you close your browser</li>
        </ul>
        <p>After these periods, data is automatically deleted from our systems.</p>

        <h2>What We Don't Collect</h2>
        <ul>
          <li>Names, email addresses, or other personal identifiers</li>
          <li>IP addresses (they are not stored or logged)</li>
          <li>Cross-site tracking or browsing history</li>
          <li>Data sold to advertisers or data brokers</li>
        </ul>

        <h2>Your Rights</h2>
        <p>
          You have the right to opt out of any data collection at any time using the controls
          above. Your preferences:
        </p>
        <ul>
          <li>Are stored locally in your browser</li>
          <li>Are respected across all pages of our website</li>
          <li>Can be changed at any time on this page</li>
          <li>Never require an account or personal information</li>
        </ul>

        <h2>Contact</h2>
        <p>
          If you have questions about our privacy practices, please visit our{' '}
          <a href="/contact">contact page</a>.
        </p>
      </Prose>
    </div>
  );
}
