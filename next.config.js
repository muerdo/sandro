/** @type {import("next").NextConfig} */
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
  webpack: (config) => {
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
