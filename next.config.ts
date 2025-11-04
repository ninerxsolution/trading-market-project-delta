import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
      },
      {
        protocol: 'https',
        hostname: 'api.dicebear.com',
      },
      {
        protocol: 'https',
        hostname: 'www.roblox.com',
      },
    ],
  },
  // Allow ngrok domain for development
  allowedDevOrigins: [
    '2d7a810b4f87.ngrok-free.app',
    '*.ngrok-free.app',
    '*.ngrok.app',
  ],
};

export default nextConfig;
