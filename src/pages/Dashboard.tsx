import { lazy, Suspense, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNowStrict, format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  Banknote, TrendingUp, ShoppingBag, ReceiptText, Package, BadgeCheck, Undo2, Warehouse, RefreshCw, Plus, Download, Phone,
  MessageCircle, Check, X, AlertTriangle, Moon as Dead, Star, PackageCheck, ScanLine, Truck, Info,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { confirmOrder, cancelOrder } from '@/lib/supabaseClient';
import { EmptyState, ErrorState, Panel, StatCard, StatusBadge, formatCompactDA, formatDA, SkeletonRows, ConfirmDialog } from '@/admin/ui';
import { RANGE_LABELS, makeRange, useDashboard, exportSeriesCsv, type RangeKey } from '@/admin/dashboard/data';

const Charts = {
  Revenue: lazy(() => import('@/admin/dashboard/Charts').then((m) => ({ default: m.RevenueChart }))),
  HBar: lazy(() => import('@/admin/dashboard/Charts').then((m) => ({ default: m.HBarChart }))),
  Column: lazy(() => import('@/admin/dashboard/Charts').then((m) => ({ default: m.ColumnChart }))),
};
const ChartFallback = ({ h = 240 }: { h?: number }) => <div className="animate-pulse rounded-xl bg-muted" style={{ height: h }} />;

const pct = (v: number | null) => (v === null ? '—' : `${v.toLocaleString('fr-FR', { maximumFractionDigits: 1 })}%`);
const waLink = (phone: string) => `https://wa.me/${phone.replace(/\D/g, '').replace(/^0/, '213')}`;

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [rangeKey, setRangeKey] = useState<RangeKey>('30d');
  const [custom, setCustom] = useState(() => ({ from: format(new Date(Date.now() - 29 * 864e5), 'yyyy-MM-dd'), to: format(new Date(), 'yyyy-MM-dd') }));
  const [compare, setCompare] = useState(true);
  const [topBy, setTopBy] = useState<'revenue' | 'units'>('revenue');
  const [cancelId, setCancelId] = useState<string | null>(null);

  const range = useMemo(() => makeRange(rangeKey, { from: new Date(custom.from), to: new Date(custom.to) }), [rangeKey, custom]);
  const { data: d, isLoading, isError, refetch, isFetching } = useDashboard(range);

  const hour = new Date().getHours();
  const greeting = hour < 5 || hour >= 18 ? 'Bonsoir' : 'Bonjour';
  const delta = (v: number | null | undefined) => (compare ? v ?? null : undefined);

  const act = async (id: string, kind: 'confirm' | 'cancel') => {
    try {
      if (kind === 'confirm') await confirmOrder(id); else await cancelOrder(id, 'Annulée depuis le tableau de bord');
      toast.success(kind === 'confirm' ? 'Commande confirmée' : 'Commande annulée');
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      qc.invalidateQueries({ queryKey: ['admin-alerts'] });
    } catch {
      toast.error("L'action a échoué. Réessayez.");
    }
  };

  const top = useMemo(() => (d ? [...d.topProducts].sort((a, b) => (topBy === 'revenue' ? b.revenue - a.revenue : b.units - a.units)).slice(0, 10) : []), [d, topBy]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-[28px]">{greeting}, {user?.name?.split(' ')[0] || 'admin'}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Activité du {format(range.from, 'd MMM', { locale: fr })} au {format(range.to, 'd MMM yyyy', { locale: fr })}{compare && ' · comparée à la période précédente'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate('/inventory')}><Plus className="h-4 w-4" /> Produit</Button>
          <Button variant="outline" size="sm" onClick={() => navigate('/pos')}><Plus className="h-4 w-4" /> Vente</Button>
          <Button variant="outline" size="sm" disabled={!d} onClick={() => d && exportSeriesCsv(d, range)}><Download className="h-4 w-4" /> Exporter</Button>
        </div>
      </div>

      {/* Range controls */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex flex-wrap gap-1 rounded-[12px] border border-border bg-card p-1" role="tablist" aria-label="Période">
          {(Object.keys(RANGE_LABELS) as RangeKey[]).map((k) => (
            <button key={k} role="tab" aria-selected={rangeKey === k} onClick={() => setRangeKey(k)}
              className={cn('h-8 rounded-[8px] px-3 text-xs font-semibold transition-colors', rangeKey === k ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-surface-2 hover:text-foreground')}>
              {RANGE_LABELS[k]}
            </button>
          ))}
        </div>
        {rangeKey === 'custom' && (
          <div className="flex items-center gap-1.5 text-sm">
            <input type="date" value={custom.from} max={custom.to} onChange={(e) => setCustom((c) => ({ ...c, from: e.target.value }))} className="h-9 rounded-[10px] border border-input bg-card px-2 text-sm" aria-label="Du" />
            <span className="text-muted-foreground">→</span>
            <input type="date" value={custom.to} min={custom.from} onChange={(e) => setCustom((c) => ({ ...c, to: e.target.value }))} className="h-9 rounded-[10px] border border-input bg-card px-2 text-sm" aria-label="Au" />
          </div>
        )}
        <label className="ml-auto flex cursor-pointer items-center gap-2 text-sm">
          <input type="checkbox" checked={compare} onChange={(e) => setCompare(e.target.checked)} className="h-4 w-4 accent-[hsl(var(--primary))]" />
          vs période précédente
        </label>
        <Button variant="ghost" size="icon" onClick={() => refetch()} aria-label="Actualiser" className={cn(isFetching && 'animate-spin')}><RefreshCw className="h-4 w-4" /></Button>
      </div>

      {isError ? <Panel><ErrorState onRetry={() => refetch()} /></Panel> : (
        <>
          {d && !d.hasCostData && (
            <div className="flex items-start gap-2 rounded-xl border border-warning/30 bg-warning/10 p-3 text-sm">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
              <span>Aucun prix d'achat n'est renseigné sur les produits : le bénéfice et la valeur du stock ne peuvent pas être calculés. Ajoutez le « prix d'achat » dans Chargeurs.</span>
            </div>
          )}

          {/* Row 1 — KPIs */}
          <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
            <StatCard loading={isLoading} label="Chiffre d'affaires" icon={Banknote} value={d && formatCompactDA(d.kpi.revenue)} delta={delta(d?.deltas.revenue)} spark={d?.spark.revenue} />
            <StatCard loading={isLoading} label="Bénéfice brut" icon={TrendingUp} value={d && formatCompactDA(d.kpi.profit)} delta={delta(d?.deltas.profit)} hint={d && `marge ${pct(d.kpi.margin)}`} spark={d?.spark.profit} />
            <StatCard loading={isLoading} label="Commandes" icon={ShoppingBag} value={d?.kpi.orders.toLocaleString('fr-FR')} delta={delta(d?.deltas.orders)} hint={d && `${d.kpi.webOrders} web · ${d.kpi.posSales} caisse`} spark={d?.spark.orders} />
            <StatCard loading={isLoading} label="Panier moyen" icon={ReceiptText} value={d && formatDA(d.kpi.aov)} delta={delta(d?.deltas.aov)} />
            <StatCard loading={isLoading} label="Unités vendues" icon={Package} value={d?.kpi.units.toLocaleString('fr-FR')} delta={delta(d?.deltas.units)} />
            <StatCard loading={isLoading} label="Taux de confirmation" icon={BadgeCheck} value={d && pct(d.kpi.confirmRate)} delta={delta(d?.deltas.confirmRate)} hint="commandes web" />
            <StatCard loading={isLoading} label="Retours / annulations" icon={Undo2} value={d && pct(d.kpi.cancelRate)} delta={delta(d?.deltas.cancelRate)} invertDelta />
            <StatCard loading={isLoading} label="Valeur du stock" icon={Warehouse} value={d && formatCompactDA(d.stock.value)} hint={d && (d.stock.lowCount ? <span className="font-medium text-warning">{d.stock.lowCount} sous le seuil</span> : 'au prix d’achat')} />
          </div>

          {/* Row 2 */}
          <div className="grid gap-4 lg:grid-cols-3">
            <Panel className="lg:col-span-2" title="Chiffre d'affaires & bénéfice" description={`Par ${d?.gran === 'week' ? 'semaine' : d?.gran === 'month' ? 'mois' : 'jour'} · commandes en barres`}>
              {isLoading ? <ChartFallback h={300} /> : d && d.hasOrders ? <Suspense fallback={<ChartFallback h={300} />}><Charts.Revenue data={d.series} /></Suspense>
                : <EmptyState title="Pas encore de ventes sur cette période" text="Les ventes caisse et les commandes de la boutique apparaîtront ici." />}
            </Panel>
            <Panel title="Commandes par statut" description="Boutique en ligne">
              {isLoading ? <SkeletonRows rows={5} /> : d && d.funnel[0].value > 0 ? (
                <div className="space-y-3">
                  {d.funnel.map((f, i) => {
                    const max = d.funnel[0].value || 1;
                    return (
                      <div key={f.key}>
                        <div className="mb-1 flex justify-between text-sm"><span>{f.label}</span><span className="font-semibold tabular-nums">{f.value} <span className="text-xs font-normal text-muted-foreground">{i > 0 && `(${Math.round((f.value / max) * 100)}%)`}</span></span></div>
                        <div className="h-2.5 overflow-hidden rounded-full bg-surface-2"><div className={cn('h-full rounded-full', i === 3 ? 'bg-success' : i === 1 ? 'bg-volt' : i === 0 ? 'bg-primary' : 'bg-electric')} style={{ width: `${(f.value / max) * 100}%` }} /></div>
                      </div>
                    );
                  })}
                  <div className="mt-4 grid grid-cols-2 gap-2 border-t border-border pt-4">
                    {d.lost.map((l) => <div key={l.key} className="rounded-xl bg-destructive/10 p-3"><p className="text-xs text-destructive">{l.label}</p><p className="font-sora text-lg font-bold tabular-nums">{l.value}</p></div>)}
                  </div>
                </div>
              ) : <EmptyState compact icon={PackageCheck} title="Aucune commande web" text="Les commandes passées sur la boutique s'afficheront ici." />}
            </Panel>
          </div>

          {/* Row 3 */}
          <div className="grid gap-4 lg:grid-cols-3">
            <Panel title="Top 10 chargeurs" actions={
              <div className="flex rounded-[10px] border border-border p-0.5 text-xs">
                {(['revenue', 'units'] as const).map((k) => <button key={k} onClick={() => setTopBy(k)} className={cn('rounded-[8px] px-2.5 py-1 font-semibold', topBy === k ? 'bg-primary text-primary-foreground' : 'text-muted-foreground')}>{k === 'revenue' ? 'CA' : 'Unités'}</button>)}
              </div>
            }>
              {isLoading ? <SkeletonRows /> : top.length ? (
                <ol className="space-y-2.5">
                  {top.map((p, i) => (
                    <li key={p.id} className="flex items-center gap-3">
                      <span className="w-4 text-xs font-semibold tabular-nums text-muted-foreground">{i + 1}</span>
                      <span className="h-9 w-9 shrink-0 overflow-hidden rounded-lg bg-surface-2">{p.image ? <img src={p.image} alt="" className="h-full w-full object-contain" loading="lazy" /> : <Package className="m-2.5 h-4 w-4 text-muted-foreground" />}</span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">{p.name}</span>
                        <span className="block text-xs text-muted-foreground tabular-nums">{p.units} vendus · stock {p.stock}</span>
                      </span>
                      <span className="text-sm font-semibold tabular-nums">{topBy === 'revenue' ? formatCompactDA(p.revenue) : p.units}</span>
                    </li>
                  ))}
                </ol>
              ) : <EmptyState compact title="Aucune vente" />}
            </Panel>
            <Panel title="Ventes par marque">
              {isLoading ? <ChartFallback /> : d?.byBrand.length ? <Suspense fallback={<ChartFallback />}><Charts.HBar data={d.byBrand} dataKey="revenue" money /></Suspense> : <EmptyState compact title="Aucune vente" />}
            </Panel>
            <Panel title="Ventes par puissance" description="Pour décider quoi réapprovisionner">
              {isLoading ? <ChartFallback /> : d?.byPower.length ? <Suspense fallback={<ChartFallback />}><Charts.Column data={d.byPower} dataKey="units" /></Suspense> : <EmptyState compact title="Aucune vente" />}
            </Panel>
          </div>

          {/* Row 4 */}
          <div className="grid gap-4 lg:grid-cols-3">
            <Panel className="lg:col-span-2" title="Ventes par wilaya" description="Top 15 · commandes de la boutique">
              {isLoading ? <SkeletonRows /> : d?.byWilaya.length ? (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[460px] text-sm">
                    <thead className="text-left text-xs uppercase tracking-wide text-muted-foreground"><tr><th className="pb-2 font-semibold">Wilaya</th><th className="pb-2 font-semibold">Commandes</th><th className="pb-2 text-right font-semibold">CA</th><th className="pb-2 text-right font-semibold">Retours</th></tr></thead>
                    <tbody>
                      {d.byWilaya.map((w) => {
                        const max = d.byWilaya[0].orders || 1;
                        return (
                          <tr key={w.name} className="border-t border-border">
                            <td className="py-2 pr-3 font-medium">{w.name}</td>
                            <td className="py-2 pr-3"><div className="flex items-center gap-2"><div className="h-1.5 w-24 overflow-hidden rounded-full bg-surface-2"><div className="h-full rounded-full bg-primary" style={{ width: `${(w.orders / max) * 100}%` }} /></div><span className="tabular-nums">{w.orders}</span></div></td>
                            <td className="py-2 text-right tabular-nums">{formatCompactDA(w.revenue)}</td>
                            <td className={cn('py-2 text-right tabular-nums', w.lost / w.orders > 0.25 && 'font-semibold text-destructive')}>{pct((w.lost / w.orders) * 100)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : <EmptyState compact title="Aucune commande web" />}
            </Panel>
            <Panel title="Mode de livraison">
              {isLoading ? <SkeletonRows rows={2} /> : d && d.delivery.some((x) => x.value) ? (
                <div className="space-y-4">
                  {d.delivery.map((x, i) => {
                    const total = d.delivery.reduce((s, y) => s + y.value, 0) || 1;
                    return (
                      <div key={x.name}>
                        <div className="mb-1 flex justify-between text-sm"><span className="flex items-center gap-2"><Truck className="h-4 w-4" />{x.name}</span><span className="font-semibold tabular-nums">{x.value} · {Math.round((x.value / total) * 100)}%</span></div>
                        <div className="h-2.5 overflow-hidden rounded-full bg-surface-2"><div className={cn('h-full rounded-full', i ? 'bg-electric' : 'bg-primary')} style={{ width: `${(x.value / total) * 100}%` }} /></div>
                      </div>
                    );
                  })}
                  <p className="text-xs text-muted-foreground">Délai moyen de livraison : non disponible (les dates de livraison ne sont pas enregistrées).</p>
                </div>
              ) : <EmptyState compact icon={Truck} title="Aucune livraison" />}
            </Panel>
          </div>

          {/* Row 5 — action lists */}
          <div className="grid gap-4 lg:grid-cols-2">
            <Panel title="Commandes à confirmer" actions={<Button variant="ghost" size="sm" onClick={() => navigate('/commands')}>Tout voir</Button>}>
              {isLoading ? <SkeletonRows /> : d?.pendingOrders.length ? (
                <ul className="divide-y divide-border">
                  {d.pendingOrders.map((o) => (
                    <li key={o.id} className="flex flex-wrap items-center gap-3 py-2.5">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">{o.customer_name} <span className="font-mono text-xs font-normal text-muted-foreground">#{o.id.slice(0, 8).toUpperCase()}</span></p>
                        <p className="text-xs text-muted-foreground">{o.customer_wilaya || '—'} · <span className="tabular-nums">{formatDA(o.total_price)}</span> · {formatDistanceToNowStrict(new Date(o.created_at), { locale: fr, addSuffix: true })}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" asChild className="h-9 w-9"><a href={`tel:${o.customer_phone}`} aria-label={`Appeler ${o.customer_name}`}><Phone className="h-4 w-4" /></a></Button>
                        <Button variant="ghost" size="icon" asChild className="h-9 w-9"><a href={waLink(o.customer_phone)} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp"><MessageCircle className="h-4 w-4" /></a></Button>
                        <Button size="sm" className="h-9 bg-volt text-volt-foreground hover:bg-volt/90" onClick={() => act(o.id, 'confirm')}><Check className="h-4 w-4" /> Confirmer</Button>
                        <Button variant="ghost" size="icon" className="h-9 w-9 text-destructive" onClick={() => setCancelId(o.id)} aria-label="Annuler la commande"><X className="h-4 w-4" /></Button>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : <EmptyState compact icon={BadgeCheck} title="Tout est confirmé" text="Aucune nouvelle commande en attente." />}
            </Panel>

            <Panel title="Alertes de stock" description="Produits au niveau ou sous leur seuil" actions={<Button variant="ghost" size="sm" onClick={() => navigate('/purchase-invoices')}>Réapprovisionner</Button>}>
              {isLoading ? <SkeletonRows /> : d?.stock.alerts.length ? (
                <ul className="divide-y divide-border">
                  {d.stock.alerts.slice(0, 8).map((p) => (
                    <li key={p.id} className="flex items-center gap-3 py-2.5">
                      <AlertTriangle className={cn('h-4 w-4 shrink-0', p.stock <= 0 ? 'text-destructive' : 'text-warning')} />
                      <span className="min-w-0 flex-1 truncate text-sm font-medium">{p.name}</span>
                      <span className="text-xs tabular-nums text-muted-foreground">{p.stock}/{p.threshold}{p.daysLeft !== null && ` · ~${p.daysLeft} j`}</span>
                    </li>
                  ))}
                </ul>
              ) : <EmptyState compact icon={Warehouse} title="Aucune alerte" text="Définissez un « stock minimal » sur vos produits pour recevoir des alertes." />}
            </Panel>

            <Panel title="Produits sans ventes" description="Aucune vente sur les 30 derniers jours">
              {isLoading ? <SkeletonRows /> : d?.stock.dead.length ? (
                <ul className="max-h-72 divide-y divide-border overflow-y-auto">
                  {d.stock.dead.slice(0, 20).map((p) => (
                    <li key={p.id} className="flex items-center gap-3 py-2">
                      <Dead className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <span className="min-w-0 flex-1 truncate text-sm">{p.name}</span>
                      <span className="text-xs tabular-nums text-muted-foreground">{formatDA(p.price)}</span>
                    </li>
                  ))}
                </ul>
              ) : <EmptyState compact title="Tous vos produits se vendent" />}
            </Panel>

            <Panel title="Dernières activités">
              {isLoading ? <SkeletonRows /> : d?.activity.length ? (
                <ul className="space-y-3">
                  {d.activity.map((a) => (
                    <li key={a.id} className="flex items-center gap-3">
                      <span className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-lg', a.kind === 'order' ? 'bg-electric/10 text-electric' : a.kind === 'sale' ? 'bg-success/15 text-success' : 'bg-volt-soft')}>
                        {a.kind === 'order' ? <PackageCheck className="h-4 w-4" /> : a.kind === 'sale' ? <ScanLine className="h-4 w-4" /> : <Star className="h-4 w-4" />}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm">{a.text}</span>
                        <span className="block text-xs text-muted-foreground">{formatDistanceToNowStrict(new Date(a.at), { locale: fr, addSuffix: true })}{a.sub && ` · ${a.sub}`}</span>
                      </span>
                      {a.status && <StatusBadge status={a.status} />}
                      {a.amount > 0 && <span className="text-sm font-semibold tabular-nums">{formatCompactDA(a.amount)}</span>}
                    </li>
                  ))}
                </ul>
              ) : <EmptyState compact title="Aucune activité récente" />}
            </Panel>
          </div>
        </>
      )}

      <ConfirmDialog open={!!cancelId} onOpenChange={(o) => !o && setCancelId(null)} title="Annuler cette commande ?" description="Le client ne sera pas livré. Cette action est visible dans l'historique de la commande."
        confirmLabel="Annuler la commande" destructive onConfirm={() => { if (cancelId) act(cancelId, 'cancel'); setCancelId(null); }} />
    </div>
  );
}
