import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";

/**
 * Baseline security headers (H1). Applied to every response. Notes:
 *  - HSTS is production-only; sending it over plain HTTP in dev would pin
 *    localhost to HTTPS in the browser.
 *  - A full Content-Security-Policy is intentionally NOT set here yet: it needs
 *    to be tuned against Stripe Checkout + Google OAuth and verified in a
 *    staging environment before enforcing (see docs/security/fixes/04). The
 *    headers below are the safe, no-regression subset.
 */
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
  ...(isProd
    ? [
        {
          key: "Strict-Transport-Security",
          value: "max-age=63072000; includeSubDomains; preload",
        },
      ]
    : []),
];

const nextConfig: NextConfig = {
  // Emit a self-contained server bundle (.next/standalone) for the container
  // image. See Dockerfile — the runner stage copies only this output.
  output: "standalone",
  headers: async () => [{ source: "/:path*", headers: securityHeaders }],
};

export default nextConfig;
