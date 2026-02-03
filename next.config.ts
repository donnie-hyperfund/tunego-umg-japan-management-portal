import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true, // TODO: Fix ESLint errors and set back to false
  },
  images: {
    domains: [],
    unoptimized: true,
  },
  // Increase body size limit for file uploads
  experimental: {
    serverActions: {
      bodySizeLimit: '500mb',
    },
  },
  webpack: (config, { isServer }) => {
    // Fix for leaflet-draw CSS image imports
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
      };
    }
    return config;
  },
};

export default nextConfig;
