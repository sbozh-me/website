import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Get analytics domain from environment
  const analyticsDomain = process.env.NEXT_PUBLIC_UMAMI_DOMAIN || 'localhost:3001';

  // Configure CSP to allow Umami
  const cspHeader = `
    default-src 'self';
    script-src 'self' 'unsafe-inline' 'unsafe-eval' ${analyticsDomain};
    style-src 'self' 'unsafe-inline';
    img-src 'self' data: blob: ${analyticsDomain};
    font-src 'self';
    connect-src 'self' ${analyticsDomain};
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