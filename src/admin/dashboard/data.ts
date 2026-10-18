import { useQuery } from '@tanstack/react-query';
import {
  addDays, differenceInCalendarDays, endOfDay, endOfMonth, format, startOfDay, startOfMonth, startOfWeek, subDays, subMonths,
} from 'date-fns';
import { fr } from 'date-fns/locale';
import { supabase } from '@/lib/supabaseClient';
import { lowStockOf } from '@/admin/alerts';

/* ---------------- Date ranges ---------------- */
export type RangeKey = 'today' | '7d' | '30d' | 'month' | 'lastMonth' | 'custom';
export interface Range { key: RangeKey; from: Date; to: Date }

export const RANGE_LABELS: Record<RangeKey, string> = {
  today: "Aujourd'hui", '7d': '7 jours', '30d': '30 jours', month: 'Ce mois', lastMonth: 'Mois dernier', custom: 'Personnalisé',
};

export function makeRange(key: RangeKey, custom?: { from: Date; to: Date }): Range {
  const now = new Date();
  switch (key) {
    case 'today': return { key, from: startOfDay(now), to: endOfDay(now) };
    case '7d': return { key, from: startOfDay(subDays(now, 6)), to: endOfDay(now) };
    case '30d': return { key, from: startOfDay(subDays(now, 29)), to: endOfDay(now) };
    case 'month': return { key, from: startOfMonth(now), to: endOfDay(now) };
    case 'lastMonth': { const m = subMonths(now, 1); return { key, from: startOfMonth(m), to: endOfMonth(m) }; }
    default: return { key, from: startOfDay(custom?.from || subDays(now, 29)), to: endOfDay(custom?.to || now) };
  }
}
const previousOf = (r: Range) => {
  const days = differenceInCalendarDays(r.to, r.from) + 1;
  return { from: startOfDay(subDays(r.from, days)), to: endOfDay(subDays(r.from, 1)) };
};

/* ---------------- Types ---------------- */
interface ProductRow {
  id: string; name: string; primary_image?: string | null; selling_price?: number | null; purchase_price?: number | null; cost_price?: number | null;
  quantity_on_hand?: number | null; quantity_minimal?: number | null; reorder_level?: number | null; wattage?: number | null;
  marks?: { name?: string } | null; created_at?: string;
}
interface OrderRow {
  id: string; status: string; total_price: number; delivery_price?: number | null; created_at: string; customer_name: string;
  customer_phone: string; customer_wilaya?: string | null; customer_address?: string | null; delivery_type?: string | null;
  order_items?: { product_id: string | null; product_name?: string; quantity: number; line_total?: number; price_per_unit?: number }[];
}
interface InvoiceRow {
  id: string; total_amount: number; invoice_date?: string; created_at: string; client_name?: string;
  invoice_items?: { product_id: string | null; product_name?: string; quantity: number; total_price?: number; unit_price?: number }[];
}
export interface SaleLine { date: Date; productId: string | null; name: string; qty: number; revenue: number; cost: number; channel: 'web' | 'pos' }

const CANCELLED = new Set(['cancelled', 'returned']);
const CONFIRMED = new Set(['confirmed', 'on_delivery', 'delivered']);
const n = (v: unknown) => Number(v) || 0;

export const brandOf = (p?: ProductRow) => {
  const raw = p?.marks?.name || '';
  if (raw) return raw.toUpperCase() === 'HP' ? 'HP' : raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase();
  const m = p?.name?.match(/\b(HP|Dell|Lenovo|Apple|Asus|ROG|Acer|Surface|Toshiba|MSI|Samsung)\b/i);
  return m ? (m[1].toUpperCase() === 'HP' || m[1].toUpperCase() === 'ROG' || m[1].toUpperCase() === 'MSI' ? m[1].toUpperCase() : m[1][0].toUpperCase() + m[1].slice(1).toLowerCase()) : 'Autre';
};
export const powerBucket = (w?: number | null) => {
  const v = n(w);
  if (!v) return 'Inconnue';
  if (v <= 45) return '≤ 45W';
  if (v <= 65) return '65W';
  if (v <= 90) return '90W';
  if (v <= 150) return '120–150W';
  return '200W+';
};
const POWER_ORDER = ['≤ 45W', '65W', '90W', '120–150W', '200W+', 'Inconnue'];

