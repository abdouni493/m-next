import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';

export interface PendingOrder { id: string; customer_name: string; customer_phone: string; customer_wilaya?: string; total_price: number; created_at: string }
export interface LowStockProduct { id: string; name: string; quantity_on_hand: number; threshold: number }

/**
 * Low stock = stock at or below the product's own threshold (quantity_minimal / reorder_level).
 * Products without a threshold are never flagged, so untracked stock (0 everywhere) stays quiet.
 */
export const lowStockOf = (p: { quantity_on_hand?: number | null; quantity_minimal?: number | null; reorder_level?: number | null }) => {
  const threshold = Number(p.quantity_minimal) || Number(p.reorder_level) || 0;
  return threshold > 0 && Number(p.quantity_on_hand ?? 0) <= threshold ? threshold : 0;
};

/** Sidebar badges + notification bell. Refreshes every minute. */
export function useAdminAlerts() {
  return useQuery({
    queryKey: ['admin-alerts'],
    refetchInterval: 60_000,
    staleTime: 30_000,
    queryFn: async () => {
      const [orders, products] = await Promise.all([
        supabase.from('orders').select('id,customer_name,customer_phone,customer_wilaya,total_price,created_at').eq('status', 'pending').order('created_at', { ascending: false }).limit(20),
        supabase.from('products').select('id,name,quantity_on_hand,quantity_minimal,reorder_level').eq('is_active', true),
      ]);
      const lowStock: LowStockProduct[] = (products.data || [])
        .map((p) => ({ p, t: lowStockOf(p) }))
        .filter((x) => x.t > 0)
        .map(({ p, t }) => ({ id: p.id, name: p.name, quantity_on_hand: Number(p.quantity_on_hand) || 0, threshold: t }));
      return { pendingOrders: (orders.data || []) as PendingOrder[], lowStock };
    },
  });
}
