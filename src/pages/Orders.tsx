import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { format, formatDistanceToNowStrict } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  Phone, MessageCircle, Check, Truck, PackageCheck, X, Printer, MoreHorizontal, Home, Building2, Clock, LayoutList,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { supabase, confirmOrder, startOrderDelivery, finalizeOrder, cancelOrder, getOrderByIdREST } from '@/lib/supabaseClient';
import { PageHeader, DataTable, FilterBar, StatusBadge, ConfirmDialog, EmptyState, formatDA, ORDER_STATUS, type Column } from '@/admin/ui';

interface Order {
  id: string; status: string; created_at: string; customer_name: string; customer_phone: string; customer_wilaya?: string | null;
  customer_address?: string | null; delivery_type?: string | null; delivery_price?: number | null; total_price: number; notes?: string | null;
  confirmed_at?: string | null; shipped_at?: string | null; delivered_at?: string | null; cancelled_at?: string | null; updated_at?: string | null;
  order_items?: { quantity: number }[];
}

const TABS: { key: string; label: string; match: (s: string) => boolean }[] = [
  { key: 'all', label: 'Toutes', match: () => true },
  { key: 'pending', label: 'Nouvelles', match: (s) => s === 'pending' },
  { key: 'confirmed', label: 'Confirmées', match: (s) => s === 'confirmed' },
  { key: 'on_delivery', label: 'Expédiées', match: (s) => s === 'on_delivery' },
  { key: 'delivered', label: 'Livrées', match: (s) => s === 'delivered' },
  { key: 'cancelled', label: 'Annulées / retours', match: (s) => s === 'cancelled' || s === 'returned' },
];

const waLink = (phone: string) => `https://wa.me/${phone.replace(/\D/g, '').replace(/^0/, '213')}`;
const shortId = (id: string) => id.slice(0, 8).toUpperCase();

/** Status transitions use the existing business functions (stock deduction happens in finalizeOrder). */
const TRANSITIONS: Record<string, { to: string; label: string; icon: typeof Check; run: (id: string) => Promise<unknown>; stamp?: string }[]> = {
  pending: [{ to: 'confirmed', label: 'Confirmer', icon: Check, run: confirmOrder, stamp: 'confirmed_at' }],
  confirmed: [{ to: 'on_delivery', label: 'Marquer expédiée', icon: Truck, run: startOrderDelivery, stamp: 'shipped_at' }],
  on_delivery: [{ to: 'delivered', label: 'Marquer livrée', icon: PackageCheck, run: finalizeOrder, stamp: 'delivered_at' }],
};