/* ---------------- Fetch ---------------- */
async function fetchAll(r: Range) {
  const prev = previousOf(r);
  const from = prev.from.toISOString();
  const to = r.to.toISOString();
  const since30 = startOfDay(subDays(new Date(), 29)).toISOString();
  const earliest = from < since30 ? from : since30;

  const [products, orders, invoices, reviews] = await Promise.all([
    supabase.from('products').select('id,name,primary_image,selling_price,purchase_price,cost_price,quantity_on_hand,quantity_minimal,reorder_level,wattage,created_at,marks(name)').eq('is_active', true),
    supabase.from('orders').select('id,status,total_price,delivery_price,created_at,customer_name,customer_phone,customer_wilaya,customer_address,delivery_type,order_items(product_id,product_name,quantity,line_total,price_per_unit)')
      .gte('created_at', earliest).lte('created_at', to).order('created_at', { ascending: false }),
    supabase.from('invoices').select('id,total_amount,invoice_date,created_at,client_name,invoice_items(product_id,product_name,quantity,total_price,unit_price)')
      .eq('type', 'sale').gte('created_at', earliest).lte('created_at', to).order('created_at', { ascending: false }),
    supabase.from('client_testimonials').select('id,client_name,rating,created_at,is_approved').order('created_at', { ascending: false }).limit(5),
  ]);
  if (products.error) throw products.error;
  return {
    products: (products.data || []) as unknown as ProductRow[],
    orders: (orders.data || []) as OrderRow[],
    invoices: (invoices.data || []) as InvoiceRow[],
    reviews: (reviews.data || []) as { id: string; client_name: string; rating?: number; created_at: string }[],
    prev,
  };
}

