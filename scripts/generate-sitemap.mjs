// Generates public/sitemap.xml with every visible product. Runs before `vite build`.
// Never fails the build: if Supabase is unreachable the static sitemap is kept.
import { writeFileSync, readFileSync, existsSync } from 'node:fs';

const SITE = 'https://m-next-tech.vercel.app';
const loadEnv = () => {
  for (const f of ['.env.local', '.env']) {
    if (!existsSync(f)) continue;
    for (const line of readFileSync(f, 'utf8').split('\n')) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
    }
  }
};
loadEnv();
const url = process.env.VITE_SUPABASE_URL;
const key = process.env.VITE_SUPABASE_ANON_KEY;

const slugify = (t) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80);
const staticPages = [['/website-shop', 'daily', '1.0'], ['/website-shop/offers', 'daily', '0.9'], ['/website-shop/special-offers', 'daily', '0.8'], ['/website-shop/packages', 'weekly', '0.6'], ['/website-shop/contacts', 'monthly', '0.5']];

try {
  if (!url || !key) throw new Error('Supabase env not set');
  const res = await fetch(`${url}/rest/v1/products?select=*&is_active=eq.true`, { headers: { apikey: key } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const products = await res.json();
  const urls = [
    ...staticPages.map(([p, f, pr]) => `  <url><loc>${SITE}${p}</loc><changefreq>${f}</changefreq><priority>${pr}</priority></url>`),
    ...products.map((p) => {
      const slug = p.slug || `${slugify(p.name || 'chargeur')}-${String(p.id).slice(0, 6)}`;
      const lastmod = p.updated_at ? `<lastmod>${p.updated_at.slice(0, 10)}</lastmod>` : '';
      return `  <url><loc>${SITE}/website-shop/product/${slug}</loc>${lastmod}<changefreq>weekly</changefreq><priority>0.7</priority></url>`;
    }),
  ];
  writeFileSync('public/sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`);
  console.log(`sitemap: ${products.length} products`);
} catch (e) {
  console.warn('sitemap: kept static version —', e.message);
}
