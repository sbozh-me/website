import type { Metadata } from "next";
import { Space_Grotesk, JetBrains_Mono, Inter, Caveat, Rubik_Glitch, Cinzel, Forum } from "next/font/google";
import localFont from "next/font/local";

import { Toaster } from "@sbozh/react-ui/components/ui/sonner";
import { ThemeProvider, readerThemeScript } from "@sbozh/themes";

import { CookieGate } from "@/components/CookieGate";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { LinkPreview } from "@/components/LinkPreview";
import { CyrillicHeadings } from "@/components/ReaderTheme";
import { AnalyticsProvider } from "@/providers/AnalyticsProvider";
import { PerformanceProvider } from "@/providers/PerformanceProvider";
import { SentryProvider } from "@/providers/SentryProvider";
import "./globals.css";
// The ✳ censor in excerpts shows on every post list (blog, series, 404), not only in posts
import "@/lib/blog/glitch/glitch.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
});

// Document faces for the PMDXJS "normal" theme (CV / PDF), and the body face of the
// roman-white reading theme. Self-hosted by next/font so the PDF service's Chromium gets
// them from the site itself. Cyrillic for the Russian and Ukrainian posts.
const inter = Inter({
  subsets: ["latin", "latin-ext", "cyrillic", "cyrillic-ext"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-inter",
  display: "swap",
});

const caveat = Caveat({
  subsets: ["latin", "latin-ext"],
  weight: ["500"],
  variable: "--font-caveat",
  display: "swap",
});

// Blog glitch words: Sofija, one family, upright for a glitched state and italic for a `||`
// plain state. A brushy all-caps display face; Latin only, so Cyrillic glitch words fall back
// to Space Grotesk (the red states, which carry Cyrillic, use Rubik Glitch).
const sofija = localFont({
  src: [
    { path: "../public/fonts/Sofija.ttf", weight: "400", style: "normal" },
    { path: "../public/fonts/Sofija-Italic.ttf", weight: "400", style: "italic" },
  ],
  variable: "--font-sofija",
  display: "swap",
});

// red: glitch states (trial). Cyrillic too: the Kagurame posts are Russian and Ukrainian.
const rubikGlitch = Rubik_Glitch({
  subsets: ["latin", "latin-ext", "cyrillic", "cyrillic-ext"],
  weight: "400",
  variable: "--font-rubik-glitch",
  display: "swap",
});

// Glitch words with the window OFF: shapes instead of letters, so what a word glitches into
// stays hidden (lib/blog/glitch/cipher.ts). `block` and no fallback face: it must never show
// in a readable font while it loads.
const fourSided = localFont({
  src: "../public/fonts/4-Sided.ttf",
  variable: "--font-four-sided",
  display: "block",
  adjustFontFallback: false,
});

// roman-white headings: Cinzel capitals (Latin only), and Forum for a heading with
// Cyrillic in it, so no heading mixes two faces.
const cinzel = Cinzel({
  subsets: ["latin", "latin-ext"],
  weight: ["600"],
  variable: "--font-cinzel",
  display: "swap",
});

const forum = Forum({
  subsets: ["latin", "latin-ext", "cyrillic", "cyrillic-ext"],
  weight: "400",
  variable: "--font-forum",
  display: "swap",
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
  alternates: {
    types: {
      // One site-wide feed per format: readers that auto-discover multiple feeds would otherwise
      // subscribe to both the all-feed and a topic-feed and show every blog post twice.
      // The topic feeds at /library/rss.xml and /releases/rss.xml still work via the FeedMenu.
      'application/rss+xml': [{ url: '/rss.xml', title: 'sbozh.me' }],
      'application/atom+xml': [{ url: '/atom.xml', title: 'sbozh.me' }],
    },
  },
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
      data-theme="obsidian-forge"
      className={`${spaceGrotesk.variable} ${jetbrainsMono.variable} ${inter.variable} ${caveat.variable} ${sofija.variable} ${rubikGlitch.variable} ${fourSided.variable} ${cinzel.variable} ${forum.variable}`}
      // The reader-theme script below changes data-theme before React hydrates
      suppressHydrationWarning
    >
      <head>
        {/* Applies the reader's saved theme (or ?theme=) before first paint: no dark flash */}
        <script dangerouslySetInnerHTML={{ __html: readerThemeScript }} />
      </head>
      <body className="flex min-h-screen flex-col antialiased">
        <ThemeProvider theme="obsidian-forge">
          <SentryProvider>
            <AnalyticsProvider>
              <PerformanceProvider>
                <Header />
                <CyrillicHeadings />
                {children}
                <Footer />
                <Toaster />
                <CookieGate />
                <LinkPreview />
              </PerformanceProvider>
            </AnalyticsProvider>
          </SentryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
