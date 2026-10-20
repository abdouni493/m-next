import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Layers, CalendarDays, Pencil, Trash2, Eye, ArrowLeft, Truck, TrendingUp, Package, X, Store, Globe2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { supabase } from '@/lib/supabaseClient';
import { cn } from '@/lib/utils';
import { PageHero, Panel, EmptyState, ConfirmDialog, FilterBar, SkeletonRows, ChargerAvatar, formatDA } from '@/admin/ui';
import { ChargerLinesEditor, lineTotal, type ChargerLine } from '@/admin/ChargerLinesEditor';

interface QuotaSummary {
  id: string; name: string; description?: string | null; quota_date: string; supplier_id?: string | null; invoice_id?: string | null; amount_paid: number;
  created_at: string; total_quantity: number; sold_quantity: number; remaining_quantity: number; total_cost: number; total_gain: number; total_sales: number; items_count: number;
}
interface QuotaItemRow {
  id: string; product_id: string; quantity: number; sold_quantity: number; purchase_price: number; selling_price: number;
  products: { id: string; name: string; primary_image?: string | null; purchase_price: number; selling_price: number; quantity_actual: number; quantity_initial: number; quantity_minimal: number } | null;
}
interface QuotaSaleRow {
  id: string; quota_item_id: string; quantity: number; unit_price: number; purchase_price: number; total: number; gain: number;
  source: string; invoice_ref?: string | null; order_ref?: string | null; client_name?: string | null; created_at: string;
}

const fmtDate = (d?: string | null) => (d ? format(new Date(d), 'dd/MM/yyyy') : '—');
const pct = (a: number, b: number) => (b > 0 ? Math.round((a / b) * 100) : 0);

const Progress = ({ sold, total }: { sold: number; total: number }) => (
  <div className="h-2 w-full overflow-hidden rounded-full bg-surface-2">
    <div className="h-full rounded-full bg-volt transition-all" style={{ width: `${pct(sold, total)}%` }} />
  </div>
);

const useSuppliers = () =>
  useQuery({
    queryKey: ['suppliers-min'],
    queryFn: async () => (await supabase.from('suppliers').select('id, name').order('name')).data || [],
  });

