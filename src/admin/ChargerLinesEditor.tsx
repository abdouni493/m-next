import { useEffect, useState } from 'react';
import { Search, Trash2, Plus, Check, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { cn } from '@/lib/utils';
import { ChargerAvatar, formatDA } from '@/admin/ui';

export interface ChargerHit {
  id: string;
  name: string;
  primary_image?: string | null;
  purchase_price: number;
  selling_price: number;
  quantity_actual: number;
  quantity_initial: number;
  quantity_minimal: number;
  voltage?: number;
  wattage?: number;
  amperage?: number;
  mark?: { name: string } | null;
}

export interface ChargerLine {
  key: string;                // stable row key
  id?: string;                // quota_items.id when editing an existing quota
  product: ChargerHit;
  quantity: string;
  purchase_price: string;
  selling_price: string;
  sold?: number;              // already sold from this quota line (edit mode)
}

export const lineTotal = (l: ChargerLine) => (parseFloat(l.purchase_price) || 0) * (parseInt(l.quantity) || 0);

export const newLine = (p: ChargerHit): ChargerLine => ({
  key: `${p.id}-${Math.random().toString(36).slice(2, 8)}`,
  product: p,
  quantity: '1',
  purchase_price: String(p.purchase_price ?? 0),
  selling_price: String(p.selling_price ?? 0),
});

/** Charger search (with round images) + editable list of selected chargers. */
export function ChargerLinesEditor({ lines, onChange }: { lines: ChargerLine[]; onChange: (l: ChargerLine[]) => void }) {
  const [term, setTerm] = useState('');
  const [hits, setHits] = useState<ChargerHit[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const t = term.trim();
    if (!t) { setHits([]); return; }
    const h = setTimeout(async () => {
      setBusy(true);
      const safe = t.replace(/[%,()]/g, ' ');
      const { data } = await supabase
        .from('products')
        .select('id, name, primary_image, purchase_price, selling_price, quantity_actual, quantity_initial, quantity_minimal, voltage, wattage, amperage, mark:marks(name)')
        .eq('is_active', true)
        .or(`name.ilike.%${safe}%,description.ilike.%${safe}%,model_number.ilike.%${safe}%`)
        .limit(12);
      setHits((data as any) || []);
      setBusy(false);
    }, 220);
    return () => clearTimeout(h);
  }, [term]);

  const selectedIds = new Set(lines.map((l) => l.product.id));
  const toggle = (p: ChargerHit) => {
    if (selectedIds.has(p.id)) onChange(lines.filter((l) => l.product.id !== p.id || (l.sold || 0) > 0));
    else onChange([...lines, newLine(p)]);
  };
  const patch = (key: string, v: Partial<ChargerLine>) => onChange(lines.map((l) => (l.key === key ? { ...l, ...v } : l)));

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          placeholder="Rechercher un chargeur par nom, modèle ou description…"
          className="w-full rounded-xl border border-border bg-card py-2.5 pl-9 pr-9 text-sm"
        />
        {busy && <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />}
      </div>

      {term.trim() && (
        <div className="max-h-64 overflow-y-auto rounded-xl border border-border bg-card">
          {hits.length === 0 && !busy ? (
            <p className="p-4 text-center text-sm text-muted-foreground">Aucun chargeur trouvé</p>
          ) : (
            <ul className="divide-y divide-border">
              {hits.map((p) => {
                const on = selectedIds.has(p.id);
                return (
                  <li key={p.id}>
                    <button
                      type="button"
                      onClick={() => toggle(p)}
                      className={cn('flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-surface-2', on && 'bg-volt-soft')}
                    >
                      <ChargerAvatar src={p.primary_image} alt={p.name} size={40} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold">{p.name}</span>
                        <span className="block truncate text-xs text-muted-foreground">
                          {[p.mark?.name, p.wattage ? `${p.wattage}W` : null, `Stock ${p.quantity_actual ?? 0}`].filter(Boolean).join(' · ')}
                        </span>
                      </span>
                      <span className="text-xs font-semibold tabular-nums text-muted-foreground">{formatDA(p.purchase_price)}</span>
                      <span className={cn('flex h-7 w-7 items-center justify-center rounded-full border', on ? 'border-volt bg-volt text-volt-foreground' : 'border-border')}>
                        {on ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}

      {lines.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          Recherchez puis sélectionnez un ou plusieurs chargeurs.
        </div>
      ) : (
        <ul className="space-y-2">
          {lines.map((l) => {
            const sold = l.sold || 0;
            return (
              <li key={l.key} className="rounded-xl border border-border bg-card p-3">
                <div className="flex items-center gap-3">
                  <ChargerAvatar src={l.product.primary_image} alt={l.product.name} size={44} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{l.product.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Stock actuel {l.product.quantity_actual ?? 0}{sold > 0 ? ` · ${sold} déjà vendu(s) sur ce quota` : ''}
                    </p>
                  </div>
                  <span className="hidden text-sm font-bold tabular-nums sm:block">{formatDA(lineTotal(l))}</span>
                  <button
                    type="button"
                    disabled={sold > 0}
                    title={sold > 0 ? 'Des ventes existent déjà sur cette ligne' : 'Retirer'}
                    onClick={() => onChange(lines.filter((x) => x.key !== l.key))}
                    className="rounded-lg p-2 text-destructive hover:bg-destructive/10 disabled:opacity-30"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2">
                  <label className="text-xs">
                    <span className="mb-1 block text-muted-foreground">Quantité</span>
                    <input type="number" min={Math.max(1, sold)} value={l.quantity} onChange={(e) => patch(l.key, { quantity: e.target.value })} className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm tabular-nums" />
                  </label>
                  <label className="text-xs">
                    <span className="mb-1 block text-muted-foreground">Prix d'achat</span>
                    <input type="number" step="0.01" value={l.purchase_price} onChange={(e) => patch(l.key, { purchase_price: e.target.value })} className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm tabular-nums" />
                  </label>
                  <label className="text-xs">
                    <span className="mb-1 block text-muted-foreground">Prix de vente</span>
                    <input type="number" step="0.01" value={l.selling_price} onChange={(e) => patch(l.key, { selling_price: e.target.value })} className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm tabular-nums" />
                  </label>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
