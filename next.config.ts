import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const config: NextConfig = {
  serverExternalPackages: ["@electric-sql/pglite"],
  // Subidas desde el panel: hasta 8 MB por archivo y 60 MB por envío (subida múltiple)
  experimental: { serverActions: { bodySizeLimit: "60mb" } },
  images: {
    remotePatterns: [{ protocol: "https", hostname: "www.congreso.gob.gt" }],
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default config;