/* =========================== List =========================== */
export default function Quotas() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const { data: suppliers = [] } = useSuppliers();
  const supplierName = useMemo(() => Object.fromEntries(suppliers.map((s: any) => [s.id, s.name])), [suppliers]);

  const { data: quotas = [], isLoading, error } = useQuery({
    queryKey: ['quotas'],
    queryFn: async () => {
      const { data, error } = await supabase.from('quota_summary').select('*').order('quota_date', { ascending: false });
      if (error) throw error;
      return data as QuotaSummary[];
    },
  });

  const filtered = quotas.filter((q) => !search.trim() || [q.name, q.description].some((v) => String(v || '').toLowerCase().includes(search.toLowerCase())));
  const totals = quotas.reduce((a, q) => ({ qty: a.qty + Number(q.total_quantity), rem: a.rem + Number(q.remaining_quantity), gain: a.gain + Number(q.total_gain) }), { qty: 0, rem: 0, gain: 0 });

  const doDelete = async (id: string) => {
    const { error } = await supabase.from('quotas').delete().eq('id', id);
    if (error) return toast.error('La suppression a échoué.');
    toast.success('Quota supprimé');
    qc.invalidateQueries({ queryKey: ['quotas'] });
  };

  return (
    <div>
      <PageHero
        eyebrow="Stock"
        icon={Layers}
        title="Quotas"
        description="Suivez chaque lot d'achat : quantité restante et gains réalisés par chargeur."
        actions={<Button asChild className="bg-primary"><Link to="/purchase-invoices"><Plus className="h-4 w-4" />Nouveau quota</Link></Button>}
        stats={[
          { label: 'Quotas', value: quotas.length },
          { label: 'Quantité totale', value: totals.qty },
          { label: 'Restant', value: totals.rem },
          { label: 'Gains', value: formatDA(totals.gain) },
        ]}
      />

      <FilterBar search={search} onSearch={setSearch} placeholder="Rechercher un quota…" />

      {isLoading ? (
        <SkeletonRows rows={4} />
      ) : error ? (
        <Panel><EmptyState icon={Layers} title="Quotas indisponibles" text="Exécutez le script supabase_quotas.sql dans Supabase puis rechargez la page." /></Panel>
      ) : filtered.length === 0 ? (
        <Panel><EmptyState icon={Layers} title="Aucun quota" text="Créez un achat en activant l'option « Achat en quota »." action={<Button asChild><Link to="/purchase-invoices">Créer un achat</Link></Button>} /></Panel>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((q, i) => (
            <motion.article
              key={q.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i, 8) * 0.04 }}
              className="flex flex-col rounded-2xl border border-border bg-card p-5 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-volt text-volt-foreground"><Layers className="h-5 w-5" /></span>
                  <div className="min-w-0">
                    <h3 className="truncate text-base font-semibold" style={{ fontFamily: 'Inter, sans-serif' }}>{q.name}</h3>
                    <p className="flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" />{fmtDate(q.quota_date)}</span>
                      {q.supplier_id && supplierName[q.supplier_id] && <span className="inline-flex items-center gap-1"><Truck className="h-3.5 w-3.5" />{supplierName[q.supplier_id]}</span>}
                    </p>
                  </div>
                </div>
                {Number(q.remaining_quantity) === 0 && Number(q.total_quantity) > 0 && <span className="rounded-full bg-success/15 px-2 py-0.5 text-[11px] font-semibold text-success">Écoulé</span>}
              </div>

              <p className="mt-3 line-clamp-2 min-h-[2.5rem] text-sm text-muted-foreground">{q.description || 'Aucune description'}</p>

              <div className="mt-4 grid grid-cols-3 gap-2">
                <div className="rounded-xl bg-surface-2 p-2.5"><p className="text-[11px] text-muted-foreground">Total</p><p className="font-sora text-lg font-bold tabular-nums">{q.total_quantity}</p></div>
                <div className="rounded-xl bg-surface-2 p-2.5"><p className="text-[11px] text-muted-foreground">Restant</p><p className="font-sora text-lg font-bold tabular-nums">{q.remaining_quantity}</p></div>
                <div className="rounded-xl bg-volt-soft p-2.5"><p className="text-[11px] text-muted-foreground">Gains</p><p className="truncate font-sora text-sm font-bold tabular-nums leading-7 text-success">{formatDA(q.total_gain)}</p></div>
              </div>
              <div className="mt-3">
                <Progress sold={Number(q.sold_quantity)} total={Number(q.total_quantity)} />
                <p className="mt-1 text-[11px] text-muted-foreground tabular-nums">{pct(Number(q.sold_quantity), Number(q.total_quantity))}% vendu · {q.items_count} chargeur(s)</p>
              </div>

              <div className="mt-4 flex gap-2 border-t border-border pt-4">
                <Button size="sm" className="flex-1" onClick={() => navigate(`/quotas/${q.id}`)}><Eye className="h-4 w-4" />Détails</Button>
                <Button size="sm" variant="outline" onClick={() => setEditId(q.id)} aria-label="Modifier"><Pencil className="h-4 w-4" /></Button>
                <Button size="sm" variant="outline" className="text-destructive" onClick={() => setDeleteId(q.id)} aria-label="Supprimer"><Trash2 className="h-4 w-4" /></Button>
              </div>
            </motion.article>
          ))}
        </div>
      )}

      <QuotaEditModal id={editId} onClose={() => setEditId(null)} onSaved={() => qc.invalidateQueries({ queryKey: ['quotas'] })} />
      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
        title="Supprimer ce quota ?"
        description="Le suivi du quota et son historique de ventes seront supprimés. Le stock des chargeurs et la facture d'achat ne sont pas modifiés."
        confirmLabel="Supprimer"
        destructive
        onConfirm={() => { if (deleteId) doDelete(deleteId); setDeleteId(null); }}
      />
    </div>
  );
}

