import type { Metadata } from "next";
import { Space_Grotesk, JetBrains_Mono } from "next/font/google";

import { Toaster } from "@sbozh/react-ui/components/ui/sonner";

import { CookieConsentModal } from "@/components/CookieConsentModal";
import { Footer } from "@/components/Footer";
import { AnalyticsProvider } from "@/providers/AnalyticsProvider";
import { PerformanceProvider } from "@/providers/PerformanceProvider";
import { SentryProvider } from "@/providers/SentryProvider";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
});

export const metadata: Metadata = {
  metadataBase: new URL('https://sbozh.me'),
  title: {
    default: 'sbozh.me',
    template: '%s | sbozh.me',
  },
  description: 'A place where I build and ship things in public.',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: '/apple-touch-icon.png',
  },
  manifest: '/site.webmanifest',
  openGraph: {
    title: 'sbozh.me',
    description: 'A place where I build and ship things in public.',
    type: 'website',
    locale: 'en_US',
    siteName: 'sbozh.me',
    images: ['/ogdefault.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'sbozh.me',
    description: 'A place where I build and ship things in public.',
    images: ['/ogdefault.png'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${spaceGrotesk.variable} ${jetbrainsMono.variable}`}
    >
      <body className="flex min-h-screen flex-col antialiased">
        <SentryProvider>
          <AnalyticsProvider>
            <PerformanceProvider>
              {children}
              <Footer />
              <Toaster />
              <CookieConsentModal />
            </PerformanceProvider>
          </AnalyticsProvider>
        </SentryProvider>
      </body>
    </html>
  );
}
