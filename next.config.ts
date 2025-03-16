/** @type {import("next").NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
}
module.exports = nextConfig
const config = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*',
        pathname: '**',
      },
    ],
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  webpack: (/** @type {{ stats: { preset: string; colors: boolean; modules: boolean; reasons: boolean; errorDetails: boolean; }; }} */ config) => {
    config.stats = {
      preset: 'verbose',
      colors: true,
      modules: true,
      reasons: true,
      errorDetails: true
    };
    return config;
  }
};

export default config;
