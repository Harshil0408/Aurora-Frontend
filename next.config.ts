import type { NextConfig } from "next";
import createBundleAnalyzer from "@next/bundle-analyzer";

// Bundle analysis: `ANALYZE=true npm run build`. No effect unless the env
// var is set (dev-only dependency, never shipped to the browser).
const withBundleAnalyzer = createBundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

// Backend origin for media rewrites (strip the /api/v1 suffix).
const backendOrigin = (
  process.env.BACKEND_API_BASE_URL ??
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  "http://localhost:4000/api/v1"
).replace(/\/api\/v1\/?$/, "");

/**
 * Remote image allow-list: only the backend's `/uploads/**` public media.
 * The browser normally loads these same-origin via the rewrite below; this
 * pattern additionally lets `next/image` optimize a direct backend URL.
 * Never broaden past `/uploads/**` — private documents stream through the
 * authed API download route and must not pass through the image optimizer.
 */
function uploadsRemotePattern(): NonNullable<NextConfig["images"]>["remotePatterns"] {
  try {
    const u = new URL(backendOrigin);
    // Next 16 RemotePattern protocol is 'http' | 'https' (no trailing colon).
    const protocol = u.protocol.replace(/:$/, "");
    if (protocol !== "http" && protocol !== "https") return [];
    return [
      {
        protocol,
        hostname: u.hostname,
        ...(u.port ? { port: u.port } : {}),
        pathname: "/uploads/**",
      },
    ];
  } catch {
    return [];
  }
}

/**
 * Security headers for every response. CSP is relaxed just enough for the
 * stack: Emotion/MUI inject inline styles; Next ships an inline bootstrap
 * script (no nonce wiring yet); dev mode needs `unsafe-eval` for webpack HMR.
 * QR codes are `data:` URLs and upload previews are `blob:` URLs — both
 * allowed in `img-src`. All API/media traffic is same-origin (BFF + rewrite),
 * so `connect-src`/`img-src` need no foreign origins.
 */
const isProd = process.env.NODE_ENV === "production";
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isProd ? "" : " 'unsafe-eval'"}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
];

/** Private panels must never be indexed, even if a crawler ignores robots.txt. */
const noIndexHeader = { key: "X-Robots-Tag", value: "noindex, nofollow" };

const nextConfig: NextConfig = {
  compress: true,
  poweredByHeader: false,
  images: {
    formats: ["image/avif", "image/webp"],
    // Public uploads are immutable per URL in practice (new file = new path);
    // one week is a deliberate floor, CDNs may hold longer.
    minimumCacheTTL: 60 * 60 * 24 * 7,
    remotePatterns: uploadsRemotePattern(),
  },
  // Trim barrel imports (MUI, icons, date-fns) from server + client bundles.
  // Next 16: optimizePackageImports lives under `experimental`.
  experimental: {
    optimizePackageImports: [
      "@mui/material",
      "@mui/icons-material",
      "@mui/system",
      "@emotion/react",
      "@emotion/styled",
      "date-fns",
    ],
  },
  async rewrites() {
    return [
      // Public store assets (`/uploads/public/...`) resolve same-origin so
      // the media library, PDP, and listings never hardcode the backend host.
      // Private documents are never under `/uploads` — they stream through
      // the authed API download route instead.
      { source: "/uploads/:path*", destination: `${backendOrigin}/uploads/:path*` },
    ];
  },
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      { source: "/admin/:path*", headers: [noIndexHeader] },
      { source: "/seller/:path*", headers: [noIndexHeader] },
    ];
  },
};

export default withBundleAnalyzer(nextConfig);
