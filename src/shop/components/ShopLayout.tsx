import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import {
  Truck, Wallet, ShieldCheck, X, Search, Sun, Moon, ShoppingBag, MessageCircle, Home, Store, Zap,
  ChevronDown, Phone, Mail, MapPin, Clock, Facebook, Instagram, Minus, Plus, Trash2, Languages,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCatalog, usePacks, useStoreSettings, whatsappLink } from '../lib/catalog';
import { cart, useCart } from '../lib/cart';
import { formatDA } from '../lib/format';
import { initTracking, track } from '../lib/track';
import { storeConfig } from '../storeConfig';
import { useShopI18n } from '../i18n';
import { Button, ProductImage, btnClass } from './ui';
import { Drawer } from './ui';
import '../shop.css';

/* ---------- theme (storefront keeps its own preference, light by default) ---------- */
const THEME_KEY = 'shop:theme';
function useShopTheme() {
  const [dark, setDark] = useState(() => {
    try { return localStorage.getItem(THEME_KEY) === 'dark'; } catch { return false; }
  });
  useEffect(() => {
    const root = document.documentElement;
    const adminDark = root.classList.contains('dark');
    root.classList.toggle('dark', dark);
    try { localStorage.setItem(THEME_KEY, dark ? 'dark' : 'light'); } catch { /* ignore */ }
    return () => { root.classList.toggle('dark', adminDark); };
  }, [dark]);
  return [dark, () => setDark((d) => !d)] as const;
}