/* =========================== Details =========================== */
export function QuotaDetail() {
  const { id } = useParams();
  const qc = useQueryClient();
  const [salesFor, setSalesFor] = useState<QuotaItemRow | null>(null);
  const [editing, setEditing] = useState(false);
  const { data: suppliers = [] } = useSuppliers();

  const { data, isLoading } = useQuery({
    queryKey: ['quota', id],
    enabled: !!id,
    queryFn: async () => {
      const [{ data: q, error }, { data: items }, { data: sales }] = await Promise.all([
        supabase.from('quota_summary').select('*').eq('id', id!).single(),
        supabase.from('quota_items').select('*, products(id, name, primary_image, purchase_price, selling_price, quantity_actual, quantity_initial, quantity_minimal)').eq('quota_id', id!).order('created_at'),
        supabase.from('quota_sales').select('*').eq('quota_id', id!).order('created_at', { ascending: false }),
      ]);
      if (error) throw error;
      return { q: q as QuotaSummary, items: (items || []) as QuotaItemRow[], sales: (sales || []) as QuotaSaleRow[] };
    },
  });

  const byItem = useMemo(() => {
    const m: Record<string, { total: number; gain: number; count: number }> = {};
    for (const s of data?.sales || []) {
      const r = (m[s.quota_item_id] ||= { total: 0, gain: 0, count: 0 });
      r.total += Number(s.total) || 0; r.gain += Number(s.gain) || 0; r.count += 1;
    }
    return m;
  }, [data]);

  if (isLoading || !data) return <SkeletonRows rows={6} />;
  const { q, items, sales } = data;
  const supplier = suppliers.find((s: any) => s.id === q.supplier_id) as any;
  const posCount = sales.filter((s) => s.source === 'pos').reduce((a, s) => a + s.quantity, 0);
  const webCount = sales.filter((s) => s.source === 'order').reduce((a, s) => a + s.quantity, 0);
  const expectedGain = items.reduce((a, i) => a + i.quantity * (Number(i.selling_price) - Number(i.purchase_price)), 0);

  return (
    <div>
      <Link to="/quotas" className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" />Tous les quotas</Link>
      <PageHero
        eyebrow={`Quota · ${fmtDate(q.quota_date)}`}
        icon={Layers}
        title={q.name}
        description={q.description || undefined}
        actions={<Button variant="outline" onClick={() => setEditing(true)}><Pencil className="h-4 w-4" />Modifier</Button>}
        stats={[
          { label: 'Quantité totale', value: q.total_quantity },
          { label: 'Restant', value: q.remaining_quantity },
          { label: 'Chiffre de ventes', value: formatDA(q.total_sales) },
          { label: 'Gains réalisés', value: formatDA(q.total_gain) },
        ]}
      />

      <div className="mb-6 grid gap-4 md:grid-cols-4">
        <InfoTile icon={Truck} label="Fournisseur" value={supplier?.name || '—'} />
        <InfoTile icon={Package} label="Coût d'achat" value={formatDA(q.total_cost)} hint={`Payé ${formatDA(q.amount_paid)}`} />
        <InfoTile icon={TrendingUp} label="Gain prévu (tout vendu)" value={formatDA(expectedGain)} />
        <InfoTile icon={Store} label="Ventes" value={`${posCount} POS · ${webCount} web`} hint={`${pct(Number(q.sold_quantity), Number(q.total_quantity))}% du quota vendu`} />
      </div>

      <Panel title="Chargeurs du quota" description={`${items.length} chargeur(s)`} bodyClassName="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left">
                <th className="px-5 py-3">Chargeur</th>
                <th className="px-3 py-3 text-right">Total</th>
                <th className="px-3 py-3 text-right">Vendu</th>
                <th className="px-3 py-3 text-right">Restant</th>
                <th className="px-3 py-3 text-right">Achat / Vente</th>
                <th className="px-3 py-3 text-right">Ventes</th>
                <th className="px-3 py-3 text-right">Gains</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {items.map((it) => {
                const agg = byItem[it.id] || { total: 0, gain: 0, count: 0 };
                const remaining = it.quantity - it.sold_quantity;
                return (
                  <tr key={it.id}>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <ChargerAvatar src={it.products?.primary_image} alt={it.products?.name} size={40} />
                        <div className="min-w-[140px]">
                          <p className="font-semibold">{it.products?.name || 'Produit supprimé'}</p>
                          <div className="mt-1 w-32"><Progress sold={it.sold_quantity} total={it.quantity} /></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-right tabular-nums">{it.quantity}</td>
                    <td className="px-3 py-3 text-right tabular-nums">{it.sold_quantity}</td>
                    <td className="px-3 py-3 text-right tabular-nums"><span className={cn('rounded-full px-2 py-0.5 text-xs font-semibold', remaining > 0 ? 'bg-electric/10 text-electric' : 'bg-success/15 text-success')}>{remaining}</span></td>
                    <td className="px-3 py-3 text-right text-xs tabular-nums text-muted-foreground">{formatDA(it.purchase_price)}<br />{formatDA(it.selling_price)}</td>
                    <td className="px-3 py-3 text-right tabular-nums">{formatDA(agg.total)}</td>
                    <td className="px-3 py-3 text-right font-semibold tabular-nums text-success">{formatDA(agg.gain)}</td>
                    <td className="px-5 py-3 text-right"><Button size="sm" variant="outline" onClick={() => setSalesFor(it)}><Eye className="h-4 w-4" />Ventes ({agg.count})</Button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Panel>

      <Panel className="mt-6" title="Historique des ventes" description={`${sales.length} vente(s) sur ce quota`}>
        <SalesList sales={sales} names={Object.fromEntries(items.map((i) => [i.id, i.products?.name || '']))} />
      </Panel>

      <Sheet open={!!salesFor} onOpenChange={(o) => !o && setSalesFor(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
          {salesFor && (
            <>
              <SheetHeader>
                <div className="flex items-center gap-3">
                  <ChargerAvatar src={salesFor.products?.primary_image} size={48} />
                  <div>
                    <SheetTitle>{salesFor.products?.name}</SheetTitle>
                    <SheetDescription>Ventes dans « {q.name} »</SheetDescription>
                  </div>
                </div>
              </SheetHeader>
              <div className="my-4 grid grid-cols-3 gap-2">
                <div className="rounded-xl bg-surface-2 p-3"><p className="text-[11px] text-muted-foreground">Total</p><p className="font-sora font-bold">{salesFor.quantity}</p></div>
                <div className="rounded-xl bg-surface-2 p-3"><p className="text-[11px] text-muted-foreground">Vendu</p><p className="font-sora font-bold">{salesFor.sold_quantity}</p></div>
                <div className="rounded-xl bg-surface-2 p-3"><p className="text-[11px] text-muted-foreground">Restant</p><p className="font-sora font-bold">{salesFor.quantity - salesFor.sold_quantity}</p></div>
                <div className="col-span-3 rounded-xl bg-volt-soft p-3"><p className="text-[11px] text-muted-foreground">Gains</p><p className="font-sora text-lg font-bold text-success">{formatDA(byItem[salesFor.id]?.gain)}</p></div>
              </div>
              <SalesList sales={sales.filter((s) => s.quota_item_id === salesFor.id)} />
            </>
          )}
        </SheetContent>
      </Sheet>

      <QuotaEditModal id={editing ? q.id : null} onClose={() => setEditing(false)} onSaved={() => { qc.invalidateQueries({ queryKey: ['quota', id] }); qc.invalidateQueries({ queryKey: ['quotas'] }); }} />
    </div>
  );
}

const InfoTile = ({ icon: Icon, label, value, hint }: { icon: React.ElementType; label: string; value: React.ReactNode; hint?: string }) => (
  <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
    <div className="flex items-center gap-2 text-[13px] font-medium text-muted-foreground"><span className="flex h-7 w-7 items-center justify-center rounded-lg bg-surface-2"><Icon className="h-4 w-4" /></span>{label}</div>
    <p className="mt-2 truncate font-sora text-lg font-bold tabular-nums">{value}</p>
    {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
  </div>
);

function SalesList({ sales, names }: { sales: QuotaSaleRow[]; names?: Record<string, string> }) {
  if (sales.length === 0) return <EmptyState compact icon={TrendingUp} title="Aucune vente" text="Les ventes POS et les commandes livrées liées à ce quota apparaîtront ici." />;
  return (
    <ul className="divide-y divide-border rounded-xl border border-border">
      {sales.map((s) => (
        <li key={s.id} className="flex items-center gap-3 p-3">
          <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg', s.source === 'order' ? 'bg-electric/10 text-electric' : 'bg-volt-soft')}>
            {s.source === 'order' ? <Globe2 className="h-4 w-4" /> : <Store className="h-4 w-4" />}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{names ? `${names[s.quota_item_id] || ''} · ` : ''}{s.client_name || 'Client de passage'}</p>
            <p className="text-xs text-muted-foreground">
              {format(new Date(s.created_at), 'dd/MM/yyyy HH:mm')} · {s.source === 'order' ? `Commande #${(s.order_ref || '').slice(0, 8).toUpperCase()}` : 'Point de vente'} · {s.quantity} × {formatDA(s.unit_price)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold tabular-nums">{formatDA(s.total)}</p>
            <p className={cn('text-xs tabular-nums', Number(s.gain) >= 0 ? 'text-success' : 'text-destructive')}>{Number(s.gain) >= 0 ? '+' : ''}{formatDA(s.gain)}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}

/* =========================== Edit =========================== */
function QuotaEditModal({ id, onClose, onSaved }: { id: string | null; onClose: () => void; onSaved: () => void }) {
  const { data: suppliers = [] } = useSuppliers();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', date: '', supplier_id: '', amount_paid: '0', invoice_id: '' as string | null });
  const [lines, setLines] = useState<ChargerLine[]>([]);
  const [original, setOriginal] = useState<Record<string, { quantity: number; product_id: string }>>({});

  useEffect(() => {
    if (!id) return;
    (async () => {
      setLoading(true);
      const [{ data: q }, { data: items }] = await Promise.all([
        supabase.from('quotas').select('*').eq('id', id).single(),
        supabase.from('quota_items').select('*, products(id, name, primary_image, purchase_price, selling_price, quantity_actual, quantity_initial, quantity_minimal)').eq('quota_id', id).order('created_at'),
      ]);
      if (q) setForm({ name: q.name, description: q.description || '', date: q.quota_date, supplier_id: q.supplier_id || '', amount_paid: String(q.amount_paid ?? 0), invoice_id: q.invoice_id });
      const rows = (items || []) as QuotaItemRow[];
      setLines(rows.filter((r) => r.products).map((r) => ({
        key: r.id, id: r.id, product: r.products as any, quantity: String(r.quantity),
        purchase_price: String(r.purchase_price), selling_price: String(r.selling_price), sold: r.sold_quantity,
      })));
      setOriginal(Object.fromEntries(rows.map((r) => [r.id, { quantity: r.quantity, product_id: r.product_id }])));
      setLoading(false);
    })();
  }, [id]);

  const total = lines.reduce((s, l) => s + lineTotal(l), 0);

  const adjustStock = async (productId: string, delta: number) => {
    if (!delta) return;
    const { data: p } = await supabase.from('products').select('quantity_initial, quantity_actual').eq('id', productId).single();
    if (!p) return;
    await supabase.from('products').update({
      quantity_initial: Math.max(0, (p.quantity_initial || 0) + delta),
      quantity_actual: Math.max(0, (p.quantity_actual || 0) + delta),
    }).eq('id', productId);
  };

  const save = async () => {
    if (!id) return;
    if (!form.name.trim()) return toast.error('Le nom du quota est requis.');
    if (lines.length === 0) return toast.error('Le quota doit contenir au moins un chargeur.');
    const bad = lines.find((l) => (parseInt(l.quantity) || 0) < Math.max(1, l.sold || 0));
    if (bad) return toast.error(`« ${bad.product.name} » : la quantité ne peut pas être inférieure à ${Math.max(1, bad.sold || 0)}.`);

    setSaving(true);
    try {
      const paid = parseFloat(form.amount_paid) || 0;
      const { error } = await supabase.from('quotas').update({
        name: form.name.trim(), description: form.description.trim() || null, quota_date: form.date,
        supplier_id: form.supplier_id || null, amount_paid: paid, updated_at: new Date().toISOString(),
      }).eq('id', id);
      if (error) throw error;

      const kept = new Set(lines.filter((l) => l.id).map((l) => l.id!));
      // Removed lines (only unsold lines can be removed) → take their stock back out.
      for (const [itemId, o] of Object.entries(original)) {
        if (kept.has(itemId)) continue;
        await supabase.from('quota_items').delete().eq('id', itemId);
        await adjustStock(o.product_id, -o.quantity);
      }
      for (const l of lines) {
        const qty = parseInt(l.quantity) || 0;
        const row = { quantity: qty, purchase_price: parseFloat(l.purchase_price) || 0, selling_price: parseFloat(l.selling_price) || 0 };
        if (l.id) {
          const { error: e } = await supabase.from('quota_items').update(row).eq('id', l.id);
          if (e) throw e;
          await adjustStock(l.product.id, qty - (original[l.id]?.quantity || 0));
        } else {
          const { error: e } = await supabase.from('quota_items').insert([{ ...row, quota_id: id, product_id: l.product.id }]);
          if (e) throw e;
          await adjustStock(l.product.id, qty);
        }
        await supabase.from('products').update({ purchase_price: row.purchase_price, selling_price: row.selling_price }).eq('id', l.product.id);
      }

      // Keep the linked purchase invoice in sync.
      if (form.invoice_id) {
        await supabase.from('invoices').update({
          supplier_id: form.supplier_id || null, subtotal: total, total_amount: total, amount_paid: paid,
          status: paid >= total ? 'paid' : 'pending', invoice_date: new Date(form.date).toISOString(), notes: `Quota : ${form.name.trim()}`,
        }).eq('id', form.invoice_id);
        await supabase.from('invoice_items').delete().eq('invoice_id', form.invoice_id);
        await supabase.from('invoice_items').insert(lines.map((l) => ({
          invoice_id: form.invoice_id, product_id: l.product.id, product_name: l.product.name,
          quantity: parseInt(l.quantity) || 0, unit_price: parseFloat(l.purchase_price) || 0, total_price: lineTotal(l),
        })));
      }
      toast.success('Quota mis à jour');
      onSaved();
      onClose();
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || 'La mise à jour a échoué.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {id && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B1220]/60 p-4 backdrop-blur-sm">
          <motion.div initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.96, opacity: 0 }} className="admin-modal flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden">
            <div className="admin-modal-head flex items-start justify-between px-6 py-5">
              <div><span className="admin-modal-eyebrow">Quota</span><h2 className="font-bold">Modifier le quota</h2></div>
              <button onClick={onClose} className="p-2" aria-label="Fermer"><X className="h-5 w-5" /></button>
            </div>
            <div className="flex-1 space-y-5 overflow-y-auto p-5 md:p-6">
              {loading ? <SkeletonRows rows={5} /> : (
                <>
                  <section className="grid gap-3 rounded-2xl border border-border bg-card p-4 sm:grid-cols-2">
                    <label className="text-xs"><span className="mb-1 block font-medium">Nom *</span><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm" /></label>
                    <label className="text-xs"><span className="mb-1 block font-medium">Date</span><input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm" /></label>
                    <label className="text-xs"><span className="mb-1 block font-medium">Fournisseur</span>
                      <select value={form.supplier_id} onChange={(e) => setForm({ ...form, supplier_id: e.target.value })} className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm">
                        <option value="">—</option>{suppliers.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </select>
                    </label>
                    <label className="text-xs"><span className="mb-1 block font-medium">Montant payé</span><input type="number" step="0.01" value={form.amount_paid} onChange={(e) => setForm({ ...form, amount_paid: e.target.value })} className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm" /></label>
                    <label className="text-xs sm:col-span-2"><span className="mb-1 block font-medium">Description</span><textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm" /></label>
                  </section>
                  <section className="rounded-2xl border border-border bg-card p-4">
                    <div className="mb-3 flex items-center justify-between"><h3 className="text-sm font-semibold">Chargeurs</h3><span className="text-sm font-bold tabular-nums">{formatDA(total)}</span></div>
                    <ChargerLinesEditor lines={lines} onChange={setLines} />
                    <p className="mt-3 text-xs text-muted-foreground">Le stock des chargeurs est ajusté selon les quantités modifiées.</p>
                  </section>
                </>
              )}
            </div>
            <div className="admin-modal-foot flex justify-end gap-2 border-t border-border px-6 py-4">
              <Button variant="outline" onClick={onClose}>Annuler</Button>
              <Button onClick={save} disabled={saving || loading} className="bg-primary">{saving ? 'Enregistrement…' : 'Enregistrer'}</Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
