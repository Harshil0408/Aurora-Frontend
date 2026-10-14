import type { NextConfig } from "next";

// Backend origin for media rewrites (strip the /api/v1 suffix).
const backendOrigin = (
  process.env.BACKEND_API_BASE_URL ??
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  "http://localhost:4000/api/v1"
).replace(/\/api\/v1\/?$/, "");

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      // Public store assets (`/uploads/public/...`) resolve same-origin so
      // the media library, PDP, and listings never hardcode the backend host.
      // Private documents are never under /uploads — they stream through the
      // authed API download route instead.
      { source: "/uploads/:path*", destination: `${backendOrigin}/uploads/:path*` },
    ];
  },
};

export default nextConfig;
