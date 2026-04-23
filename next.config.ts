import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    domains: ["img.youtube.com"],
  },
  async headers() {
    return [
      {
        source: "/watch/:path*",
        headers: [
          { key: "X-Frame-Options", value: "ALLOWALL" },
          { key: "Content-Security-Policy", value: "frame-ancestors *" },
        ],
      },
      {
        // /embed — domain restriction enforced via signed JWT token + CSP
        source: "/embed/:path*",
        headers: [
          // X-Frame-Options does not support multiple domains; rely on CSP instead
          { key: "X-Frame-Options", value: "ALLOWALL" },
          // frame-ancestors restricts which domains can embed this page in an iframe.
          // 'self' allows preview in v0/Vercel. Add your academy domain here.
          {
            key: "Content-Security-Policy",
            value: "frame-ancestors 'self' https://miacademia.com",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
