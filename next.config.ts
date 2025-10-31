import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
