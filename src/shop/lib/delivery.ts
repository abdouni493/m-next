import { useEffect, useState } from 'react';
import { getVisibleDeliveryAgencies, getDeliveryPriceForWilaya } from '@/lib/supabaseClient';

export interface Agency { id: string; name: string; price_domicile: number; price_bureau: number }
export type DeliveryType = 'domicile' | 'bureau';

let agenciesPromise: Promise<Agency[]> | null = null;
export const loadAgencies = () => (agenciesPromise ??= getVisibleDeliveryAgencies().then((a: Agency[]) => a || []).catch(() => []));

const cache = new Map<string, number>();

/** Delivery fee for a wilaya, from the admin's agency + per-wilaya price tables. */
export async function deliveryPrice(agency: Agency | undefined, wilaya: string, type: DeliveryType): Promise<number | null> {
  if (!agency || !wilaya) return null;
  const key = `${agency.id}|${wilaya}|${type}`;
  if (cache.has(key)) return cache.get(key)!;
  let price: number;
  try {
    price = Number(await getDeliveryPriceForWilaya(agency.id, wilaya, type)) || 0;
  } catch {
    price = Number(type === 'bureau' ? agency.price_bureau : agency.price_domicile) || 0;
  }
  cache.set(key, price);
  return price;
}

export function useAgencies() {
  const [agencies, setAgencies] = useState<Agency[]>([]);
  useEffect(() => { loadAgencies().then(setAgencies); }, []);
  return agencies;
}

/** Both fees (domicile + stop-desk) for a wilaya — used on the product page. */
export function useWilayaFees(wilaya: string) {
  const agencies = useAgencies();
  const [fees, setFees] = useState<{ domicile: number | null; bureau: number | null }>({ domicile: null, bureau: null });
  useEffect(() => {
    let alive = true;
    const a = agencies[0];
    if (!a || !wilaya) { setFees({ domicile: null, bureau: null }); return; }
    Promise.all([deliveryPrice(a, wilaya, 'domicile'), deliveryPrice(a, wilaya, 'bureau')]).then(([d, b]) => alive && setFees({ domicile: d, bureau: b }));
    return () => { alive = false; };
  }, [agencies, wilaya]);
  return { ...fees, hasAgency: agencies.length > 0 };
}