/* ---------- announcement bar ---------- */
function AnnouncementBar() {
  const [hidden, setHidden] = useState(() => { try { return sessionStorage.getItem('shop:announce') === '0'; } catch { return false; } });
  if (hidden) return null;
  return (
    <div className="relative bg-shop-primary text-shop-primary-fg">
      <div className="mx-auto flex h-9 max-w-[1280px] items-center justify-center gap-4 overflow-hidden px-10 text-xs font-medium sm:gap-6 sm:text-[13px]">
        <span className="inline-flex items-center gap-1.5 whitespace-nowrap"><Truck className="h-4 w-4 text-shop-volt" /> Livraison 69 wilayas</span>
        <span className="hidden items-center gap-1.5 whitespace-nowrap sm:inline-flex"><Wallet className="h-4 w-4 text-shop-volt" /> Paiement à la livraison</span>
        <span className="hidden items-center gap-1.5 whitespace-nowrap md:inline-flex"><ShieldCheck className="h-4 w-4 text-shop-volt" /> {storeConfig.guarantee.short}</span>
      </div>
      <button
        onClick={() => { setHidden(true); try { sessionStorage.setItem('shop:announce', '0'); } catch { /* ignore */ } }}
        className="absolute end-1 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center opacity-70 hover:opacity-100"
        aria-label="Masquer l'annonce"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

/* ---------- search with suggestions ---------- */
function SearchBox({ autoFocus, onDone, className }: { autoFocus?: boolean; onDone?: () => void; className?: string }) {
  const { t } = useShopI18n();
  const navigate = useNavigate();
  const { products } = useCatalog();
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const suggestions = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (s.length < 2) return [];
    const terms = s.split(/\s+/);
    return products.filter((p) => terms.every((tm) => p.searchText.includes(tm))).slice(0, 6);
  }, [q, products]);

  const submit = (e?: React.FormEvent) => {
    e?.preventDefault();
    const v = q.trim();
    track('search', { search_term: v });
    navigate(v ? `/website-shop/offers?q=${encodeURIComponent(v)}` : '/website-shop/offers');
    setOpen(false);
    onDone?.();
  };

  return (
    <form role="search" onSubmit={submit} className={cn('relative', className)}>
      <label htmlFor="shop-search" className="sr-only">Rechercher</label>
      <Search className="pointer-events-none absolute start-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-shop-muted" />
      <input
        id="shop-search"
        type="search"
        autoFocus={autoFocus}
        value={q}
        onChange={(e) => { setQ(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder={t('search.placeholder')}
        autoComplete="off"
        className="h-11 w-full rounded-[10px] border border-shop-border bg-shop-surface-2 pe-3 ps-10 text-[16px] text-shop-text placeholder:text-shop-muted focus:border-shop-electric focus:bg-shop-surface focus:outline-none focus:ring-2 focus:ring-shop-electric/25 md:text-sm"
      />
      {open && suggestions.length > 0 && (
        <ul className="shop-card absolute inset-x-0 top-[calc(100%+6px)] z-50 overflow-hidden p-1" role="listbox">
          {suggestions.map((p) => (
            <li key={p.id}>
              <Link
                to={`/website-shop/product/${p.slug}`}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => { setOpen(false); setQ(''); onDone?.(); }}
                className="flex items-center gap-3 rounded-[10px] p-2 hover:bg-shop-surface-2"
              >
                <span className="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-shop-surface-2"><ProductImage src={p.images[0]} alt="" className="p-1" /></span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{p.title}</span>
                  <span className="tabular block text-xs text-shop-muted">{p.price > 0 ? formatDA(p.price) : 'Prix sur demande'}</span>
                </span>
              </Link>
            </li>
          ))}
          <li>
            <button type="submit" onMouseDown={(e) => e.preventDefault()} className="w-full rounded-[10px] p-2 text-start text-sm font-semibold text-shop-electric hover:bg-shop-surface-2">
              Voir tous les résultats pour « {q} »
            </button>
          </li>
        </ul>
      )}
    </form>
  );
}

/* ---------- brand mega menu ---------- */
function MegaMenu({ onNavigate }: { onNavigate: () => void }) {
  const { products } = useCatalog();
  const counts = useMemo(() => {
    const m = new Map<string, { n: number; logo?: string }>();
    products.forEach((p) => { const c = m.get(p.brand) || { n: 0, logo: p.brandLogo }; c.n++; c.logo ||= p.brandLogo; m.set(p.brand, c); });
    return m;
  }, [products]);

  return (
    <div className="shop-card grid w-[min(92vw,880px)] grid-cols-[1.4fr_1fr_1fr] gap-6 p-6">
      <div>
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-shop-muted">Par marque</p>
        <div className="grid grid-cols-3 gap-2">
          {storeConfig.brands.map((b) => {
            const c = counts.get(b);
            return (
              <Link key={b} to={`/website-shop/offers?brand=${encodeURIComponent(b)}`} onClick={onNavigate}
                className="flex flex-col items-center gap-1 rounded-xl border border-shop-border p-3 text-center transition-colors hover:border-shop-text">
                {c?.logo ? <img src={c.logo} alt="" className="h-7 w-auto max-w-[72px] object-contain" loading="lazy" /> : <span className="font-sora text-sm font-bold">{b}</span>}
                <span className="text-[11px] text-shop-muted">{c?.n ?? 0} produit{(c?.n ?? 0) > 1 ? 's' : ''}</span>
              </Link>
            );
          })}
        </div>
      </div>
      <div>
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-shop-muted">Par connecteur</p>
        <ul className="space-y-1">
          {storeConfig.connectors.map((c) => (
            <li key={c}><Link to={`/website-shop/offers?connector=${encodeURIComponent(c)}`} onClick={onNavigate} className="block rounded-lg px-2 py-1.5 text-sm hover:bg-shop-surface-2">{c}</Link></li>
          ))}
        </ul>
      </div>
      <div>
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-shop-muted">Par puissance</p>
        <div className="flex flex-wrap gap-2">
          {[45, 65, 90, 135, 200].map((w) => (
            <Link key={w} to={w === 200 ? '/website-shop/offers?power=200&power=230&power=330' : `/website-shop/offers?power=${w}`} onClick={onNavigate} className="tabular rounded-full border border-shop-border px-3 py-1.5 text-sm font-medium hover:border-shop-text">
              {w === 200 ? '200W+' : `${w}W`}
            </Link>
          ))}
        </div>
        <Link to="/website-shop/offers" onClick={onNavigate} className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-shop-electric hover:underline">Tout le catalogue →</Link>
      </div>
    </div>
  );
}

/* ---------- cart drawer ---------- */
export function CartDrawer() {
  const { t } = useShopI18n();
  const navigate = useNavigate();
  const { items, subtotal, drawerOpen } = useCart();
  return (
    <Drawer
      open={drawerOpen}
      onOpenChange={(o) => (o ? cart.openDrawer() : cart.closeDrawer())}
      title={`${t('cart.title')} (${items.reduce((s, i) => s + i.quantity, 0)})`}
      footer={items.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm"><span className="text-shop-muted">{t('cart.subtotal')}</span><span className="tabular font-sora text-lg font-bold">{formatDA(subtotal)}</span></div>
          <p className="text-xs text-shop-muted">Frais de livraison calculés selon votre wilaya.</p>
          <Button variant="volt" size="lg" className="w-full" onClick={() => { cart.closeDrawer(); track('begin_checkout', { value: subtotal }); navigate('/website-shop/order'); }}>
            {t('cart.checkout')}
          </Button>
          <Button variant="ghost" className="w-full" onClick={() => cart.closeDrawer()}>Continuer mes achats</Button>
        </div>
      )}
    >
      {items.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-center">
          <ShoppingBag className="mb-3 h-10 w-10 text-shop-muted" strokeWidth={1.5} />
          <p className="font-semibold">{t('cart.empty')}</p>
          <Link to="/website-shop/offers" onClick={() => cart.closeDrawer()} className={btnClass('primary', 'md', 'mt-5')}>Voir la boutique</Link>
        </div>
      ) : (
        <ul className="divide-y divide-shop-border">
          {items.map((i) => (
            <li key={i.product_id + i.price} className="flex gap-3 py-4">
              <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-shop-surface-2"><ProductImage src={i.image} alt={i.name} className="p-2" /></div>
              <div className="min-w-0 flex-1">
                <p className="line-clamp-2 text-sm font-semibold">{i.name}</p>
                {i.product_description && <p className="tabular mt-0.5 truncate text-xs text-shop-muted">{i.product_description}</p>}
                <div className="mt-2 flex items-center justify-between gap-2">
                  <div className="inline-flex items-center rounded-[10px] border border-shop-border">
                    <button className="flex h-9 w-9 items-center justify-center disabled:opacity-40" onClick={() => cart.setQty(i.product_id, i.quantity - 1)} disabled={i.quantity <= 1} aria-label="Diminuer la quantité"><Minus className="h-4 w-4" /></button>
                    <span className="tabular w-7 text-center text-sm font-semibold" aria-live="polite">{i.quantity}</span>
                    <button className="flex h-9 w-9 items-center justify-center" onClick={() => cart.setQty(i.product_id, i.quantity + 1)} aria-label="Augmenter la quantité"><Plus className="h-4 w-4" /></button>
                  </div>
                  <span className="tabular text-sm font-bold">{formatDA(i.price * i.quantity)}</span>
                </div>
              </div>
              <button onClick={() => cart.remove(i.product_id)} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-shop-muted hover:bg-shop-surface-2 hover:text-shop-danger" aria-label={`Retirer ${i.name}`}>
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </Drawer>
  );
}

/* ---------- layout ---------- */
export function ShopLayout() {
  const { t, dir, lang, setLang } = useShopI18n();
  const location = useLocation();
  const reduce = useReducedMotion();
  const settings = useStoreSettings();
  const { packs } = usePacks();
  const { count } = useCart();
  const [dark, toggleDark] = useShopTheme();
  const [megaOpen, setMegaOpen] = useState(false);
  const [mobileSearch, setMobileSearch] = useState(false);
  const megaTimer = useRef<number>();

  useEffect(() => { initTracking(); }, []);
  useEffect(() => { window.scrollTo({ top: 0 }); setMegaOpen(false); setMobileSearch(false); }, [location.pathname]);

  const nav = [
    { to: '/website-shop', label: t('nav.home'), end: true },
    { to: '/website-shop/offers', label: t('nav.shop'), mega: true },
    { to: '/website-shop/special-offers', label: t('nav.promos') },
    ...(packs.length ? [{ to: '/website-shop/packages', label: t('nav.packs') }] : []),
    { to: '/website-shop/contacts', label: t('nav.contact') },
  ];
  const wa = whatsappLink(settings.whatsapp);

  return (
    <div className="shop-root flex min-h-dvh flex-col" dir={dir} lang={lang}>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:start-3 focus:top-3 focus:z-[100] focus:rounded-lg focus:bg-shop-surface focus:px-4 focus:py-2">Aller au contenu</a>
      <AnnouncementBar />

      <header className="sticky top-0 z-40 border-b border-shop-border bg-shop-surface/95 backdrop-blur supports-[backdrop-filter]:bg-shop-surface/85">
        <div className="mx-auto flex h-16 max-w-[1280px] items-center gap-3 px-4 md:gap-6">
          <Link to="/website-shop" className="flex shrink-0 items-center gap-2" aria-label={`${settings.name} — accueil`}>
            <span className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-[10px] bg-shop-primary">
              {settings.logoUrl ? <img src={settings.logoUrl} alt="" className="h-full w-full object-cover" /> : <Zap className="h-5 w-5 text-shop-volt" fill="currentColor" />}
            </span>
            <span className="font-sora text-lg font-bold tracking-tight">{settings.name}</span>
          </Link>

          <nav className="hidden items-center gap-1 lg:flex" aria-label="Navigation principale">
            {nav.map((n) => n.mega ? (
              <div key={n.to} className="relative"
                onMouseEnter={() => { clearTimeout(megaTimer.current); setMegaOpen(true); }}
                onMouseLeave={() => { megaTimer.current = window.setTimeout(() => setMegaOpen(false), 120); }}>
                <NavLink to={n.to} className={({ isActive }) => cn('inline-flex h-10 items-center gap-1 rounded-[10px] px-3 text-sm font-medium transition-colors hover:bg-shop-surface-2', isActive && 'font-semibold')}
                  aria-haspopup="true" aria-expanded={megaOpen} onFocus={() => setMegaOpen(true)}>
                  {n.label} <ChevronDown className={cn('h-4 w-4 transition-transform', megaOpen && 'rotate-180')} />
                </NavLink>
                <AnimatePresence>
                  {megaOpen && (
                    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4 }} transition={{ duration: 0.15 }}
                      className="absolute start-0 top-full z-50 pt-2" onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setMegaOpen(false); }}>
                      <MegaMenu onNavigate={() => setMegaOpen(false)} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <NavLink key={n.to} to={n.to} end={n.end} className={({ isActive }) => cn('relative inline-flex h-10 items-center rounded-[10px] px-3 text-sm font-medium transition-colors hover:bg-shop-surface-2', isActive && 'font-semibold after:absolute after:inset-x-3 after:bottom-1 after:h-0.5 after:rounded-full after:bg-shop-volt')}>
                {n.label}
              </NavLink>
            ))}
          </nav>

          <SearchBox className="ms-auto hidden w-full max-w-md md:block" />

          <div className="ms-auto flex items-center gap-1 md:ms-0">
            <button onClick={() => setMobileSearch(true)} className={btnClass('ghost', 'icon', 'md:hidden')} aria-label="Rechercher"><Search /></button>
            {storeConfig.features.arabic && (
              <button onClick={() => setLang(lang === 'fr' ? 'ar' : 'fr')} className={btnClass('ghost', 'icon')} aria-label="Changer de langue"><Languages /></button>
            )}
            <button onClick={toggleDark} className={btnClass('ghost', 'icon')} aria-label={dark ? 'Mode clair' : 'Mode sombre'}>{dark ? <Sun /> : <Moon />}</button>
            <a href={wa} target="_blank" rel="noopener noreferrer" onClick={() => track('contact_whatsapp')} className={btnClass('ghost', 'icon', 'hidden sm:inline-flex')} aria-label="WhatsApp"><MessageCircle /></a>
            <button onClick={() => cart.openDrawer()} className={btnClass('ghost', 'icon', 'relative')} aria-label={`Panier, ${count} article${count > 1 ? 's' : ''}`}>
              <ShoppingBag />
              {count > 0 && (
                <span className="tabular absolute end-1 top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-shop-volt px-1 text-[11px] font-bold text-shop-volt-ink">{count > 99 ? '99+' : count}</span>
              )}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {mobileSearch && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden border-t border-shop-border md:hidden">
              <div className="flex items-center gap-2 p-3">
                <SearchBox autoFocus onDone={() => setMobileSearch(false)} className="flex-1" />
                <button onClick={() => setMobileSearch(false)} className={btnClass('ghost', 'icon')} aria-label="Fermer la recherche"><X /></button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <main id="main" className="flex-1 pb-24 lg:pb-0">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={location.pathname}
            initial={reduce ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0, transition: { duration: 0.22, ease: 'easeOut' } }}
            exit={reduce ? undefined : { opacity: 0, transition: { duration: 0.12 } }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>

      <ShopFooter />

      {/* Floating WhatsApp (desktop) */}
      <a href={wa} target="_blank" rel="noopener noreferrer" onClick={() => track('contact_whatsapp')}
        className="fixed bottom-6 end-6 z-30 hidden h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition-transform hover:scale-105 lg:flex"
        aria-label="Discuter sur WhatsApp">
        <MessageCircle className="h-7 w-7" />
      </a>

      {/* Mobile bottom navigation */}
      <nav className="fixed inset-x-3 bottom-3 z-40 rounded-2xl border border-shop-border bg-shop-surface/95 shadow-lg backdrop-blur lg:hidden" style={{ marginBottom: 'env(safe-area-inset-bottom)' }} aria-label="Navigation mobile">
        <ul className="grid grid-cols-5">
          {[
            { to: '/website-shop', icon: Home, label: t('nav.home'), end: true },
            { to: '/website-shop/offers', icon: Store, label: t('nav.shop') },
          ].map((n) => (
            <li key={n.to}>
              <NavLink to={n.to} end={n.end} className={({ isActive }) => cn('relative flex h-14 flex-col items-center justify-center gap-0.5 text-[11px] font-medium', isActive ? 'text-shop-text' : 'text-shop-muted')}>
                {({ isActive }) => (<><n.icon className="h-5 w-5" strokeWidth={isActive ? 2.25 : 1.75} />{n.label}{isActive && <span className="absolute bottom-1.5 h-1 w-5 rounded-full bg-shop-volt" />}</>)}
              </NavLink>
            </li>
          ))}
          <li>
            <button onClick={() => setMobileSearch(true)} className="flex h-14 w-full flex-col items-center justify-center gap-0.5 text-[11px] font-medium text-shop-muted"><Search className="h-5 w-5" strokeWidth={1.75} />{t('nav.search')}</button>
          </li>
          <li>
            <button onClick={() => cart.openDrawer()} className="relative flex h-14 w-full flex-col items-center justify-center gap-0.5 text-[11px] font-medium text-shop-muted">
              <ShoppingBag className="h-5 w-5" strokeWidth={1.75} />{t('nav.cart')}
              {count > 0 && <span className="tabular absolute end-[22%] top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-shop-volt px-1 text-[10px] font-bold text-shop-volt-ink">{count}</span>}
            </button>
          </li>
          <li>
            <a href={wa} target="_blank" rel="noopener noreferrer" onClick={() => track('contact_whatsapp')} className="flex h-14 flex-col items-center justify-center gap-0.5 text-[11px] font-medium text-[#128C7E] dark:text-[#25D366]">
              <MessageCircle className="h-5 w-5" strokeWidth={1.75} />WhatsApp
            </a>
          </li>
        </ul>
      </nav>

      <CartDrawer />
    </div>
  );
}

/* ---------- footer ---------- */
function ShopFooter() {
  const s = useStoreSettings();
  const year = new Date().getFullYear();
  return (
    <footer className="mt-16 border-t border-shop-border bg-shop-surface">
      <div className="mx-auto grid max-w-[1280px] gap-10 px-4 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="mb-3 flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-shop-primary"><Zap className="h-5 w-5 text-shop-volt" fill="currentColor" /></span>
            <span className="font-sora text-lg font-bold">{s.name}</span>
          </div>
          <p className="text-sm text-shop-muted">Chargeurs originaux et testés pour PC portables. Livraison dans les 69 wilayas, paiement à la livraison.</p>
          <div className="mt-4 flex gap-2">
            {s.facebook && <a href={s.facebook} target="_blank" rel="noopener noreferrer" className={btnClass('outline', 'icon', 'h-10 w-10')} aria-label="Facebook"><Facebook /></a>}
            {s.instagram && <a href={s.instagram} target="_blank" rel="noopener noreferrer" className={btnClass('outline', 'icon', 'h-10 w-10')} aria-label="Instagram"><Instagram /></a>}
            <a href={whatsappLink(s.whatsapp)} target="_blank" rel="noopener noreferrer" className={btnClass('outline', 'icon', 'h-10 w-10')} aria-label="WhatsApp"><MessageCircle /></a>
          </div>
        </div>
        <div>
          <h3 className="mb-3 text-sm font-semibold" style={{ fontFamily: 'Inter, sans-serif' }}>Boutique</h3>
          <ul className="space-y-2 text-sm text-shop-muted">
            <li><Link className="hover:text-shop-text" to="/website-shop/offers">Tous les chargeurs</Link></li>
            <li><Link className="hover:text-shop-text" to="/website-shop/special-offers">Promotions</Link></li>
            <li><Link className="hover:text-shop-text" to="/website-shop/order">Mon panier</Link></li>
            <li><Link className="hover:text-shop-text" to="/website-shop/contacts">Contact & FAQ</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="mb-3 text-sm font-semibold" style={{ fontFamily: 'Inter, sans-serif' }}>Contact</h3>
          <ul className="space-y-2 text-sm text-shop-muted">
            <li><a className="inline-flex items-center gap-2 hover:text-shop-text" href={`tel:${s.phone.replace(/\s/g, '')}`}><Phone className="h-4 w-4" />{s.phone}</a></li>
            <li><a className="inline-flex items-center gap-2 hover:text-shop-text" href={`mailto:${s.email}`}><Mail className="h-4 w-4" />{s.email}</a></li>
            <li><a className="inline-flex items-center gap-2 hover:text-shop-text" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(storeConfig.contact.mapsQuery)}`} target="_blank" rel="noopener noreferrer"><MapPin className="h-4 w-4" />{s.address}</a></li>
            {storeConfig.contact.hours.map((h) => <li key={h.days} className="inline-flex w-full items-center gap-2"><Clock className="h-4 w-4" />{h.days} : {h.time}</li>)}
          </ul>
        </div>
        <div>
          <h3 className="mb-3 text-sm font-semibold" style={{ fontFamily: 'Inter, sans-serif' }}>Livraison & paiement</h3>
          <ul className="space-y-2 text-sm text-shop-muted">
            <li className="flex items-start gap-2"><Truck className="mt-0.5 h-4 w-4 shrink-0" />{storeConfig.delivery.delayText}, 69 wilayas</li>
            <li className="flex items-start gap-2"><Wallet className="mt-0.5 h-4 w-4 shrink-0" />Paiement à la livraison</li>
            <li className="flex items-start gap-2"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />{storeConfig.guarantee.short} · {storeConfig.delivery.exchangeText}</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-shop-border">
        <div className="mx-auto flex max-w-[1280px] flex-wrap items-center justify-between gap-2 px-4 py-4 text-xs text-shop-muted">
          <span>© {year} {s.name}. Tous droits réservés.</span>
          {storeConfig.features.showLoginInFooter && <Link to="/login" className="hover:text-shop-text">Espace pro</Link>}
        </div>
      </div>
    </footer>
  );
}
