import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Get analytics domain from script URL (runtime env var, no NEXT_PUBLIC_ prefix)
  const umamiScriptUrl = process.env.UMAMI_SCRIPT_URL || 'http://localhost:3001/script.js';
  let analyticsDomain = 'localhost:3001';
  try {
    analyticsDomain = new URL(umamiScriptUrl).host;
  } catch {
    // Keep default if URL parsing fails
  }

  // Get Sentry/GlitchTip domain from DSN
  // DSN format: {protocol}://{public_key}@{host}/{project_id}
  const sentryDsn = process.env.SENTRY_DSN || '';
  let sentryDomain = '';
  try {
    if (sentryDsn) {
      // Extract host from DSN using regex
      const match = sentryDsn.match(/@([^/]+)/);
      if (match) {
        sentryDomain = match[1];
      }
    }
  } catch {
    // Keep empty if parsing fails
  }

  // Configure CSP to allow Umami and Sentry/GlitchTip
  const externalDomains = [analyticsDomain, sentryDomain].filter(Boolean).join(' ');
  const cspHeader = `
    default-src 'self';
    script-src 'self' 'unsafe-inline' 'unsafe-eval' ${analyticsDomain};
    style-src 'self' 'unsafe-inline';
    img-src 'self' data: blob: ${analyticsDomain};
    font-src 'self';
    connect-src 'self' ${externalDomains};
    frame-ancestors 'none';
    base-uri 'self';
    form-action 'self';
  `.replace(/\n/g, '').replace(/\s+/g, ' ').trim();

  response.headers.set('Content-Security-Policy', cspHeader);

  // Additional security headers
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  return response;
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};