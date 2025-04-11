// next-sitemap.config.js
import { routes, excludedRoutes } from './sitemap.js';

/** @type {import('next-sitemap').IConfig} */
const config = {
    siteUrl: 'https://www.sandroadesivos.com.br',
    generateRobotsTxt: true,
    sitemapSize: 7000,
    changefreq: 'weekly',
    priority: 0.7,
    exclude: excludedRoutes,
    robotsTxtOptions: {
      policies: [
        {
          userAgent: '*',
          allow: '/',
        },
        {
          userAgent: '*',
          disallow: ['/admin', '/api'],
        },
      ],
      additionalSitemaps: [
        'https://www.sandroadesivos.com.br/sitemap.xml',
      ],
    },
    // Use the routes from sitemap.js
    additionalPaths: async () => {
      const result = [];
      
      // Add all routes from the sitemap.js file
      for (const route of routes) {
        result.push({
          loc: route.url,
          changefreq: route.changefreq,
          priority: route.priority,
          lastmod: new Date().toISOString(),
        });
      }
      
      return result;
    },
};

export default config;
