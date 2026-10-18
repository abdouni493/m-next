import { useEffect, useState } from 'react';
import {
  supabase,
  getAllProductsREST,
  getSpecialOffersREST,
  getVisiblePackagesREST,
  getApprovedTestimonials,
  getWebsiteSettingsREST,
} from '@/lib/supabaseClient';
import { storeConfig } from '../storeConfig';
import { parseDescription, type ParsedDescription } from './description';
import { slugify } from './format';

export interface ShopProduct {
  id: string;
  slug: string;
  title: string;
  rawName: string;
  brand: string;
  brandLogo?: string;
  voltage?: number;
  amperage?: number;
  wattage?: number;
  connector?: string;
  price: number;
  oldPrice?: number;
  discountPct?: number;
  offerId?: string;
  offerEndsAt?: string;
  images: string[];
  description: string;
  parsed: ParsedDescription;
  compatibleModels: string[];
  stock?: number;
  featured: boolean;
  createdAt?: string;
  searchText: string;
}

const num = (v: unknown): number | undefined => {
  const n = parseFloat(String(v ?? '').replace(',', '.'));
  return Number.isFinite(n) && n > 0 ? n : undefined;
};

/** Maps free-form connector names (DB or product title) onto storeConfig.connectors labels. */
export const detectConnector = (...sources: (string | undefined)[]): string | undefined => {
  const t = sources.filter(Boolean).join(' ').toLowerCase();
  if (!t) return undefined;
  if (/usb[\s-]?c|type[\s-]?c/.test(t)) return 'USB-C';
  if (/blue\s?pin|4\.5\s*(mm)?\s*[x×]\s*3/.test(t)) return 'Blue Pin 4.5×3.0';
  if (/big\s?pin|7\.4\s*(mm)?\s*[x×]\s*5/.test(t)) return 'Big Pin 7.4×5.0';
  if (/\bxps\b|slim/.test(t)) return 'Slim tip 4.5×3.0 (XPS)';
  if (/surface/.test(t)) return 'Surface Connect';
  if (/magsafe/.test(t)) return 'MagSafe';
  if (/micro[\s-]?usb/.test(t)) return 'Micro USB';
  return undefined;
};

const canonicalBrand = (raw?: string, name?: string): string => {
  if (!raw && name) {
    const hit = storeConfig.brands.find((b) => new RegExp(`\\b${b}\\b`, 'i').test(name));
    if (hit) return hit;
  }
  if (!raw) return 'Autre';
  const r = raw.trim();
  const hit = storeConfig.brands.find((b) => b.toLowerCase() === r.toLowerCase());
  if (hit) return hit;
  if (/rog|republic/i.test(r)) return 'ROG';
  return r.charAt(0).toUpperCase() + r.slice(1);
};

/** "Chargeur {Marque} {Connecteur} {Puissance}" (+ V/A when known) */
export const cleanTitle = (p: { brand: string; connector?: string; wattage?: number; voltage?: number; amperage?: number; rawName: string }) => {
  if (!p.wattage && !p.connector) return p.rawName.replace(/\s{2,}/g, ' ').trim();
  const shortConnector = p.connector && !p.connector.toLowerCase().includes(p.brand.toLowerCase())
    ? p.connector.replace(/\s*\d.*$/, '').replace(/\s*\(.*\)$/, '')
    : '';
  const parts = ['Chargeur', p.brand !== 'Autre' ? p.brand : '', shortConnector, p.wattage ? `${p.wattage}W` : ''].filter(Boolean);
  const va = p.voltage && p.amperage ? ` (${p.voltage}V ${p.amperage}A)` : '';
  return parts.join(' ') + va;
};

function normalize(row: any, images: string[], promo?: any): ShopProduct {
  const brand = canonicalBrand(row.product_mark || row.marks?.name, row.name);
  const parsed = parseDescription(row.description);
  const base = {
    brand,
    connector: detectConnector(row.name) || detectConnector(row.connection_type || row.connector_types?.name) || row.connection_type || undefined,
    wattage: num(row.wattage),
    voltage: num(row.voltage),
    amperage: num(row.amperage),
    rawName: String(row.name || 'Chargeur'),
  };
  const sellingPrice = num(row.selling_price) ?? 0;
  const promoPrice = promo && promo.show_price !== false ? num(promo.special_price ?? promo.offer_price) : undefined;
  const oldPrice = num(row.old_price) ?? (promoPrice ? num(promo.original_price) ?? sellingPrice : undefined);
  const price = promoPrice ?? sellingPrice;
  const compat: string[] = Array.isArray(row.compatible_models) && row.compatible_models.length ? row.compatible_models : parsed.compatibleModels;
  const title = cleanTitle(base);
  const allImages = [...new Set([...(row.primary_image ? [row.primary_image] : []), ...images, ...(Array.isArray(row.images) ? row.images : [])])].filter(Boolean);

  return {
    id: row.id,
    slug: row.slug || `${slugify(title)}-${String(row.id).slice(0, 6)}`,
    title,
    ...base,
    brandLogo: row.marks?.logo_url || row.brand_logo,
    price,
    oldPrice: oldPrice && oldPrice > price ? oldPrice : undefined,
    discountPct: oldPrice && oldPrice > price && price > 0 ? Math.round((1 - price / oldPrice) * 100) : undefined,
    offerId: promo?.id,
    offerEndsAt: promo?.end_date || promo?.ends_at || undefined,
    images: allImages,
    description: row.description || '',
    parsed,
    compatibleModels: compat,
    // Stock is only shown when actually tracked (> 0); 0 means "not tracked" in this database.
    stock: Number(row.quantity_on_hand) > 0 ? Number(row.quantity_on_hand) : undefined,
    featured: Boolean(row.featured ?? row.is_featured),
    createdAt: row.created_at,
    searchText: [title, row.name, brand, base.connector, base.wattage && `${base.wattage}w`, base.voltage && `${base.voltage}v`, ...compat]
      .filter(Boolean).join(' ').toLowerCase(),
  };
}

