import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Export a static site for Electron to load from the local filesystem
  output: 'export',
  trailingSlash: true,
  // IMPORTANT: make asset URLs relative so they work with file:// in Electron
  // This ensures links like /_next/static/... become ./_next/static/...
  assetPrefix: './',
  images: {
    unoptimized: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  webpack: (config, { isServer }) => {
    // Handle FFmpeg WASM files
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
      crypto: false,
    };

    // Handle binary files
    config.module.rules.push({
      test: /\.(wasm)$/,
      type: 'asset/resource',
    });

    return config;
  },
};

export default nextConfig;
