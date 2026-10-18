import { NavLink, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Boxes, UsersRound, Truck, Receipt, Store, LineChart, PackageCheck,
  Globe2, ScanLine, Wallet, Barcode, Settings2, Zap, Crown, UserRound, type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { getWebsiteSettingsREST } from '@/lib/supabaseClient';

interface SidebarProps {
  isOpen: boolean;
}

type NavItem = { title: string; href: string; icon: LucideIcon };

export const Sidebar = ({ isOpen }: SidebarProps) => {
  const location = useLocation();
  const { t, isRTL } = useLanguage();
  const { user } = useAuth();

  const [storeName, setStoreName] = useState('Chargers');
  const [storeDisplayName, setStoreDisplayName] = useState('Chargers');
  const [storeLogoUrl, setStoreLogoUrl] = useState<string | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const settings = await getWebsiteSettingsREST();
        if (settings) {
          if (settings.store_name) {
            setStoreName(settings.store_name);
            setStoreDisplayName(settings.store_name);
          }
          if (settings.logo_url) {
            setStoreLogoUrl(settings.logo_url);
          }
        }
      } catch (error) {
        console.error('Error fetching website settings:', error);
        // Fallback to defaults
        const localStoreName = localStorage.getItem('storeName');
        const localDisplayName = localStorage.getItem('storeDisplayName');
        const localLogoData = localStorage.getItem('storeLogoData');

        if (localStoreName) setStoreName(localStoreName);
        if (localDisplayName) setStoreDisplayName(localDisplayName);
        if (localLogoData) setStoreLogoUrl(localLogoData);
      }
    };

    fetchSettings();
  }, []);

  const navigationItems: NavItem[] = [
    { title: t('nav.dashboard'), href: '/', icon: LayoutDashboard },
    { title: t('nav.inventory'), href: '/inventory', icon: Boxes },
    { title: 'Clients', href: '/clients', icon: UsersRound },
    { title: "Factures d'Achat", href: '/purchase-invoices', icon: Truck },
    { title: t('nav.sales'), href: '/sales', icon: Receipt },
    { title: t('nav.suppliers'), href: '/suppliers', icon: Store },
    { title: t('nav.reports'), href: '/reports', icon: LineChart },
    { title: 'Commandes', href: '/commands', icon: PackageCheck },
  ];

  const toolItems: NavItem[] = [
    { title: 'Gestion du Site', href: '/website', icon: Globe2 },
    { title: t('nav.pos'), href: '/pos', icon: ScanLine },
    { title: 'Caisse', href: '/caisse', icon: Wallet },
    { title: t('nav.barcodes'), href: '/barcodes', icon: Barcode },
    { title: t('nav.settings'), href: '/settings', icon: Settings2 },
  ];

  const isActiveRoute = (href: string) => {
    if (href === '/') return location.pathname === '/';
    return location.pathname.startsWith(href);
  };

  const initials = (user?.name || user?.username || 'U')
    .split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  const renderSection = (label: string, items: NavItem[], offset: number) => (
    <div className="space-y-1">
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.p
            initial={{ opacity: 0, x: isRTL ? 8 : -8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className={cn('px-3 pb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-sidebar-foreground/50', isRTL && 'text-right')}
          >
            {label}
          </motion.p>
        )}
      </AnimatePresence>
      {items.map((item, index) => {
        const isActive = isActiveRoute(item.href);
        const Icon = item.icon;
        return (
          <motion.div
            key={item.href}
            initial={{ opacity: 0, x: isRTL ? 12 : -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: (index + offset) * 0.03, type: 'spring', stiffness: 400, damping: 32 }}
          >
            <NavLink
              to={item.href}
              title={!isOpen ? item.title : undefined}
              aria-label={item.title}
              className={cn(
                'group relative flex h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium outline-none transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-sidebar-ring',
                isRTL && 'flex-row-reverse',
                !isOpen && 'justify-center px-0',
                isActive
                  ? 'text-white'
                  : 'text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
              )}
            >
              {isActive && (
                <motion.span
                  layoutId="sidebar-active"
                  className="absolute inset-0 rounded-xl bg-gradient-primary shadow-primary"
                  transition={{ type: 'spring', stiffness: 500, damping: 38 }}
                />
              )}
              <Icon className="relative z-10 h-[18px] w-[18px] shrink-0 transition-transform duration-200 group-hover:scale-110" strokeWidth={2} />
              {isOpen && (
                <span className={cn('relative z-10 flex-1 truncate', isRTL && 'text-right')}>{item.title}</span>
              )}
            </NavLink>
          </motion.div>
        );
      })}
    </div>
  );

  return (
    <motion.aside
      initial={false}
      animate={{ width: isOpen ? 272 : 80 }}
      transition={{ type: 'spring', stiffness: 320, damping: 34 }}
      className={cn(
        'relative z-20 flex shrink-0 flex-col overflow-hidden bg-sidebar text-sidebar-foreground',
        isRTL ? 'border-l border-sidebar-border' : 'border-r border-sidebar-border'
      )}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-48 bg-[radial-gradient(ellipse_at_top,hsl(var(--primary)/0.28),transparent_70%)]" />

      {/* Brand */}
      <div className={cn('relative flex h-[72px] items-center gap-3 px-5', isRTL && 'flex-row-reverse', !isOpen && 'justify-center px-0')}>
        <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-primary shadow-primary ring-1 ring-white/10">
          {storeLogoUrl ? (
            <img src={storeLogoUrl} alt="Logo" className="h-full w-full object-cover" />
          ) : (
            <Zap className="h-5 w-5 text-white" fill="currentColor" />
          )}
        </div>
        <AnimatePresence initial={false}>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, x: isRTL ? 10 : -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: isRTL ? 10 : -10 }}
              transition={{ duration: 0.2 }}
              className={cn('min-w-0', isRTL && 'text-right')}
            >
              <h1 className="truncate font-display text-lg font-bold leading-tight text-white">{storeDisplayName || storeName}</h1>
              <p className="truncate text-xs text-sidebar-foreground/55">Admin console</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <nav className="custom-scrollbar relative flex-1 space-y-6 overflow-y-auto px-3 py-4">
        {renderSection('Navigation', navigationItems, 0)}
        <div className="mx-3 h-px bg-sidebar-border" />
        {renderSection('Tools', toolItems, navigationItems.length)}
      </nav>

      {/* User */}
      <div className="relative border-t border-sidebar-border p-3">
        <div className={cn('flex items-center gap-3 rounded-xl bg-sidebar-accent/60 p-2.5', isRTL && 'flex-row-reverse', !isOpen && 'justify-center bg-transparent p-0')}>
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-accent text-sm font-bold text-white">
            {initials}
          </div>
          {isOpen && (
            <div className={cn('min-w-0 flex-1', isRTL && 'text-right')}>
              <p className="truncate text-sm font-semibold text-white">{user?.name || user?.username || 'User'}</p>
              <p className={cn('flex items-center gap-1 text-xs text-sidebar-foreground/60', isRTL && 'flex-row-reverse')}>
                {user?.role === 'admin' ? <Crown className="h-3 w-3 text-amber-400" /> : <UserRound className="h-3 w-3" />}
                {user?.role === 'admin' ? 'Admin' : 'User'}
              </p>
            </div>
          )}
        </div>
      </div>
    </motion.aside>
  );
};
