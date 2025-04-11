// next-sitemap.config.js
module.exports = {
    siteUrl: 'https://www.sandroadesivos.com.br',
    generateRobotsTxt: true,
    sitemapSize: 7000,
    changefreq: 'weekly',
    priority: 0.7,
    exclude: ['/admin', '/api/*'],
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
  }