/* ---------------- Aggregate ---------------- */
function aggregate(raw: Awaited<ReturnType<typeof fetchAll>>, r: Range) {
  const { products, orders, invoices, reviews, prev } = raw;
  const productById = new Map(products.map((p) => [p.id, p]));
  const unitCost = (id: string | null) => { const p = id ? productById.get(id) : undefined; return n(p?.purchase_price) || n(p?.cost_price); };
  const hasCostData = products.some((p) => n(p.purchase_price) || n(p.cost_price));

  const lines: SaleLine[] = [];
  for (const o of orders) {
    if (CANCELLED.has(o.status)) continue;
    const date = new Date(o.created_at);
    const items = o.order_items || [];
    if (items.length) items.forEach((i) => lines.push({ date, productId: i.product_id, name: i.product_name || '—', qty: n(i.quantity), revenue: n(i.line_total) || n(i.price_per_unit) * n(i.quantity), cost: unitCost(i.product_id) * n(i.quantity), channel: 'web' }));
    else lines.push({ date, productId: null, name: 'Commande', qty: 0, revenue: n(o.total_price) - n(o.delivery_price), cost: 0, channel: 'web' });
  }
  for (const inv of invoices) {
    const date = new Date(inv.invoice_date || inv.created_at);
    const items = inv.invoice_items || [];
    if (items.length) items.forEach((i) => lines.push({ date, productId: i.product_id, name: i.product_name || '—', qty: n(i.quantity), revenue: n(i.total_price) || n(i.unit_price) * n(i.quantity), cost: unitCost(i.product_id) * n(i.quantity), channel: 'pos' }));
    else lines.push({ date, productId: null, name: 'Vente', qty: 0, revenue: n(inv.total_amount), cost: 0, channel: 'pos' });
  }

  const inR = (d: Date) => d >= r.from && d <= r.to;
  const inP = (d: Date) => d >= prev.from && d <= prev.to;
  const cur = lines.filter((l) => inR(l.date));
  const pre = lines.filter((l) => inP(l.date));
  const curOrders = orders.filter((o) => inR(new Date(o.created_at)));
  const preOrders = orders.filter((o) => inP(new Date(o.created_at)));
  const curInv = invoices.filter((i) => inR(new Date(i.invoice_date || i.created_at)));
  const preInv = invoices.filter((i) => inP(new Date(i.invoice_date || i.created_at)));

  const sum = (ls: SaleLine[], k: 'revenue' | 'cost' | 'qty') => ls.reduce((s, l) => s + l[k], 0);
  const kpis = (ls: SaleLine[], os: OrderRow[], is: InvoiceRow[]) => {
    const revenue = sum(ls, 'revenue');
    const cost = sum(ls, 'cost');
    const valid = os.filter((o) => !CANCELLED.has(o.status)).length + is.length;
    return {
      revenue,
      profit: revenue - cost,
      margin: revenue > 0 ? ((revenue - cost) / revenue) * 100 : 0,
      orders: os.length + is.length,
      webOrders: os.length,
      posSales: is.length,
      aov: valid > 0 ? revenue / valid : 0,
      units: sum(ls, 'qty'),
      confirmRate: os.length ? (os.filter((o) => CONFIRMED.has(o.status)).length / os.length) * 100 : null,
      cancelRate: os.length ? (os.filter((o) => CANCELLED.has(o.status)).length / os.length) * 100 : null,
    };
  };
  const now = kpis(cur, curOrders, curInv);
  const before = kpis(pre, preOrders, preInv);
  const delta = (a: number | null, b: number | null) => (a === null || b === null ? null : b === 0 ? (a === 0 ? 0 : null) : ((a - b) / Math.abs(b)) * 100);

  // Time series
  const days = differenceInCalendarDays(r.to, r.from) + 1;
  const gran: 'day' | 'week' | 'month' = days <= 31 ? 'day' : days <= 120 ? 'week' : 'month';
  const keyOf = (d: Date) => gran === 'day' ? format(d, 'yyyy-MM-dd') : gran === 'week' ? format(startOfWeek(d, { weekStartsOn: 6 }), 'yyyy-MM-dd') : format(d, 'yyyy-MM');
  const buckets = new Map<string, { label: string; revenue: number; profit: number; orders: number }>();
  for (let d = new Date(r.from); d <= r.to; d = addDays(d, 1)) {
    const k = keyOf(d);
    if (!buckets.has(k)) buckets.set(k, { label: gran === 'month' ? format(d, 'MMM yy', { locale: fr }) : format(gran === 'week' ? startOfWeek(d, { weekStartsOn: 6 }) : d, 'd MMM', { locale: fr }), revenue: 0, profit: 0, orders: 0 });
  }
  cur.forEach((l) => { const b = buckets.get(keyOf(l.date)); if (b) { b.revenue += l.revenue; b.profit += l.revenue - l.cost; } });
  curOrders.forEach((o) => { const b = buckets.get(keyOf(new Date(o.created_at))); if (b) b.orders += 1; });
  curInv.forEach((i) => { const b = buckets.get(keyOf(new Date(i.invoice_date || i.created_at))); if (b) b.orders += 1; });
  const series = [...buckets.values()];

  // Status funnel (web orders)
  const statusCount = (s: string) => curOrders.filter((o) => o.status === s).length;
  const funnel = [
    { key: 'pending', label: 'Nouvelles', value: curOrders.length },
    { key: 'confirmed', label: 'Confirmées', value: curOrders.filter((o) => CONFIRMED.has(o.status)).length },
    { key: 'on_delivery', label: 'Expédiées', value: curOrders.filter((o) => o.status === 'on_delivery' || o.status === 'delivered').length },
    { key: 'delivered', label: 'Livrées', value: statusCount('delivered') },
  ];
  const lost = [{ key: 'cancelled', label: 'Annulées', value: statusCount('cancelled') }, { key: 'returned', label: 'Retournées', value: statusCount('returned') }];

  // Products
  const byProduct = new Map<string, { id: string; name: string; image?: string | null; units: number; revenue: number; stock: number }>();
  cur.forEach((l) => {
    const key = l.productId || l.name;
    const p = l.productId ? productById.get(l.productId) : undefined;
    const e = byProduct.get(key) || { id: key, name: p?.name || l.name, image: p?.primary_image, units: 0, revenue: 0, stock: n(p?.quantity_on_hand) };
    e.units += l.qty; e.revenue += l.revenue; byProduct.set(key, e);
  });
  const topProducts = [...byProduct.values()];

  const group = (label: (l: SaleLine) => string, order?: string[]) => {
    const m = new Map<string, { name: string; revenue: number; units: number }>();
    cur.forEach((l) => { const k = label(l); const e = m.get(k) || { name: k, revenue: 0, units: 0 }; e.revenue += l.revenue; e.units += l.qty; m.set(k, e); });
    const arr = [...m.values()];
    return order ? arr.sort((a, b) => order.indexOf(a.name) - order.indexOf(b.name)) : arr.sort((a, b) => b.revenue - a.revenue);
  };
  const byBrand = group((l) => brandOf(l.productId ? productById.get(l.productId) : undefined));
  const byPower = group((l) => powerBucket(l.productId ? productById.get(l.productId)?.wattage : undefined), POWER_ORDER);

  // Wilayas
  const wil = new Map<string, { name: string; orders: number; revenue: number; lost: number }>();
  curOrders.forEach((o) => {
    const k = (o.customer_wilaya || 'Non renseignée').trim();
    const e = wil.get(k) || { name: k, orders: 0, revenue: 0, lost: 0 };
    e.orders += 1;
    if (CANCELLED.has(o.status)) e.lost += 1; else e.revenue += n(o.total_price) - n(o.delivery_price);
    wil.set(k, e);
  });
  const byWilaya = [...wil.values()].sort((a, b) => b.orders - a.orders).slice(0, 15);
  const delivery = [
    { name: 'À domicile', value: curOrders.filter((o) => (o.delivery_type || 'domicile') === 'domicile').length },
    { name: 'Stop-desk', value: curOrders.filter((o) => o.delivery_type === 'bureau').length },
  ];

  // Stock
  const since30 = startOfDay(subDays(new Date(), 29));
  const units30 = new Map<string, number>();
  lines.filter((l) => l.date >= since30 && l.productId).forEach((l) => units30.set(l.productId!, (units30.get(l.productId!) || 0) + l.qty));
  const stockValue = products.reduce((s, p) => s + Math.max(0, n(p.quantity_on_hand)) * (n(p.purchase_price) || n(p.cost_price)), 0);
  const stockAlerts = products
    .map((p) => ({ p, t: lowStockOf(p) }))
    .filter((x) => x.t > 0)
    .map(({ p, t }) => {
      const daily = (units30.get(p.id) || 0) / 30;
      return { id: p.id, name: p.name, image: p.primary_image, stock: n(p.quantity_on_hand), threshold: t, daysLeft: daily > 0 ? Math.floor(n(p.quantity_on_hand) / daily) : null };
    })
    .sort((a, b) => a.stock - b.stock);
  const deadStock = products
    .filter((p) => !units30.get(p.id) && (!p.created_at || new Date(p.created_at) < since30))
    .map((p) => ({ id: p.id, name: p.name, image: p.primary_image, stock: n(p.quantity_on_hand), price: n(p.selling_price) }));

  // Activity feed
  const activity = [
    ...orders.slice(0, 8).map((o) => ({ id: 'o' + o.id, at: o.created_at, kind: 'order' as const, text: `Commande de ${o.customer_name}`, sub: o.customer_wilaya || '', amount: n(o.total_price), status: o.status })),
    ...invoices.slice(0, 8).map((i) => ({ id: 'i' + i.id, at: i.invoice_date || i.created_at, kind: 'sale' as const, text: `Vente caisse · ${i.client_name || 'Client de passage'}`, sub: '', amount: n(i.total_amount), status: '' })),
    ...reviews.map((v) => ({ id: 'r' + v.id, at: v.created_at, kind: 'review' as const, text: `Avis de ${v.client_name}`, sub: `${v.rating || 5}/5`, amount: 0, status: '' })),
  ].sort((a, b) => b.at.localeCompare(a.at)).slice(0, 10);

  const sparkOf = (k: 'revenue' | 'profit' | 'orders') => series.map((s) => s[k]);

  return {
    kpi: now,
    deltas: {
      revenue: delta(now.revenue, before.revenue), profit: delta(now.profit, before.profit), orders: delta(now.orders, before.orders),
      aov: delta(now.aov, before.aov), units: delta(now.units, before.units), confirmRate: delta(now.confirmRate, before.confirmRate), cancelRate: delta(now.cancelRate, before.cancelRate),
    },
    spark: { revenue: sparkOf('revenue'), profit: sparkOf('profit'), orders: sparkOf('orders') },
    series, gran, funnel, lost, topProducts, byBrand, byPower, byWilaya, delivery,
    stock: { value: stockValue, lowCount: stockAlerts.length, alerts: stockAlerts, dead: deadStock },
    pendingOrders: orders.filter((o) => o.status === 'pending').slice(0, 8),
    activity,
    hasCostData,
    hasOrders: orders.length > 0 || invoices.length > 0,
  };
}

export type DashboardData = ReturnType<typeof aggregate>;

export function useDashboard(range: Range) {
  return useQuery({
    queryKey: ['dashboard', range.from.toISOString(), range.to.toISOString()],
    queryFn: async () => aggregate(await fetchAll(range), range),
    staleTime: 60_000,
  });
}

/** CSV of the daily series for the "Exporter" action. */
export function exportSeriesCsv(d: DashboardData, r: Range) {
  const rows = [['Période', "Chiffre d'affaires (DA)", 'Bénéfice brut (DA)', 'Commandes'], ...d.series.map((s) => [s.label, Math.round(s.revenue), Math.round(s.profit), s.orders])];
  const csv = '﻿' + rows.map((r) => r.join(';')).join('\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  a.download = `tableau-de-bord-${format(r.from, 'yyyy-MM-dd')}_${format(r.to, 'yyyy-MM-dd')}.csv`;
  a.click();
  URL.revokeObjectURL(a.href);
}
