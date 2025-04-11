// sitemap.js
// This file contains all the routes for the sitemap generation

export const routes = [
  // Main pages
  {
    url: '/',
    changefreq: 'daily',
    priority: 1.0,
  },
  {
    url: '/home',
    changefreq: 'daily',
    priority: 0.9,
  },
  {
    url: '/produtos',
    changefreq: 'daily',
    priority: 0.9,
  },
  {
    url: '/servicos',
    changefreq: 'weekly',
    priority: 0.8,
  },
  {
    url: '/privacy',
    changefreq: 'monthly',
    priority: 0.5,
  },
  {
    url: '/orcamento',
    changefreq: 'weekly',
    priority: 0.8,
  },
  {
    url: '/profile',
    changefreq: 'monthly',
    priority: 0.5,
  },
  {
    url: '/orders/tracking',
    changefreq: 'monthly',
    priority: 0.5,
  },
  {
    url: '/checkout',
    changefreq: 'monthly',
    priority: 0.5,
  },
  {
    url: '/cart',
    changefreq: 'monthly',
    priority: 0.5,
  },

  // Product category pages
  {
    url: '/produtos/adesivos',
    changefreq: 'weekly',
    priority: 0.8,
  },
  {
    url: '/produtos/camisetas',
    changefreq: 'weekly',
    priority: 0.8,
  },
  {
    url: '/produtos/canecas',
    changefreq: 'weekly',
    priority: 0.8,
  },

  // Service-specific pages
  {
    url: '/servicos/plotagem',
    changefreq: 'weekly',
    priority: 0.7,
  },
  {
    url: '/servicos/adesivos',
    changefreq: 'weekly',
    priority: 0.7,
  },
  {
    url: '/servicos/dtf-camisetas',
    changefreq: 'weekly',
    priority: 0.7,
  },
  {
    url: '/servicos/corte-laser',
    changefreq: 'weekly',
    priority: 0.7,
  },
];

// Dynamic routes that need to be generated at build time
// These will be populated from the database during sitemap generation
export const dynamicRoutes = {
  products: '/produtos/[id]',
};

// Routes to exclude from the sitemap
export const excludedRoutes = [
  '/admin',
  '/admin/*',
  '/api/*',
  '/produtos/stripe',
  '/produtos/stripe/*',
];
