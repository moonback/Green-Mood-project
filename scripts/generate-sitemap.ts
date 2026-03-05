import fs from 'fs/promises';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

const BASE_URL = 'https://green-ia.io';

const staticPaths = [
  '/',
  '/boutique',
  '/produits',
  '/qualite',
  '/contact',
  '/catalogue',
  '/cbd-shop-software',
  '/cbd-pos-system',
  '/cbd-ecommerce-platform',
  '/cbd-ai-budtender',
];

async function fetchDynamicPaths() {
  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

  if (!url || !key) {
    return { products: [] as string[], categories: [] as string[], tenants: [] as string[] };
  }

  const supabase = createClient(url, key);

  const [{ data: products }, { data: categories }, { data: stores }] = await Promise.all([
    supabase.from('products').select('slug').eq('is_active', true),
    supabase.from('categories').select('slug').eq('is_active', true),
    supabase.from('stores').select('domain').eq('is_active', true),
  ]);

  return {
    products: (products ?? []).map((item: { slug: string }) => `/catalogue/${item.slug}`),
    categories: (categories ?? []).map((item: { slug: string }) => `/produits?categorie=${item.slug}`),
    tenants: (stores ?? []).map((item: { domain: string }) => `https://${item.domain}`),
  };
}

function toUrlNode(url: string) {
  const loc = url.startsWith('http') ? url : `${BASE_URL}${url}`;
  return `<url><loc>${loc}</loc><changefreq>weekly</changefreq><priority>0.8</priority></url>`;
}

async function run() {
  const { products, categories, tenants } = await fetchDynamicPaths();
  const allUrls = [...staticPaths, ...products, ...categories, ...tenants];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${allUrls
    .map(toUrlNode)
    .join('\n')}\n</urlset>`;

  const outputPath = path.resolve(process.cwd(), 'public/sitemap.xml');
  await fs.writeFile(outputPath, xml, 'utf8');

  console.log(`Sitemap generated at ${outputPath} with ${allUrls.length} URLs.`);
}

run().catch((error) => {
  console.error('Failed to generate sitemap:', error);
  process.exit(1);
});
