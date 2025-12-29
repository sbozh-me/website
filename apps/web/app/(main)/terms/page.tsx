/* v8 ignore file -- @preserve */
import type { Metadata } from 'next';
import { Prose } from '@sbozh/blog/components';

export const metadata: Metadata = {
  title: 'Terms of Use',
  description: 'Terms of Use for sbozh.me - a personal website by Semen Bozhyk',
};

export default function TermsPage() {
  return (
    <div className="container mx-auto px-4 py-12 md:py-16 max-w-3xl">
      <h1 className="text-3xl font-bold mb-4">Terms of Use</h1>
      <p className="text-muted-foreground mb-8">
        Effective Date: December 15, 2025 | Last Updated: December 15, 2025
      </p>

      <Prose>
        <h2>1. Introduction</h2>
        <p>
          Welcome to sbozh.me. This is a personal website operated by Semen Bozhyk,
          a self-employed individual (OSVČ) registered in the Czech Republic.
        </p>
        <ul>
          <li><strong>IČO:</strong> 22290575</li>
          <li><strong>Contact:</strong> sem.bozhyk@sbozh.me</li>
        </ul>
        <p>By using this website, you agree to these Terms.</p>

        <h2>2. What This Website Is</h2>
        <p>sbozh.me is a personal website featuring:</p>
        <ul>
          <li>A blog with mixed content — tech, life, creative writing experiments</li>
          <li>Descriptions of personal and open source projects</li>
          <li>An online CV / professional background</li>
        </ul>
        <p>This website does not offer commercial services, user accounts, or transactions.</p>

        <h2>3. Fictional Content Disclaimer</h2>
        <p>
          Blog posts may include fictional stories and creative writing. Any resemblance to
          actual persons, living or dead, or actual events is purely coincidental.
        </p>

        <h2>4. Intellectual Property</h2>
        <p>
          The source code of sbozh.me is Open Source under the <strong>MIT License</strong>.
        </p>
        <p>
          Written content (blog posts, project descriptions, CV) remains the intellectual
          property of the Founder and is not covered by the MIT License unless explicitly stated.
        </p>

        <h2>5. Acceptable Use</h2>
        <p>Do not:</p>
        <ul>
          <li>Use the website for unlawful purposes</li>
          <li>Attempt to disrupt or damage the website</li>
          <li>Scrape content through automated means without permission</li>
        </ul>

        <h2>6. Privacy</h2>
        <p>We collect minimal data:</p>
        <ul>
          <li><strong>Emails</strong> — only if voluntarily submitted</li>
          <li><strong>Analytics</strong> — anonymized usage data via Umami</li>
          {/*<li><strong>Error tracking</strong> — via GlitchTip</li>postponed*/}
        </ul>
        <p>
          We do not sell data or use invasive tracking. As an EU-based service, we respect GDPR.
          Contact <a href="mailto:sem.bozhyk@sbozh.me">sem.bozhyk@sbozh.me</a> for data requests.
        </p>

        <h2>7. Disclaimer</h2>
        <p>
          This website is provided "as is" without warranties. Content is for informational
          purposes only.
        </p>

        <h2>8. Liability</h2>
        <p>
          To the extent permitted by Czech law, the Founder is not liable for any damages
          arising from use of this website.
        </p>

        <h2>9. Governing Law</h2>
        <p>These Terms are governed by the laws of the Czech Republic.</p>

        <h2>10. Changes</h2>
        <p>We may update these Terms. Changes will be posted here with an updated date.</p>

        <h2>11. Contact</h2>
        <p>
          <strong>Semen Bozhyk</strong>
          <br />
          Email: <a href="mailto:sem.bozhyk@sbozh.me">sem.bozhyk@sbozh.me</a>
        </p>
      </Prose>
    </div>
  );
}
