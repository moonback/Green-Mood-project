import { readFileSync, writeFileSync } from 'node:fs';

const BASE = 'https://greenmood.fr';
const now = new Date().toISOString();

const staticPages = [
  '/',
  '/boutique',
  '/produits',
  '/qualite',
  '/contact',
  '/mentions-legales',
  '/catalogue',
  '/guides',
  '/guides/guide-huile-cbd',
  '/guides/guide-dosage-cbd',
  '/guides/guide-cbd-sommeil',
  '/guides/guide-cbd-anxiete',
  '/guides/guide-legalite-cbd-france',
];

function toUrlset(urls: Array<{ path: string; priority: string }>) {
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
    .map(
      ({ path, priority }) =>
        `  <url><loc>${BASE}${path}</loc><lastmod>${now}</lastmod><priority>${priority}</priority></url>`,
    )
    .join('\n')}\n</urlset>\n`;
}

const productCsv = readFileSync('public/products.csv', 'utf-8').trim().split('\n');
const productRows = productCsv.slice(1).map((line) => line.split(','));
const productSlugs = [...new Set(productRows.map((row) => row[2]).filter(Boolean))];

const pagesXml = toUrlset(staticPages.map((path) => ({ path, priority: path === '/' ? '1.0' : '0.8' })));
const productsXml = toUrlset(productSlugs.map((slug) => ({ path: `/catalogue/${slug}`, priority: '0.9' })));
const blogXml = toUrlset(staticPages.filter((p) => p.startsWith('/guides/')).map((path) => ({ path, priority: '0.7' })));

const sitemapIndex = `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <sitemap><loc>${BASE}/sitemap-pages.xml</loc><lastmod>${now}</lastmod></sitemap>\n  <sitemap><loc>${BASE}/sitemap-products.xml</loc><lastmod>${now}</lastmod></sitemap>\n  <sitemap><loc>${BASE}/sitemap-blog.xml</loc><lastmod>${now}</lastmod></sitemap>\n</sitemapindex>\n`;

writeFileSync('public/sitemap-pages.xml', pagesXml);
writeFileSync('public/sitemap-products.xml', productsXml);
writeFileSync('public/sitemap-blog.xml', blogXml);
writeFileSync('public/sitemap.xml', sitemapIndex);

console.log('Sitemaps generated');
