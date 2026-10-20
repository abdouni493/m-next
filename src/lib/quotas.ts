import { supabase } from '@/lib/supabaseClient';

/** A quota line that still has stock to sell (see supabase_quotas.sql). */
export interface OpenQuotaLine {
  id: string;            // quota_items.id
  quota_id: string;
  quota_name: string;
  quota_date: string;
  product_id: string;
  quantity: number;
  sold_quantity: number;
  remaining: number;
  purchase_price: number;
  selling_price: number;
}

/** Open quota lines grouped by product, oldest quota first (FIFO default). */
export async function fetchOpenQuotaLines(productIds?: string[]): Promise<Record<string, OpenQuotaLine[]>> {
  let q = supabase
    .from('quota_items')
    .select('id, quota_id, product_id, quantity, sold_quantity, purchase_price, selling_price, quotas(name, quota_date)');
  if (productIds) {
    if (productIds.length === 0) return {};
    q = q.in('product_id', productIds);
  }
  const { data, error } = await q;
  if (error) {
    // Table missing (migration not run yet) → behave as "no quotas".
    console.warn('Quotas unavailable:', error.message);
    return {};
  }
  const out: Record<string, OpenQuotaLine[]> = {};
  for (const r of (data || []) as any[]) {
    const remaining = (r.quantity || 0) - (r.sold_quantity || 0);
    if (remaining <= 0) continue;
    (out[r.product_id] ||= []).push({
      id: r.id, quota_id: r.quota_id, quota_name: r.quotas?.name || 'Quota', quota_date: r.quotas?.quota_date || '',
      product_id: r.product_id, quantity: r.quantity, sold_quantity: r.sold_quantity, remaining,
      purchase_price: Number(r.purchase_price) || 0, selling_price: Number(r.selling_price) || 0,
    });
  }
  for (const k of Object.keys(out)) out[k].sort((a, b) => a.quota_date.localeCompare(b.quota_date));
  return out;
}

export async function recordQuotaSale(args: {
  quotaItemId: string; quantity: number; unitPrice: number; source: 'pos' | 'order'; invoiceRef?: string | null; orderRef?: string | null; clientName?: string | null;
}) {
  const { data, error } = await supabase.rpc('record_quota_sale', {
    p_quota_item_id: args.quotaItemId, p_quantity: args.quantity, p_unit_price: args.unitPrice, p_source: args.source,
    p_invoice_ref: args.invoiceRef ?? null, p_order_ref: args.orderRef ?? null, p_client_name: args.clientName ?? null,
  });
  if (error) throw error;
  return (data as number) || 0;
}

export const todayISO = () => new Date().toISOString().slice(0, 10);
