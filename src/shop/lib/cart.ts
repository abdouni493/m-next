import { useSyncExternalStore } from 'react';
import type { ShopProduct } from './catalog';
import { track } from './track';

/** Same shape the existing order flow (createOrderREST) already expects. */
export interface CartItem {
  product_id: string;
  name: string;
  product_name?: string;
  price: number;
  quantity: number;
  image?: string;
  product_image?: string;
  product_mark?: string;
  product_description?: string;
  voltage?: number | string;
  wattage?: number | string;
  amperage?: number | string;
  connection_type?: string;
  from_offer?: boolean;
  offer_id?: string | null;
  slug?: string;
}

const KEY = 'cart';
const listeners = new Set<() => void>();

const read = (): CartItem[] => {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) || '[]');
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
};

let snapshot: CartItem[] = read();

const write = (items: CartItem[]) => {
  snapshot = items;
  try { localStorage.setItem(KEY, JSON.stringify(items)); } catch { /* storage unavailable */ }
  window.dispatchEvent(new Event('cartUpdated'));
  listeners.forEach((l) => l());
};

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => { if (e.key === KEY) { snapshot = read(); listeners.forEach((l) => l()); } });
}

// Drawer open state lives here so any "add to cart" can open it.
let drawerOpen = false;
const setDrawer = (v: boolean) => { drawerOpen = v; listeners.forEach((l) => l()); };

const subscribe = (l: () => void) => { listeners.add(l); return () => listeners.delete(l); };

export const cart = {
  items: () => snapshot,
  add(p: ShopProduct, quantity = 1, openDrawer = true) {
    if (!(p.price > 0)) return;
    const items = [...snapshot];
    const existing = items.find((i) => i.product_id === p.id);
    if (existing) existing.quantity += quantity;
    else items.push({
      product_id: p.id,
      name: p.title,
      product_name: p.title,
      price: p.price,
      quantity,
      image: p.images[0],
      product_image: p.images[0],
      product_mark: p.brand,
      product_description: [p.voltage && `${p.voltage}V`, p.amperage && `${p.amperage}A`, p.wattage && `${p.wattage}W`, p.connector].filter(Boolean).join(' · '),
      voltage: p.voltage,
      wattage: p.wattage,
      amperage: p.amperage,
      connection_type: p.connector,
      from_offer: Boolean(p.offerId),
      offer_id: p.offerId || null,
      slug: p.slug,
    });
    write(items.map((i) => ({ ...i })));
    track('add_to_cart', { id: p.id, name: p.title, price: p.price, quantity });
    if (openDrawer) setDrawer(true);
  },
  addRaw(item: CartItem) {
    const items = [...snapshot];
    const existing = items.find((i) => i.product_id === item.product_id && i.price === item.price);
    if (existing) existing.quantity += item.quantity; else items.push(item);
    write(items.map((i) => ({ ...i })));
  },
  setQty(productId: string, quantity: number) {
    if (quantity < 1) return;
    write(snapshot.map((i) => (i.product_id === productId ? { ...i, quantity: Math.min(quantity, 99) } : i)));
  },
  remove(productId: string) { write(snapshot.filter((i) => i.product_id !== productId)); },
  clear() { write([]); },
  openDrawer: () => setDrawer(true),
  closeDrawer: () => setDrawer(false),
};

export const useCart = () => {
  const items = useSyncExternalStore(subscribe, () => snapshot);
  const open = useSyncExternalStore(subscribe, () => drawerOpen);
  const count = items.reduce((s, i) => s + i.quantity, 0);
  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
  return { items, count, subtotal, drawerOpen: open };
};

// ---------- Recently viewed ----------
const RV_KEY = 'shop:recent';
export const recentlyViewed = {
  get(): string[] {
    try { return JSON.parse(localStorage.getItem(RV_KEY) || '[]'); } catch { return []; }
  },
  push(id: string) {
    try {
      const list = [id, ...recentlyViewed.get().filter((x) => x !== id)].slice(0, 12);
      localStorage.setItem(RV_KEY, JSON.stringify(list));
    } catch { /* ignore */ }
  },
};
