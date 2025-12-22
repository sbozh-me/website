import { NextResponse } from "next/server";

/**
 * Runtime configuration endpoint
 * Exposes environment variables to client-side code without baking them into the build
 */
export function GET() {
  return NextResponse.json({
    directusUrl: process.env.DIRECTUS_URL ?? "http://localhost:8055",
    analytics: {
      enabled: process.env.ANALYTICS_ENABLED === "true",
      umamiWebsiteId: process.env.UMAMI_WEBSITE_ID ?? "",
      umamiScriptUrl: process.env.UMAMI_SCRIPT_URL ?? "",
      sentryDSN: process.env.SENTRY_DSN ?? "",
    },
  });
}
