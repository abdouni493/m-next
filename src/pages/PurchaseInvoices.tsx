import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Truck, Plus, Layers, ShoppingBag, CalendarDays, Wallet, Receipt, CheckCircle2, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabaseClient';
import { todayISO } from '@/lib/quotas';
import { cn } from '@/lib/utils';
import { PageHero, Panel, EmptyState, formatDA } from '@/admin/ui';
import { ChargerLinesEditor, lineTotal, type ChargerLine } from '@/admin/ChargerLinesEditor';

interface Supplier { id: string; name: string }
interface Invoice {
  id: string; invoice_number: string; invoice_date: string; status: string; total_amount: number; amount_paid?: number;
  supplier_id?: string | null; notes?: string | null;
}

const emptyQuota = () => ({ name: '', description: '', date: todayISO() });

export default function PurchaseInvoices() {
  const { toast } = useToast();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [quotaByInvoice, setQuotaByInvoice] = useState<Record<string, { id: string; name: string }>>({});
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // Create form
  const [useQuota, setUseQuota] = useState(false);
  const [quota, setQuota] = useState(emptyQuota);
  const [lines, setLines] = useState<ChargerLine[]>([]);
  const [supplierId, setSupplierId] = useState('');
  const [amountPaid, setAmountPaid] = useState('0');
  const [notes, setNotes] = useState('');

  useEffect(() => { loadSuppliers(); loadInvoices(); }, []);

  const loadSuppliers = async () => {
    const { data } = await supabase.from('suppliers').select('id, name').eq('is_active', true).order('name');
    setSuppliers(data || []);
  };

  const loadInvoices = async () => {
    const { data } = await supabase.from('invoices').select('*').eq('type', 'purchase').order('invoice_date', { ascending: false });
    setInvoices(data || []);
    const { data: qs } = await supabase.from('quotas').select('id, name, invoice_id');
    setQuotaByInvoice(Object.fromEntries((qs || []).filter((q: any) => q.invoice_id).map((q: any) => [q.invoice_id, { id: q.id, name: q.name }])));
  };

  const supplierName = useMemo(() => Object.fromEntries(suppliers.map((s) => [s.id, s.name])), [suppliers]);
  const total = lines.reduce((s, l) => s + lineTotal(l), 0);
  const totalQty = lines.reduce((s, l) => s + (parseInt(l.quantity) || 0), 0);
  const paid = parseFloat(amountPaid) || 0;
  const rest = Math.max(0, total - paid);

  const reset = () => {
    setUseQuota(false); setQuota(emptyQuota()); setLines([]); setSupplierId(''); setAmountPaid('0'); setNotes('');
  };
  const close = () => { setOpen(false); reset(); };

  const save = async () => {
    if (lines.length === 0) return toast({ title: 'Erreur', description: 'Sélectionnez au moins un chargeur.', variant: 'destructive' });
    if (lines.some((l) => (parseInt(l.quantity) || 0) <= 0)) return toast({ title: 'Erreur', description: 'Chaque chargeur doit avoir une quantité positive.', variant: 'destructive' });
    if (!supplierId) return toast({ title: 'Erreur', description: 'Choisissez un fournisseur.', variant: 'destructive' });
    if (useQuota && !quota.name.trim()) return toast({ title: 'Erreur', description: 'Donnez un nom au quota.', variant: 'destructive' });

    setSaving(true);
    try {
      const now = new Date().toISOString();
      const { data: inv, error: invErr } = await supabase.from('invoices').insert([{
        invoice_number: `PUR-${Date.now()}`,
        type: 'purchase',
        supplier_id: supplierId,
        subtotal: total,
        discount_amount: 0,
        total_amount: total,
        amount_paid: paid,
        status: paid >= total ? 'paid' : 'pending',
        payment_date: paid > 0 ? now : null,
        invoice_date: useQuota ? new Date(quota.date).toISOString() : now,
        notes: [useQuota ? `Quota : ${quota.name.trim()}` : '', notes.trim()].filter(Boolean).join(' — '),
      }]).select().single();
      if (invErr) throw invErr;

      const { error: itemsErr } = await supabase.from('invoice_items').insert(lines.map((l) => ({
        invoice_id: inv.id,
        product_id: l.product.id,
        product_name: l.product.name,
        quantity: parseInt(l.quantity) || 0,
        unit_price: parseFloat(l.purchase_price) || 0,
        total_price: lineTotal(l),
      })));
      if (itemsErr) throw itemsErr;

      // Stock + prices: re-read the current quantities so concurrent sales are not overwritten.
      for (const l of lines) {
        const q = parseInt(l.quantity) || 0;
        const { data: cur } = await supabase.from('products').select('quantity_initial, quantity_actual').eq('id', l.product.id).single();
        await supabase.from('products').update({
          quantity_initial: (cur?.quantity_initial || 0) + q,
          quantity_actual: (cur?.quantity_actual || 0) + q,
          purchase_price: parseFloat(l.purchase_price) || 0,
          selling_price: parseFloat(l.selling_price) || 0,
        }).eq('id', l.product.id);
      }

      if (useQuota) {
        const { data: qrow, error: qErr } = await supabase.from('quotas').insert([{
          name: quota.name.trim(),
          description: quota.description.trim() || null,
          quota_date: quota.date || todayISO(),
          supplier_id: supplierId,
          invoice_id: inv.id,
          amount_paid: paid,
        }]).select().single();
        if (qErr) throw qErr;
        const { error: qiErr } = await supabase.from('quota_items').insert(lines.map((l) => ({
          quota_id: qrow.id,
          product_id: l.product.id,
          quantity: parseInt(l.quantity) || 0,
          purchase_price: parseFloat(l.purchase_price) || 0,
          selling_price: parseFloat(l.selling_price) || 0,
        })));
        if (qiErr) throw qiErr;
      }

      toast({ title: 'Achat enregistré', description: useQuota ? `Quota « ${quota.name.trim()} » créé avec ${totalQty} chargeurs.` : `${totalQty} chargeurs ajoutés au stock.` });
      close();
      loadInvoices();
    } catch (e: any) {
      console.error('Error saving purchase:', e);
      toast({ title: 'Erreur', description: e?.message || "L'enregistrement a échoué.", variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const paidCount = invoices.filter((i) => i.status === 'paid').length;

  return (
    <div>
      <PageHero
        eyebrow="Stock"
        icon={Truck}
        title="Factures d'achat"
        description="Enregistrez vos achats fournisseurs, en simple ou regroupés dans un quota."
        actions={<Button onClick={() => setOpen(true)} className="bg-primary"><Plus className="h-4 w-4" />Nouvel achat</Button>}
        stats={[
          { label: 'Factures', value: invoices.length },
          { label: 'Payées', value: paidCount },
          { label: 'En attente', value: invoices.length - paidCount },
          { label: 'Montant total', value: formatDA(invoices.reduce((s, i) => s + (Number(i.total_amount) || 0), 0)) },
        ]}
      />

      <Panel title="Factures récentes" description={`${invoices.length} facture(s) d'achat`}>
        {invoices.length === 0 ? (
          <EmptyState icon={Receipt} title="Aucune facture" text="Commencez par créer un nouvel achat." action={<Button onClick={() => setOpen(true)}><Plus className="h-4 w-4" />Nouvel achat</Button>} />
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {invoices.slice(0, 30).map((inv) => {
              const q = quotaByInvoice[inv.id];
              const isPaid = inv.status === 'paid';
              return (
                <div key={inv.id} className="rounded-2xl border border-border bg-card p-5 shadow-sm transition-shadow hover:shadow-md">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Facture</p>
                      <p className="truncate font-mono text-sm font-semibold">{inv.invoice_number}</p>
                    </div>
                    <span className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold', isPaid ? 'bg-success/15 text-success' : 'bg-warning/15 text-warning')}>
                      {isPaid ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Clock className="h-3.5 w-3.5" />}{isPaid ? 'Payée' : 'En attente'}
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" />{new Date(inv.invoice_date).toLocaleDateString('fr-FR')}</span>
                    {inv.supplier_id && supplierName[inv.supplier_id] && <span className="inline-flex items-center gap-1"><Truck className="h-3.5 w-3.5" />{supplierName[inv.supplier_id]}</span>}
                  </div>
                  {q && (
                    <Link to={`/quotas/${q.id}`} className="mt-3 inline-flex items-center gap-1 rounded-full bg-volt px-2.5 py-0.5 text-xs font-semibold text-volt-foreground">
                      <Layers className="h-3.5 w-3.5" />{q.name}
                    </Link>
                  )}
                  <div className="mt-4 flex items-end justify-between border-t border-border pt-3">
                    <div>
                      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Total</p>
                      <p className="font-sora text-xl font-bold tabular-nums">{formatDA(inv.total_amount)}</p>
                    </div>
                    {!isPaid && <p className="text-xs text-destructive tabular-nums">Reste {formatDA((Number(inv.total_amount) || 0) - (Number(inv.amount_paid) || 0))}</p>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Panel>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B1220]/60 p-4 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.96, opacity: 0 }} className="admin-modal flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden">
              <div className="admin-modal-head flex items-start justify-between px-6 py-5">
                <div>
                  <span className="admin-modal-eyebrow">Achat</span>
                  <h2 className="font-bold">Nouvel achat</h2>
                  <p className="text-sm">Sélectionnez les chargeurs, le fournisseur et le paiement.</p>
                </div>
                <button onClick={close} className="p-2" aria-label="Fermer"><X className="h-5 w-5" /></button>
              </div>

              <div className="grid flex-1 gap-5 overflow-y-auto p-5 lg:grid-cols-[1fr_340px] md:p-6">
                <div className="space-y-5">
                  {/* Mode */}
                  <section className="rounded-2xl border border-border bg-card p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <span className={cn('flex h-10 w-10 items-center justify-center rounded-xl', useQuota ? 'bg-volt text-volt-foreground' : 'bg-surface-2')}>
                          {useQuota ? <Layers className="h-5 w-5" /> : <ShoppingBag className="h-5 w-5" />}
                        </span>
                        <div>
                          <p className="text-sm font-semibold">Achat en quota</p>
                          <p className="text-xs text-muted-foreground">Regroupe ce lot pour suivre son stock restant et ses gains.</p>
                        </div>
                      </div>
                      <Switch checked={useQuota} onCheckedChange={setUseQuota} aria-label="Activer le quota" />
                    </div>
                    <AnimatePresence initial={false}>
                      {useQuota && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                          <div className="mt-4 grid gap-3 border-t border-border pt-4 sm:grid-cols-[1fr_180px]">
                            <label className="text-xs">
                              <span className="mb-1 block font-medium">Nom du quota *</span>
                              <input value={quota.name} onChange={(e) => setQuota({ ...quota, name: e.target.value })} placeholder="ex. Lot Octobre — 50 chargeurs" className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm" />
                            </label>
                            <label className="text-xs">
                              <span className="mb-1 block font-medium">Date</span>
                              <input type="date" value={quota.date} onChange={(e) => setQuota({ ...quota, date: e.target.value })} className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm" />
                            </label>
                            <label className="text-xs sm:col-span-2">
                              <span className="mb-1 block font-medium">Description</span>
                              <textarea rows={2} value={quota.description} onChange={(e) => setQuota({ ...quota, description: e.target.value })} className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm" />
                            </label>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </section>

                  {/* Chargers */}
                  <section className="rounded-2xl border border-border bg-card p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <h3 className="text-sm font-semibold">Chargeurs</h3>
                      <span className="rounded-full bg-surface-2 px-2.5 py-0.5 text-xs font-semibold tabular-nums">{lines.length} article(s) · {totalQty} pcs</span>
                    </div>
                    <ChargerLinesEditor lines={lines} onChange={setLines} />
                  </section>
                </div>

                {/* Summary column */}
                <aside className="space-y-5">
                  <section className="rounded-2xl border border-border bg-card p-4">
                    <h3 className="mb-3 text-sm font-semibold">Fournisseur</h3>
                    <select value={supplierId} onChange={(e) => setSupplierId(e.target.value)} className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm">
                      <option value="">Choisir un fournisseur</option>
                      {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                    <label className="mt-3 block text-xs">
                      <span className="mb-1 block font-medium">Notes</span>
                      <textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm" />
                    </label>
                  </section>

                  <section className="relative overflow-hidden rounded-2xl bg-[#0B1220] p-5 text-white">
                    <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-[#C6F432]/20 blur-3xl" />
                    <p className="relative flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-[#9AA3B5]"><Wallet className="h-4 w-4 text-[#C6F432]" />Paiement</p>
                    <dl className="relative mt-3 space-y-2 text-sm">
                      <div className="flex justify-between text-[#9AA3B5]"><dt>Quantité totale</dt><dd className="tabular-nums text-white">{totalQty}</dd></div>
                      <div className="flex justify-between text-[#9AA3B5]"><dt>Total achat</dt><dd className="font-sora text-lg font-bold tabular-nums text-white">{formatDA(total)}</dd></div>
                    </dl>
                    <label className="relative mt-4 block text-xs text-[#9AA3B5]">
                      <span className="mb-1 block">Montant payé</span>
                      <input type="number" step="0.01" value={amountPaid} onChange={(e) => setAmountPaid(e.target.value)} className="w-full rounded-lg border border-white/15 bg-white/[0.06] px-3 py-2 text-sm tabular-nums text-white" style={{ background: 'rgb(255 255 255 / 0.06)', color: '#fff' }} />
                    </label>
                    <div className="relative mt-2 flex gap-2">
                      <button type="button" onClick={() => setAmountPaid(String(total))} className="rounded-lg bg-white/10 px-2.5 py-1 text-xs hover:bg-white/15">Tout payer</button>
                      <button type="button" onClick={() => setAmountPaid('0')} className="rounded-lg bg-white/10 px-2.5 py-1 text-xs hover:bg-white/15">Rien</button>
                    </div>
                    <div className="relative mt-4 flex items-end justify-between border-t border-white/10 pt-3">
                      <span className="text-xs text-[#9AA3B5]">Reste à payer</span>
                      <span className={cn('font-sora text-xl font-bold tabular-nums', rest > 0 ? 'text-[#FF8A80]' : 'text-[#C6F432]')}>{formatDA(rest)}</span>
                    </div>
                  </section>
                </aside>
              </div>

              <div className="admin-modal-foot flex justify-end gap-2 border-t border-border px-6 py-4">
                <Button variant="outline" onClick={close}>Annuler</Button>
                <Button onClick={save} disabled={saving} className="bg-primary">{saving ? 'Enregistrement…' : useQuota ? 'Créer le quota' : "Enregistrer l'achat"}</Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
