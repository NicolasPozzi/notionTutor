const isDev = process.env.NODE_ENV === "development";

// Content Security Policy.
// - Next.js injects inline bootstrap scripts, hence 'unsafe-inline' for scripts
//   (a nonce-based CSP would require dynamic rendering of every page).
// - Dev mode (React Refresh) needs 'unsafe-eval'; production does not.
// - vercel.live: Vercel's preview toolbar on preview deployments.
// - img-src https: user avatars come from Notion's CDNs (S3, Google…).
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""} https://vercel.live`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "connect-src 'self' https://vercel.live",
  "frame-src https://vercel.live",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  // React strict mode for better development experience
  reactStrictMode: true,

  // Don't advertise the framework (x-powered-by: Next.js)
  poweredByHeader: false,

  // No next/image usage: the image optimizer is disabled entirely, removing
  // its attack surface (several Next 14 advisories target it).
  images: {
    unoptimized: true,
  },

  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
