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
  // Header werden jetzt über middleware.ts gesetzt
  // async headers() {
  //   return [
  //     {
  //       source: '/embed/:path*',
  //       headers: [
  //         {
  //           key: 'Content-Security-Policy',
  //           value: "frame-ancestors *"
  //         },
  //       ],
  //     },
  //   ];
  // },
};

export default nextConfig;
