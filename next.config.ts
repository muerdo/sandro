import type { NextConfig } from "next";
import type { Configuration } from "webpack";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*",
        pathname: "**",
      },
    ],
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  webpack: (config: Configuration) => {
    config.stats = {
      preset: "verbose",
      colors: true,
      modules: true,
      reasons: true,
      errorDetails: true,
    };
    return config;
  },
};

export default nextConfig;