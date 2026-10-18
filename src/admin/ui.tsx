import * as React from 'react';
import { ArrowDownRight, ArrowUpRight, ChevronDown, ChevronUp, ChevronsUpDown, Download, Inbox, Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';

/* ---------------- Money ---------------- */
const nf = new Intl.NumberFormat('fr-DZ', { maximumFractionDigits: 0 });
export const formatDA = (v: number | null | undefined) => `${nf.format(Math.round(Number(v) || 0)).replace(/\u202f|\u00a0/g, ' ')} DA`;
/** 1 250 000 → "1,3 M DA", 850 000 → "850 k DA" (charts / KPI) */
export const formatCompactDA = (v: number) => {
  const a = Math.abs(v);
  if (a >= 1_000_000) return `${(v / 1_000_000).toLocaleString('fr-FR', { maximumFractionDigits: 1 })} M DA`;
  if (a >= 10_000) return `${Math.round(v / 1000).toLocaleString('fr-FR')} k DA`;
  return formatDA(v);
};
export const MoneyText = ({ value, className, compact }: { value: number | null | undefined; className?: string; compact?: boolean }) => (
  <span className={cn('tabular-nums', className)}>{compact ? formatCompactDA(Number(value) || 0) : formatDA(value)}</span>
);

/* ---------------- Page header ---------------- */
export function PageHeader({ title, description, actions, className }: { title: string; description?: string; actions?: React.ReactNode; className?: string }) {
  return (
    <div className={cn('mb-6 flex flex-wrap items-end justify-between gap-4', className)}>
      <div className="min-w-0">
        <h1 className="text-2xl font-bold tracking-tight md:text-[28px]">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

/* ---------------- Cards ---------------- */
export const Panel = ({ title, description, actions, children, className, bodyClassName }: {
  title?: React.ReactNode; description?: string; actions?: React.ReactNode; children: React.ReactNode; className?: string; bodyClassName?: string;
}) => (
  <section className={cn('rounded-2xl border border-border bg-card shadow-sm', className)}>
    {(title || actions) && (
      <header className="flex flex-wrap items-start justify-between gap-3 px-5 pt-5">
        <div>
          {title && <h2 className="text-base font-semibold" style={{ fontFamily: 'Inter, sans-serif', letterSpacing: 0 }}>{title}</h2>}
          {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
        </div>
        {actions}
      </header>
    )}
    <div className={cn('p-5', bodyClassName)}>{children}</div>
  </section>
);

export function StatCard({ label, value, delta, hint, icon: Icon, spark, loading, invertDelta }: {
  label: string; value: React.ReactNode; delta?: number | null; hint?: React.ReactNode; icon?: React.ElementType; spark?: number[]; loading?: boolean; invertDelta?: boolean;
}) {
  const up = (delta ?? 0) >= 0;
  const good = invertDelta ? !up : up;
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-sm md:p-5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[13px] font-medium text-muted-foreground">{label}</span>
        {Icon && <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface-2"><Icon className="h-4 w-4" /></span>}
      </div>
      {loading ? (
        <div className="mt-3 space-y-2"><div className="h-7 w-2/3 animate-pulse rounded bg-muted" /><div className="h-4 w-1/3 animate-pulse rounded bg-muted" /></div>
      ) : (
        <>
          <div className="mt-2 font-sora text-[22px] font-bold tabular-nums leading-tight md:text-2xl">{value}</div>
          <div className="mt-2 flex items-end justify-between gap-2">
            <div className="min-w-0 text-xs">
              {delta !== undefined && delta !== null && Number.isFinite(delta) ? (
                <span className={cn('inline-flex items-center gap-0.5 font-semibold tabular-nums', good ? 'text-success' : 'text-destructive')}>
                  {up ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}{Math.abs(delta).toLocaleString('fr-FR', { maximumFractionDigits: 1 })}%
                </span>
              ) : delta === null ? <span className="text-muted-foreground">—</span> : null}
              {hint && <span className="ms-1.5 text-muted-foreground">{hint}</span>}
            </div>
            {spark && spark.length > 1 && <Sparkline data={spark} />}
          </div>
        </>
      )}
    </div>
  );
}

export function Sparkline({ data, className }: { data: number[]; className?: string }) {
  const max = Math.max(...data, 1), min = Math.min(...data, 0);
  const w = 72, h = 24;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / (max - min || 1)) * h}`).join(' ');
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className={cn('h-6 w-[72px] shrink-0 overflow-visible text-electric', className)} aria-hidden>
      <polyline points={pts} fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

/* ---------------- Badges ---------------- */
export const ORDER_STATUS: Record<string, { label: string; cls: string }> = {
  pending: { label: 'Nouvelle', cls: 'bg-electric/10 text-electric' },
  waiting: { label: 'En attente', cls: 'bg-warning/15 text-warning' },
  confirmed: { label: 'Confirmée', cls: 'bg-volt text-volt-foreground' },
  on_delivery: { label: 'Expédiée', cls: 'bg-electric/10 text-electric ring-1 ring-electric/30' },
  delivered: { label: 'Livrée', cls: 'bg-success/15 text-success' },
  returned: { label: 'Retournée', cls: 'bg-destructive/10 text-destructive' },
  cancelled: { label: 'Annulée', cls: 'bg-destructive/10 text-destructive' },
};
export const StatusBadge = ({ status }: { status: string }) => {
  const s = ORDER_STATUS[status] || { label: status, cls: 'bg-muted text-muted-foreground' };
  return <span className={cn('inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold', s.cls)}>{s.label}</span>;
};
export const StockBadge = ({ qty, threshold = 0 }: { qty: number; threshold?: number }) => {
  if (qty <= 0) return <span className="rounded-full bg-destructive/10 px-2.5 py-0.5 text-xs font-semibold text-destructive">Rupture</span>;
  if (threshold > 0 && qty <= threshold) return <span className="rounded-full bg-warning/15 px-2.5 py-0.5 text-xs font-semibold text-warning">Faible</span>;
  return <span className="rounded-full bg-success/15 px-2.5 py-0.5 text-xs font-semibold text-success">En stock</span>;
};

/* ---------------- Empty / error / skeleton ---------------- */
export const EmptyState = ({ icon: Icon = Inbox, title, text, action, compact }: { icon?: React.ElementType; title: string; text?: string; action?: React.ReactNode; compact?: boolean }) => (
  <div className={cn('flex flex-col items-center justify-center text-center', compact ? 'py-8' : 'py-14')}>
    <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-volt-soft"><Icon className="h-5 w-5" /></div>
    <p className="text-sm font-semibold">{title}</p>
    {text && <p className="mt-1 max-w-sm text-xs text-muted-foreground">{text}</p>}
    {action && <div className="mt-4">{action}</div>}
  </div>
);
export const ErrorState = ({ onRetry }: { onRetry?: () => void }) => (
  <div className="flex flex-col items-center py-10 text-center">
    <p className="text-sm font-semibold text-destructive">Impossible de charger les données</p>
    {onRetry && <Button variant="outline" size="sm" className="mt-3" onClick={onRetry}>Réessayer</Button>}
  </div>
);
export const SkeletonRows = ({ rows = 5 }: { rows?: number }) => (
  <div className="space-y-2">{Array.from({ length: rows }).map((_, i) => <div key={i} className="h-10 animate-pulse rounded-lg bg-muted" />)}</div>
);

/* ---------------- Confirm dialog ---------------- */
export function ConfirmDialog({ open, onOpenChange, title, description, confirmLabel = 'Confirmer', destructive, onConfirm }: {
  open: boolean; onOpenChange: (o: boolean) => void; title: string; description?: string; confirmLabel?: string; destructive?: boolean; onConfirm: () => void;
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          {description && <AlertDialogDescription>{description}</AlertDialogDescription>}
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Annuler</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} className={destructive ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90' : ''}>{confirmLabel}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

/* ---------------- Filter bar ---------------- */
export function FilterBar({ search, onSearch, placeholder = 'Rechercher…', chips, onReset, children }: {
  search: string; onSearch: (v: string) => void; placeholder?: string; chips?: { label: string; onRemove: () => void }[]; onReset?: () => void; children?: React.ReactNode;
}) {
  return (
    <div className="mb-4 space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input value={search} onChange={(e) => onSearch(e.target.value)} placeholder={placeholder} aria-label={placeholder}
            className="h-10 w-full rounded-[10px] border border-input bg-card pl-9 pr-3 text-base focus:border-electric focus:outline-none focus:ring-2 focus:ring-electric/25 md:text-sm" />
        </div>
        {children}
      </div>
      {chips && chips.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {chips.map((c) => (
            <button key={c.label} onClick={c.onRemove} className="inline-flex h-7 items-center gap-1 rounded-full bg-volt-soft px-2.5 text-xs font-medium">{c.label}<X className="h-3 w-3" /></button>
          ))}
          {onReset && <button onClick={onReset} className="text-xs font-semibold text-electric hover:underline">Réinitialiser</button>}
        </div>
      )}
    </div>
  );
}

/* ---------------- Data table ---------------- */
export interface Column<T> {
  key: string;
  header: string;
  cell: (row: T) => React.ReactNode;
  sortValue?: (row: T) => string | number;
  csv?: (row: T) => string | number;
  className?: string;
  /** Hidden in the mobile card view */
  hideOnMobile?: boolean;
}

export function DataTable<T extends { id: string }>({
  rows, columns, loading, pageSize = 20, onRowClick, selectable, bulkActions, empty, csvName, mobileTitle,
}: {
  rows: T[]; columns: Column<T>[]; loading?: boolean; pageSize?: number; onRowClick?: (r: T) => void;
  selectable?: boolean; bulkActions?: (selected: T[], clear: () => void) => React.ReactNode; empty?: React.ReactNode; csvName?: string;
  mobileTitle?: (r: T) => React.ReactNode;
}) {
  const [sort, setSort] = React.useState<{ key: string; dir: 1 | -1 } | null>(null);
  const [page, setPage] = React.useState(0);
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  React.useEffect(() => setPage(0), [rows.length]);

  const sorted = React.useMemo(() => {
    if (!sort) return rows;
    const col = columns.find((c) => c.key === sort.key);
    if (!col?.sortValue) return rows;
    return [...rows].sort((a, b) => {
      const va = col.sortValue!(a), vb = col.sortValue!(b);
      return (va > vb ? 1 : va < vb ? -1 : 0) * sort.dir;
    });
  }, [rows, sort, columns]);

  const pages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const view = sorted.slice(page * pageSize, page * pageSize + pageSize);
  const selRows = rows.filter((r) => selected.has(r.id));
  const allOnPage = view.length > 0 && view.every((r) => selected.has(r.id));

  const exportCsv = () => {
    const cols = columns.filter((c) => c.csv);
    const esc = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const lines = [cols.map((c) => esc(c.header)).join(';'), ...sorted.map((r) => cols.map((c) => esc(c.csv!(r))).join(';'))];
    const blob = new Blob(['﻿' + lines.join('\n')], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${csvName || 'export'}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  if (loading) return <SkeletonRows rows={6} />;
  if (!rows.length) return <>{empty || <EmptyState title="Aucun élément" />}</>;

  return (
    <div>
      {(selectable && selRows.length > 0) || csvName ? (
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-sm">
            {selectable && selRows.length > 0 && (<><span className="font-medium tabular-nums">{selRows.length} sélectionné(s)</span>{bulkActions?.(selRows, () => setSelected(new Set()))}</>)}
          </div>
          {csvName && <Button variant="outline" size="sm" onClick={exportCsv}><Download className="h-4 w-4" /> Export CSV</Button>}
        </div>
      ) : null}

      {/* Desktop table */}
      <div className="hidden overflow-auto rounded-xl border border-border md:block">
        <table className="w-full text-sm">
          <thead className="sticky top-0 z-[1] bg-surface-2 text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              {selectable && (
                <th className="w-10 px-3 py-2.5">
                  <input type="checkbox" aria-label="Tout sélectionner" checked={allOnPage} onChange={() => {
                    const next = new Set(selected);
                    view.forEach((r) => (allOnPage ? next.delete(r.id) : next.add(r.id)));
                    setSelected(next);
                  }} className="h-4 w-4 accent-[hsl(var(--primary))]" />
                </th>
              )}
              {columns.map((c) => (
                <th key={c.key} className={cn('px-3 py-2.5 text-left font-semibold', c.className)}>
                  {c.sortValue ? (
                    <button className="inline-flex items-center gap-1 hover:text-foreground" onClick={() => setSort((s) => (s?.key === c.key ? (s.dir === 1 ? { key: c.key, dir: -1 } : null) : { key: c.key, dir: 1 }))}>
                      {c.header}
                      {sort?.key === c.key ? (sort.dir === 1 ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />) : <ChevronsUpDown className="h-3.5 w-3.5 opacity-50" />}
                    </button>
                  ) : c.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {view.map((r) => (
              <tr key={r.id} onClick={onRowClick ? () => onRowClick(r) : undefined} className={cn('border-t border-border bg-card transition-colors', onRowClick && 'cursor-pointer hover:bg-surface-2/60')}>
                {selectable && (
                  <td className="px-3 py-2.5" onClick={(e) => e.stopPropagation()}>
                    <input type="checkbox" aria-label="Sélectionner" checked={selected.has(r.id)} onChange={() => {
                      const next = new Set(selected); if (next.has(r.id)) next.delete(r.id); else next.add(r.id); setSelected(next);
                    }} className="h-4 w-4 accent-[hsl(var(--primary))]" />
                  </td>
                )}
                {columns.map((c) => <td key={c.key} className={cn('px-3 py-2.5 align-middle', c.className)}>{c.cell(r)}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <ul className="space-y-2 md:hidden">
        {view.map((r) => (
          <li key={r.id} onClick={onRowClick ? () => onRowClick(r) : undefined} className={cn('rounded-xl border border-border bg-card p-3', onRowClick && 'cursor-pointer active:bg-surface-2')}>
            {mobileTitle && <div className="mb-2 font-semibold">{mobileTitle(r)}</div>}
            <dl className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-sm">
              {columns.filter((c) => !c.hideOnMobile).map((c) => (
                <div key={c.key} className="min-w-0"><dt className="text-[11px] uppercase tracking-wide text-muted-foreground">{c.header}</dt><dd className="truncate">{c.cell(r)}</dd></div>
              ))}
            </dl>
          </li>
        ))}
      </ul>

      {pages > 1 && (
        <div className="mt-3 flex items-center justify-between text-sm">
          <span className="text-muted-foreground tabular-nums">{page * pageSize + 1}–{Math.min(sorted.length, (page + 1) * pageSize)} sur {sorted.length}</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>Précédent</Button>
            <Button variant="outline" size="sm" disabled={page >= pages - 1} onClick={() => setPage((p) => p + 1)}>Suivant</Button>
          </div>
        </div>
      )}
    </div>
  );
}