export default function Orders() {
  const qc = useQueryClient();
  const [sp, setSp] = useSearchParams();
  const tab = sp.get('status') || 'all';
  const [search, setSearch] = useState(sp.get('q') || '');
  const [openId, setOpenId] = useState<string | null>(null);
  const [cancelId, setCancelId] = useState<string | null>(null);

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['orders-list'],
    queryFn: async () => {
      const { data, error } = await supabase.from('orders').select('*, order_items(quantity)').order('created_at', { ascending: false }).limit(1000);
      if (error) throw error;
      return data as Order[];
    },
  });

  const counts = useMemo(() => Object.fromEntries(TABS.map((t) => [t.key, orders.filter((o) => t.match(o.status)).length])), [orders]);
  const rows = useMemo(() => {
    const t = TABS.find((x) => x.key === tab) || TABS[0];
    const q = search.trim().toLowerCase().replace(/^#/, '');
    return orders.filter((o) => t.match(o.status) && (!q || [o.id, o.customer_name, o.customer_phone, o.customer_wilaya, o.customer_address].some((v) => String(v || '').toLowerCase().includes(q))));
  }, [orders, tab, search]);

  const refresh = () => { qc.invalidateQueries({ queryKey: ['orders-list'] }); qc.invalidateQueries({ queryKey: ['admin-alerts'] }); qc.invalidateQueries({ queryKey: ['dashboard'] }); };

  const transition = async (o: Omit<Order, 'order_items'>, t: (typeof TRANSITIONS)[string][number]) => {
    try {
      await t.run(o.id);
      // Timeline timestamp — optional column (see supabase_admin_fields.sql); ignore if absent.
      if (t.stamp) await supabase.from('orders').update({ [t.stamp]: new Date().toISOString() }).eq('id', o.id);
      toast.success(`Commande #${shortId(o.id)} : ${ORDER_STATUS[t.to]?.label || t.to}`);
      refresh();
    } catch {
      toast.error("Le changement de statut a échoué.");
    }
  };
  const doCancel = async (id: string) => {
    try { await cancelOrder(id, 'Annulée par l’administrateur'); toast.success('Commande annulée'); refresh(); }
    catch { toast.error("L'annulation a échoué."); }
  };

  const columns: Column<Order>[] = [
    { key: 'id', header: 'N°', cell: (o) => <span className="font-mono text-xs font-semibold">#{shortId(o.id)}</span>, csv: (o) => shortId(o.id) },
    { key: 'date', header: 'Date', cell: (o) => <span className="whitespace-nowrap text-muted-foreground" title={format(new Date(o.created_at), 'dd/MM/yyyy HH:mm')}>{formatDistanceToNowStrict(new Date(o.created_at), { locale: fr, addSuffix: true })}</span>, sortValue: (o) => o.created_at, csv: (o) => format(new Date(o.created_at), 'yyyy-MM-dd HH:mm') },
    { key: 'client', header: 'Client', cell: (o) => <span className="font-medium">{o.customer_name}</span>, sortValue: (o) => o.customer_name.toLowerCase(), csv: (o) => o.customer_name },
    {
      key: 'phone', header: 'Téléphone', csv: (o) => o.customer_phone,
      cell: (o) => (
        <span className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <a href={`tel:${o.customer_phone}`} className="tabular-nums hover:underline">{o.customer_phone}</a>
          <a href={waLink(o.customer_phone)} target="_blank" rel="noopener noreferrer" className="rounded-md p-1 text-success hover:bg-success/10" aria-label="WhatsApp"><MessageCircle className="h-3.5 w-3.5" /></a>
        </span>
      ),
    },
    { key: 'wilaya', header: 'Wilaya', cell: (o) => o.customer_wilaya || '—', sortValue: (o) => o.customer_wilaya || '', csv: (o) => o.customer_wilaya || '', hideOnMobile: false },
    { key: 'items', header: 'Articles', cell: (o) => <span className="tabular-nums">{(o.order_items || []).reduce((s, i) => s + (i.quantity || 0), 0)}</span>, hideOnMobile: true, csv: (o) => (o.order_items || []).reduce((s, i) => s + (i.quantity || 0), 0) },
    { key: 'total', header: 'Total', className: 'text-right', cell: (o) => <span className="font-semibold tabular-nums">{formatDA(o.total_price)}</span>, sortValue: (o) => Number(o.total_price), csv: (o) => o.total_price },
    { key: 'delivery', header: 'Livraison', cell: (o) => <span className="inline-flex items-center gap-1 text-xs">{o.delivery_type === 'bureau' ? <><Building2 className="h-3.5 w-3.5" />Stop-desk</> : <><Home className="h-3.5 w-3.5" />Domicile</>}</span>, hideOnMobile: true, csv: (o) => (o.delivery_type === 'bureau' ? 'Stop-desk' : 'Domicile') },
    { key: 'status', header: 'Statut', cell: (o) => <StatusBadge status={o.status} />, sortValue: (o) => o.status, csv: (o) => ORDER_STATUS[o.status]?.label || o.status },
    {
      key: 'actions', header: '', className: 'w-12',
      cell: (o) => (
        <div onClick={(e) => e.stopPropagation()}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Actions"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {(TRANSITIONS[o.status] || []).map((t) => <DropdownMenuItem key={t.to} onClick={() => transition(o, t)}><t.icon className="mr-2 h-4 w-4" />{t.label}</DropdownMenuItem>)}
              <DropdownMenuItem onClick={() => setOpenId(o.id)}><LayoutList className="mr-2 h-4 w-4" />Détails</DropdownMenuItem>
              <DropdownMenuItem onClick={() => printDeliveryNote(o.id)}><Printer className="mr-2 h-4 w-4" />Bon de livraison</DropdownMenuItem>
              {!['cancelled', 'returned', 'delivered'].includes(o.status) && (<><DropdownMenuSeparator /><DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setCancelId(o.id)}><X className="mr-2 h-4 w-4" />Annuler</DropdownMenuItem></>)}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader title="Commandes" description="Commandes passées sur la boutique en ligne (paiement à la livraison)."
        actions={<Button variant="outline" size="sm" asChild><Link to="/commands/classique">Vue classique</Link></Button>} />

      <div className="mb-4 flex gap-1 overflow-x-auto rounded-[12px] border border-border bg-card p-1" role="tablist" aria-label="Statut">
        {TABS.map((t) => (
          <button key={t.key} role="tab" aria-selected={tab === t.key}
            onClick={() => { const n = new URLSearchParams(sp); if (t.key === 'all') n.delete('status'); else n.set('status', t.key); setSp(n, { replace: true }); }}
            className={cn('flex h-9 shrink-0 items-center gap-2 rounded-[8px] px-3 text-sm font-medium transition-colors', tab === t.key ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-surface-2 hover:text-foreground')}>
            {t.label}<span className={cn('rounded-full px-1.5 text-[11px] font-bold tabular-nums', tab === t.key ? 'bg-primary-foreground/15' : 'bg-surface-2')}>{counts[t.key] ?? 0}</span>
          </button>
        ))}
      </div>

      <FilterBar search={search} onSearch={setSearch} placeholder="N° de commande, client, téléphone, wilaya…" />

      <DataTable rows={rows} columns={columns} loading={isLoading} onRowClick={(o) => setOpenId(o.id)} csvName="commandes"
        mobileTitle={(o) => <span className="flex items-center justify-between gap-2"><span>{o.customer_name}</span><StatusBadge status={o.status} /></span>}
        empty={<EmptyState icon={PackageCheck} title="Aucune commande" text={search ? 'Aucun résultat pour cette recherche.' : 'Les commandes de la boutique apparaîtront ici.'} />} />

      <OrderDrawer id={openId} onClose={() => setOpenId(null)} onTransition={transition} onCancel={(id) => setCancelId(id)} />
      <ConfirmDialog open={!!cancelId} onOpenChange={(o) => !o && setCancelId(null)} title="Annuler cette commande ?" description="La commande passera au statut « Annulée »."
        confirmLabel="Annuler la commande" destructive onConfirm={() => { if (cancelId) doCancel(cancelId); setCancelId(null); }} />
    </div>
  );
}

function OrderDrawer({ id, onClose, onTransition, onCancel }: { id: string | null; onClose: () => void; onTransition: (o: Omit<Order, 'order_items'>, t: (typeof TRANSITIONS)[string][number]) => void; onCancel: (id: string) => void }) {
  const { data: o, isLoading } = useQuery({
    queryKey: ['order', id],
    enabled: !!id,
    queryFn: () => getOrderByIdREST(id!) as Promise<Omit<Order, 'order_items'> & { order_items: { id: string; product_name: string; product_image?: string; quantity: number; price_per_unit: number; line_total: number; product_mark?: string }[] }>,
  });

  const timeline = o ? [
    { label: 'Commande reçue', at: o.created_at, done: true },
    { label: 'Confirmée', at: o.confirmed_at, done: ['confirmed', 'on_delivery', 'delivered'].includes(o.status) },
    { label: 'Expédiée', at: o.shipped_at, done: ['on_delivery', 'delivered'].includes(o.status) },
    { label: 'Livrée', at: o.delivered_at, done: o.status === 'delivered' },
    ...(o.status === 'cancelled' || o.status === 'returned' ? [{ label: o.status === 'returned' ? 'Retournée' : 'Annulée', at: o.cancelled_at || o.updated_at, done: true, bad: true }] : []),
  ] as { label: string; at?: string | null; done: boolean; bad?: boolean }[] : [];

  return (
    <Sheet open={!!id} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">Commande {o && <span className="font-mono">#{shortId(o.id)}</span>}</SheetTitle>
          <SheetDescription>{o ? format(new Date(o.created_at), "d MMMM yyyy 'à' HH:mm", { locale: fr }) : 'Chargement…'}</SheetDescription>
        </SheetHeader>
        {isLoading || !o ? <div className="mt-6 space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-16 animate-pulse rounded-xl bg-muted" />)}</div> : (
          <div className="mt-6 space-y-6">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={o.status} />
              {(TRANSITIONS[o.status] || []).map((t) => <Button key={t.to} size="sm" onClick={() => onTransition(o, t)} className={t.to === 'confirmed' ? 'bg-volt text-volt-foreground hover:bg-volt/90' : ''}><t.icon className="h-4 w-4" />{t.label}</Button>)}
              <Button size="sm" variant="outline" onClick={() => printDeliveryNote(o.id)}><Printer className="h-4 w-4" />Bon de livraison</Button>
              {!['cancelled', 'returned', 'delivered'].includes(o.status) && <Button size="sm" variant="ghost" className="text-destructive" onClick={() => onCancel(o.id)}><X className="h-4 w-4" />Annuler</Button>}
            </div>

            <section>
              <h3 className="mb-3 text-sm font-semibold" style={{ fontFamily: 'Inter, sans-serif' }}>Suivi</h3>
              <ol className="relative space-y-4 border-l border-border pl-5">
                {timeline.map((s) => (
                  <li key={s.label} className="relative">
                    <span className={cn('absolute -left-[27px] top-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full border-2', s.bad ? 'border-destructive bg-destructive' : s.done ? 'border-volt bg-volt' : 'border-border bg-card')} />
                    <p className={cn('text-sm', s.done ? 'font-medium' : 'text-muted-foreground')}>{s.label}</p>
                    {s.at && s.done && <p className="flex items-center gap-1 text-xs text-muted-foreground"><Clock className="h-3 w-3" />{format(new Date(s.at), 'dd/MM/yyyy HH:mm')}</p>}
                  </li>
                ))}
              </ol>
            </section>

            <section className="rounded-xl border border-border p-4">
              <h3 className="mb-2 text-sm font-semibold" style={{ fontFamily: 'Inter, sans-serif' }}>Client</h3>
              <p className="font-medium">{o.customer_name}</p>
              <div className="mt-1 flex flex-wrap gap-2 text-sm">
                <a href={`tel:${o.customer_phone}`} className="inline-flex items-center gap-1 rounded-lg bg-surface-2 px-2.5 py-1.5 hover:bg-muted"><Phone className="h-3.5 w-3.5" />{o.customer_phone}</a>
                <a href={waLink(o.customer_phone)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 rounded-lg bg-success/15 px-2.5 py-1.5 text-success"><MessageCircle className="h-3.5 w-3.5" />WhatsApp</a>
              </div>
              <p className="mt-3 text-sm text-muted-foreground">{o.customer_address || o.customer_wilaya}</p>
              <p className="mt-1 text-sm">{o.delivery_type === 'bureau' ? 'Stop-desk' : 'À domicile'}</p>
              {o.notes && <p className="mt-2 rounded-lg bg-surface-2 p-2 text-sm">{o.notes}</p>}
            </section>

            <section>
              <h3 className="mb-2 text-sm font-semibold" style={{ fontFamily: 'Inter, sans-serif' }}>Articles</h3>
              <ul className="divide-y divide-border rounded-xl border border-border">
                {o.order_items.map((i) => (
                  <li key={i.id} className="flex items-center gap-3 p-3">
                    <span className="h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-surface-2">{i.product_image && <img src={i.product_image} alt="" className="h-full w-full object-contain" />}</span>
                    <span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium">{i.product_name}</span><span className="text-xs text-muted-foreground tabular-nums">{i.quantity} × {formatDA(i.price_per_unit)}</span></span>
                    <span className="text-sm font-semibold tabular-nums">{formatDA(i.line_total)}</span>
                  </li>
                ))}
              </ul>
              <dl className="mt-3 space-y-1 text-sm">
                <div className="flex justify-between"><dt className="text-muted-foreground">Livraison</dt><dd className="tabular-nums">{formatDA(o.delivery_price)}</dd></div>
                <div className="flex justify-between text-base font-semibold"><dt>Total</dt><dd className="tabular-nums">{formatDA(o.total_price)}</dd></div>
              </dl>
            </section>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

/** Opens a printable delivery note (bon de livraison) in a new window. */
async function printDeliveryNote(id: string) {
  const w = window.open('', '_blank', 'width=800,height=900');
  if (!w) { toast.error("Autorisez les fenêtres pop-up pour imprimer."); return; }
  w.document.write('<p style="font-family:sans-serif;padding:24px">Préparation…</p>');
  try {
    const o = await getOrderByIdREST(id);
    const esc = (s: unknown) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));
    const rows = (o.order_items || []).map((i: { product_name: string; quantity: number; price_per_unit: number; line_total: number }) =>
      `<tr><td>${esc(i.product_name)}</td><td class="n">${i.quantity}</td><td class="n">${formatDA(i.price_per_unit)}</td><td class="n">${formatDA(i.line_total)}</td></tr>`).join('');
    w.document.open();
    w.document.write(`<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>Bon de livraison #${shortId(o.id)}</title>
      <style>body{font-family:Inter,Arial,sans-serif;color:#0B1220;padding:32px;max-width:720px;margin:auto}h1{font-size:22px;margin:0}
      .muted{color:#5B6475}table{width:100%;border-collapse:collapse;margin-top:16px;font-size:14px}th,td{padding:8px;border-bottom:1px solid #E2E6EC;text-align:left}
      .n{text-align:right;font-variant-numeric:tabular-nums}.box{border:1px solid #E2E6EC;border-radius:12px;padding:16px;margin-top:16px}.total{font-size:18px;font-weight:700}
      .bar{height:6px;width:80px;background:#C6F432;border-radius:3px;margin:8px 0 16px}@media print{button{display:none}}</style></head><body>
      <h1>Bon de livraison</h1><div class="bar"></div>
      <p class="muted">Commande #${shortId(o.id)} · ${format(new Date(o.created_at), 'dd/MM/yyyy HH:mm')}</p>
      <div class="box"><strong>${esc(o.customer_name)}</strong><br>${esc(o.customer_phone)}<br>${esc(o.customer_address || o.customer_wilaya)}<br>
      Livraison : ${o.delivery_type === 'bureau' ? 'Stop-desk' : 'À domicile'}</div>
      <table><thead><tr><th>Article</th><th class="n">Qté</th><th class="n">P.U.</th><th class="n">Total</th></tr></thead><tbody>${rows}</tbody></table>
      <table><tr><td>Livraison</td><td class="n">${formatDA(o.delivery_price)}</td></tr><tr><td class="total">À encaisser</td><td class="n total">${formatDA(o.total_price)}</td></tr></table>
      <p class="muted" style="margin-top:32px">Paiement à la livraison. Merci pour votre confiance.</p>
      <button onclick="print()" style="margin-top:16px;padding:10px 16px;border-radius:10px;border:0;background:#0B1220;color:#fff;font-weight:600">Imprimer</button>
      <script>setTimeout(()=>print(),300)</script></body></html>`);
    w.document.close();
  } catch {
    w.close();
    toast.error('Impossible de générer le bon de livraison.');
  }
}
