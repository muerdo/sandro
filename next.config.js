
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
          config.stats = "verbose";
          return config;
        }
      };
      export default config;
