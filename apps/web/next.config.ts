import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: "standalone",
  // TODO: Enable when build server has more memory
  // productionBrowserSourceMaps: true, // Enable public source maps for better error tracking
};

export default withSentryConfig(nextConfig, {
  // For all available options, see:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

  org: "sbozh",
  project: "web",

  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,

  // Upload a larger set of source maps for prettier stack traces (increases build time)
  widenClientFileUpload: true,

  // Route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
  // This can increase your server load as well as your hosting bill.
  // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
  // side errors will fail.
  tunnelRoute: "/monitoring",

  // Generate source maps but don't upload them (GlitchTip will fetch them from public URLs)
  sourcemaps: {
    disable: true,
    // TODO: Enable when build server has more memory
    // // Don't try to upload to GlitchTip (it doesn't support Sentry's upload API)
    // uploadLegacySourcemaps: false,
  },
});
