import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Zap, X, LogOut, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { getWebsiteSettingsREST } from '@/lib/supabaseClient';
import { ADMIN_NAV } from '@/admin/nav';
import { useAdminAlerts } from '@/admin/alerts';

interface SidebarProps {
  /** Present when rendered as the mobile drawer. */
  onClose?: () => void;
}

export const Sidebar = ({ onClose }: SidebarProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isRTL } = useLanguage();
  const { user, logout } = useAuth();
  const { data: alerts } = useAdminAlerts();
  const [storeName, setStoreName] = useState('M NEXT');
  const [storeLogoUrl, setStoreLogoUrl] = useState<string | null>(null);

  useEffect(() => {
    getWebsiteSettingsREST().then((s) => {
      if (s?.store_name) setStoreName(String(s.store_name).trim());
      if (s?.logo_url) setStoreLogoUrl(s.logo_url);
    }).catch(() => {});
  }, []);

  const badges = { pendingOrders: alerts?.pendingOrders.length || 0, lowStock: alerts?.lowStock.length || 0 };
  const isActive = (href: string) => location.pathname === href || location.pathname.startsWith(href + '/');
  const initials = (user?.name || user?.username || 'U').split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <aside className={cn('flex h-full w-[248px] max-w-full flex-col bg-sidebar text-sidebar-foreground', isRTL ? 'border-l border-sidebar-border' : 'border-r border-sidebar-border')}>
      {/* Brand */}
      <div className={cn('flex h-16 shrink-0 items-center gap-2.5 px-4', isRTL && 'flex-row-reverse')}>
        <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-[10px] bg-primary">
          {storeLogoUrl ? <img src={storeLogoUrl} alt="" className="h-full w-full object-cover" /> : <Zap className="h-5 w-5 text-volt" fill="currentColor" />}
        </div>
        <div className={cn('min-w-0 flex-1', isRTL && 'text-right')}>
          <p className="truncate font-sora text-[15px] font-bold leading-tight">{storeName}</p>
          <p className="truncate text-[11px] text-muted-foreground">Administration</p>
        </div>
        {onClose && (
          <button onClick={onClose} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] text-muted-foreground hover:bg-sidebar-accent hover:text-foreground" aria-label="Fermer le menu">
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="custom-scrollbar flex-1 space-y-5 overflow-y-auto px-3 py-3" aria-label="Navigation administration">
        {ADMIN_NAV.map((group) => (
          <div key={group.label}>
            <p className={cn('mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground', isRTL && 'text-right')}>{group.label}</p>
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const active = isActive(item.href);
                const Icon = item.icon;
                const count = item.badge ? badges[item.badge] : 0;
                return (
                  <li key={item.href}>
                    <NavLink
                      to={item.href}
                      aria-current={active ? 'page' : undefined}
                      className={cn(
                        'group relative flex h-10 items-center gap-3 rounded-[10px] px-3 text-sm font-medium transition-colors duration-150',
                        isRTL && 'flex-row-reverse',
                        active ? 'bg-volt-soft text-foreground' : 'text-muted-foreground hover:bg-sidebar-accent hover:text-foreground',
                      )}
                    >
                      {active && <span className={cn('absolute bottom-2 top-2 w-[3px] rounded-full bg-volt', isRTL ? 'right-0' : 'left-0')} aria-hidden />}
                      <Icon className="h-[18px] w-[18px] shrink-0" strokeWidth={active ? 2.25 : 1.9} />
                      <span className={cn('flex-1 truncate', isRTL && 'text-right')}>{item.title}</span>
                      {count > 0 && (
                        <span className={cn('min-w-[22px] rounded-full px-1.5 text-center text-[11px] font-bold leading-5 tabular-nums',
                          item.badge === 'lowStock' ? 'bg-warning/15 text-warning' : 'bg-primary text-primary-foreground')}>
                          {count > 99 ? '99+' : count}
                        </span>
                      )}
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t border-sidebar-border p-3">
        <a href="/website-shop" target="_blank" rel="noopener noreferrer" className="mb-2 flex h-9 items-center gap-2 rounded-[10px] px-3 text-sm font-medium text-muted-foreground hover:bg-sidebar-accent hover:text-foreground">
          <ExternalLink className="h-4 w-4" /> Voir la boutique
        </a>
        <div className={cn('flex items-center gap-2.5 rounded-xl bg-sidebar-accent p-2', isRTL && 'flex-row-reverse')}>
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-volt text-sm font-bold text-volt-foreground">{initials}</div>
          <div className={cn('min-w-0 flex-1', isRTL && 'text-right')}>
            <p className="truncate text-sm font-semibold">{user?.name || 'Utilisateur'}</p>
            <p className="truncate text-[11px] text-muted-foreground">{user?.role === 'manager' ? 'Gérant' : user?.role === 'employee' ? 'Employé' : 'Administrateur'}</p>
          </div>
          <button onClick={async () => { await logout(); navigate('/login', { replace: true }); }} className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-card hover:text-destructive" aria-label="Se déconnecter">
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
