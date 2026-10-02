import type { Metadata } from "next";
import { Space_Grotesk, JetBrains_Mono, Inter, Caveat, Archivo_Black, Rubik_Glitch, Cinzel, Forum } from "next/font/google";

import { Toaster } from "@sbozh/react-ui/components/ui/sonner";
import { ThemeProvider, readerThemeScript } from "@sbozh/themes";

import { CookieConsentModal } from "@/components/CookieConsentModal";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { CyrillicHeadings } from "@/components/ReaderTheme";
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

// Blog glitch words (trial). Latin only: Cyrillic glitch words fall back to Space Grotesk.
const archivoBlack = Archivo_Black({
  subsets: ["latin", "latin-ext"],
  weight: "400",
  variable: "--font-archivo-black",
  display: "swap",
});

// red: glitch states (trial). Cyrillic too: the Kagurame posts are Russian and Ukrainian.
const rubikGlitch = Rubik_Glitch({
  subsets: ["latin", "latin-ext", "cyrillic", "cyrillic-ext"],
  weight: "400",
  variable: "--font-rubik-glitch",
  display: "swap",
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
      className={`${spaceGrotesk.variable} ${jetbrainsMono.variable} ${inter.variable} ${caveat.variable} ${archivoBlack.variable} ${rubikGlitch.variable} ${cinzel.variable} ${forum.variable}`}
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
                <CookieConsentModal />
              </PerformanceProvider>
            </AnalyticsProvider>
          </SentryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