async function fetchImages(): Promise<Map<string, string[]>> {
  const map = new Map<string, string[]>();
  try {
    const { data } = await supabase
      .from('product_images')
      .select('product_id,image_url,display_order,is_primary')
      .order('display_order', { ascending: true });
    for (const r of data || []) {
      if (!r.image_url) continue;
      const list = map.get(r.product_id) || [];
      if (r.is_primary) list.unshift(r.image_url); else list.push(r.image_url);
      map.set(r.product_id, list);
    }
  } catch { /* images table may be private — fall back to primary_image */ }
  return map;
}

let catalogPromise: Promise<ShopProduct[]> | null = null;

export function loadCatalog(force = false): Promise<ShopProduct[]> {
  if (!catalogPromise || force) {
    catalogPromise = (async () => {
      const [rows, images, specials] = await Promise.all([
        getAllProductsREST(),
        fetchImages(),
        getSpecialOffersREST().catch(() => []),
      ]);
      const promoByProduct = new Map<string, any>();
      for (const s of specials as any[]) if (s.is_visible !== false && s.product_id) promoByProduct.set(s.product_id, s);
      return (rows as any[])
        .filter((r) => r.is_active !== false)
        .map((r) => normalize(r, images.get(r.id) || [], promoByProduct.get(r.id)));
    })().catch((e) => { catalogPromise = null; throw e; });
  }
  return catalogPromise;
}

function useAsync<T>(fn: () => Promise<T>, initial: T): { data: T; loading: boolean; error: unknown } {
  const [state, setState] = useState<{ data: T; loading: boolean; error: unknown }>({ data: initial, loading: true, error: null });
  useEffect(() => {
    let alive = true;
    fn().then((data) => alive && setState({ data, loading: false, error: null }))
      .catch((error) => alive && setState({ data: initial, loading: false, error }));
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return state;
}

export const useCatalog = () => {
  const { data, loading, error } = useAsync(loadCatalog, [] as ShopProduct[]);
  return { products: data, loading, error };
};

let packsPromise: Promise<any[]> | null = null;
export const loadPacks = () => (packsPromise ??= getVisiblePackagesREST().catch(() => []));
export const usePacks = () => {
  const { data, loading } = useAsync(loadPacks, [] as any[]);
  return { packs: data, loading };
};

let reviewsPromise: Promise<any[]> | null = null;
export const loadReviews = (force = false) => {
  if (!reviewsPromise || force) reviewsPromise = getApprovedTestimonials().catch(() => []);
  return reviewsPromise;
};
export const useReviews = () => {
  const { data, loading } = useAsync(loadReviews, [] as any[]);
  return { reviews: data, loading };
};

let settingsPromise: Promise<any> | null = null;
export const loadSettings = () => (settingsPromise ??= getWebsiteSettingsREST().catch(() => null));

export interface StoreSettings {
  name: string;
  logoUrl?: string;
  slogan?: string;
  phone: string;
  whatsapp: string;
  email: string;
  address: string;
  facebook?: string;
  instagram?: string;
  tiktok?: string;
  heroImage?: string;
}

const toIntl = (phone?: string) => {
  const d = (phone || '').replace(/\D/g, '');
  if (!d) return '';
  if (d.startsWith('213')) return d;
  if (d.startsWith('0')) return '213' + d.slice(1);
  return d;
};

export const useStoreSettings = (): StoreSettings => {
  const { data } = useAsync(loadSettings, null as any);
  const c = storeConfig.contact;
  return {
    name: data?.store_name || storeConfig.name,
    logoUrl: data?.logo_url || undefined,
    slogan: data?.slogan || storeConfig.tagline,
    phone: data?.phone_number || c.phone,
    whatsapp: toIntl(data?.whatsapp_number) || c.whatsapp,
    email: data?.email || c.email,
    address: data?.location || c.address,
    facebook: data?.facebook_url || undefined,
    instagram: data?.instagram_url || undefined,
    tiktok: data?.tiktok_url || undefined,
    heroImage: data?.landing_page_image_url || undefined,
  };
};

export const whatsappLink = (number: string, message = storeConfig.whatsappMessage) =>
  `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
