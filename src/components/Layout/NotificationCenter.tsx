import { useNavigate } from 'react-router-dom';
import { Bell, PackageCheck, AlertTriangle } from 'lucide-react';
import { formatDistanceToNowStrict } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useAdminAlerts } from '@/admin/alerts';
import { formatDA, EmptyState } from '@/admin/ui';

/** Real notifications: new website orders awaiting confirmation + low stock. */
export const NotificationCenter = () => {
  const navigate = useNavigate();
  const { data } = useAdminAlerts();
  const orders = data?.pendingOrders || [];
  const low = data?.lowStock || [];
  const total = orders.length + low.length;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative rounded-[10px]" aria-label={`Notifications${total ? `, ${total} nouvelles` : ''}`}>
          <Bell className="h-5 w-5" />
          {total > 0 && <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-volt px-1 text-[10px] font-bold tabular-nums text-volt-foreground">{total > 9 ? '9+' : total}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[min(92vw,360px)] p-0">
        <div className="border-b border-border px-4 py-3"><p className="text-sm font-semibold">Notifications</p></div>
        <div className="max-h-[60vh] overflow-y-auto">
          {total === 0 ? <EmptyState compact title="Rien de nouveau" text="Les nouvelles commandes et les alertes de stock apparaîtront ici." /> : (
            <ul className="divide-y divide-border">
              {orders.slice(0, 8).map((o) => (
                <li key={o.id}>
                  <button onClick={() => navigate('/commands')} className="flex w-full gap-3 px-4 py-3 text-left hover:bg-surface-2">
                    <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-electric/10 text-electric"><PackageCheck className="h-4 w-4" /></span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">Nouvelle commande · {o.customer_name}</span>
                      <span className="block text-xs text-muted-foreground">{o.customer_wilaya || '—'} · <span className="tabular-nums">{formatDA(o.total_price)}</span> · {formatDistanceToNowStrict(new Date(o.created_at), { locale: fr, addSuffix: true })}</span>
                    </span>
                  </button>
                </li>
              ))}
              {low.slice(0, 6).map((p) => (
                <li key={p.id}>
                  <button onClick={() => navigate('/inventory')} className="flex w-full gap-3 px-4 py-3 text-left hover:bg-surface-2">
                    <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-warning/15 text-warning"><AlertTriangle className="h-4 w-4" /></span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">Stock faible · {p.name}</span>
                      <span className="block text-xs text-muted-foreground tabular-nums">{p.quantity_on_hand} en stock (seuil {p.threshold})</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};
