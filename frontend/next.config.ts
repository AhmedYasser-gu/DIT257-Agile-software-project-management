import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    externalDir: true,
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.example.com" },
    ],
    // Use Next Image without optimization backend (CDN-agnostic)
    unoptimized: true,
  },
};

export default nextConfig;
