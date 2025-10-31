import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ESLint-Fehler beim Build ignorieren (verhindert Timeouts bei Vercel/Deployment)
  eslint: {
    ignoreDuringBuilds: true,
  },
  // TypeScript-Fehler beim Build ignorieren (für Vercel Deployment)
  typescript: {
    ignoreBuildErrors: true,
  },
  async headers() {
    return [
      {
        // Erlaubt das Einbetten der Embed-Seite in iFrames
        source: '/embed',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'Content-Security-Policy',
            value: "frame-ancestors *"
          },
        ],
      },
    ];
  },
};

export default nextConfig;
