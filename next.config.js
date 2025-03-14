
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
        webpack: (config, { isServer }) => {
          config.stats = {
            preset: 'verbose',
            bodySizeLimit: undefined,
            allowedOrigins: undefined
          };
          return config;
        },
        experimental: {
          serverActions: true
        }
      };
      export default config;
