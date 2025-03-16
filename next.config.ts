/** @type {import("next").NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
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
  webpack: (config: { stats: { preset: string; colors: boolean; modules: boolean; reasons: boolean; errorDetails: boolean; }; }, { }: any) => {
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

module.exports = nextConfig;