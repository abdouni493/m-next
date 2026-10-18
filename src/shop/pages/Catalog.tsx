import { useEffect, useMemo, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { SlidersHorizontal, X, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCatalog, type ShopProduct } from '../lib/catalog';
import { formatDA } from '../lib/format';
import { track } from '../lib/track';
import { Seo, breadcrumbLd } from '../components/Seo';
import { ProductCard, ProductCardSkeleton } from '../components/ProductCard';
import { Button, Drawer, EmptyState, Select, btnClass, fieldCls } from '../components/ui';

const PAGE = 12;
type Sort = 'relevance' | 'price-asc' | 'price-desc' | 'power' | 'new' | 'best';
const SORTS: { v: Sort; label: string }[] = [
  { v: 'relevance', label: 'Pertinence' },
  { v: 'price-asc', label: 'Prix croissant' },
  { v: 'price-desc', label: 'Prix décroissant' },
  { v: 'power', label: 'Puissance' },
  { v: 'new', label: 'Nouveautés' },
  { v: 'best', label: 'Meilleures ventes' },
];

const list = (sp: URLSearchParams, k: string) => sp.getAll(k).flatMap((v) => v.split(',')).filter(Boolean);

function useDebounced<T>(value: T, ms = 250) {
  const [v, setV] = useState(value);
  useEffect(() => { const t = setTimeout(() => setV(value), ms); return () => clearTimeout(t); }, [value, ms]);
  return v;
}

export default function Catalog() {
  const { products, loading } = useCatalog();
  const [sp, setSp] = useSearchParams();
  const [qInput, setQInput] = useState(sp.get('q') || '');
  const q = useDebounced(qInput);
  const [visible, setVisible] = useState(PAGE);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const brands = list(sp, 'brand');
  const powers = list(sp, 'power').map(Number);
  const volts = list(sp, 'volt').map(Number);
  const connectors = list(sp, 'connector');
  const promoOnly = sp.get('promo') === '1';
  const stockOnly = sp.get('stock') === '1';
  const maxPrice = Number(sp.get('max')) || 0;
  const sort = (sp.get('sort') as Sort) || 'relevance';

  // keep URL in sync with debounced search
  useEffect(() => {
    const cur = sp.get('q') || '';
    if (cur === q) return;
    const next = new URLSearchParams(sp);
    if (q) next.set('q', q); else next.delete('q');
    setSp(next, { replace: true });
    if (q) track('search', { search_term: q });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);
  useEffect(() => { setQInput(sp.get('q') || ''); /* back/forward */ // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sp.get('q')]);
  useEffect(() => setVisible(PAGE), [sp]);

  const update = (key: string, values: (string | number)[] | string | null) => {
    const next = new URLSearchParams(sp);
    next.delete(key);
    if (Array.isArray(values)) values.forEach((v) => next.append(key, String(v)));
    else if (values) next.set(key, values);
    setSp(next, { replace: true });
  };
  const toggle = (key: string, current: (string | number)[], v: string | number) =>
    update(key, current.includes(v as never) ? current.filter((x) => x !== v) : [...current, v]);
  const clearAll = () => { setQInput(''); setSp(new URLSearchParams(sort !== 'relevance' ? { sort } : {}), { replace: true }); };

  const facets = useMemo(() => {
    const count = <T,>(get: (p: ShopProduct) => T | undefined) => {
      const m = new Map<T, number>();
      products.forEach((p) => { const v = get(p); if (v !== undefined && v !== null && v !== '') m.set(v, (m.get(v) || 0) + 1); });
      return m;
    };
    return {
      brand: count((p) => p.brand),
      power: count((p) => p.wattage),
      volt: count((p) => p.voltage),
      connector: count((p) => p.connector),
      priceMax: Math.max(0, ...products.map((p) => p.price)),
    };
  }, [products]);

  const filtered = useMemo(() => {
    const terms = q.trim().toLowerCase().split(/\s+/).filter(Boolean);
    let out = products.filter((p) =>
      (!terms.length || terms.every((t) => p.searchText.includes(t))) &&
      (!brands.length || brands.some((b) => b.toLowerCase() === p.brand.toLowerCase())) &&
      (!powers.length || powers.includes(p.wattage || -1)) &&
      (!volts.length || volts.includes(p.voltage || -1)) &&
      (!connectors.length || connectors.some((c) => p.connector?.toLowerCase().startsWith(c.toLowerCase().split(' ')[0]))) &&
      (!promoOnly || !!p.oldPrice) &&
      (!stockOnly || p.stock === undefined || p.stock > 0) &&
      (!maxPrice || (p.price > 0 && p.price <= maxPrice)),
    );
    const byPrice = (a: ShopProduct, b: ShopProduct, dir: 1 | -1) => {
      // "Prix sur demande" always last
      if (!(a.price > 0)) return 1;
      if (!(b.price > 0)) return -1;
      return (a.price - b.price) * dir;
    };
    switch (sort) {
      case 'price-asc': out = [...out].sort((a, b) => byPrice(a, b, 1)); break;
      case 'price-desc': out = [...out].sort((a, b) => byPrice(a, b, -1)); break;
      case 'power': out = [...out].sort((a, b) => (b.wattage || 0) - (a.wattage || 0)); break;
      case 'new': out = [...out].sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt))); break;
      case 'best': out = [...out].sort((a, b) => Number(b.featured) - Number(a.featured) || (b.wattage || 0) - (a.wattage || 0)); break;
      default:
        if (terms.length) out = [...out].sort((a, b) => Number(b.title.toLowerCase().includes(terms[0])) - Number(a.title.toLowerCase().includes(terms[0])));
    }
    return out;
  }, [products, q, brands, powers, volts, connectors, promoOnly, stockOnly, maxPrice, sort]);

  const chips: { label: string; onRemove: () => void }[] = [
    ...brands.map((b) => ({ label: b, onRemove: () => toggle('brand', brands, b) })),
    ...powers.map((w) => ({ label: `${w}W`, onRemove: () => toggle('power', powers, w) })),
    ...volts.map((v) => ({ label: `${v}V`, onRemove: () => toggle('volt', volts, v) })),
    ...connectors.map((c) => ({ label: c, onRemove: () => toggle('connector', connectors, c) })),
    ...(promoOnly ? [{ label: 'En promotion', onRemove: () => update('promo', null) }] : []),
    ...(stockOnly ? [{ label: 'En stock', onRemove: () => update('stock', null) }] : []),
    ...(maxPrice ? [{ label: `≤ ${formatDA(maxPrice)}`, onRemove: () => update('max', null) }] : []),
    ...(q ? [{ label: `« ${q} »`, onRemove: () => setQInput('') }] : []),
  ];

  const filtersUi = (
    <div className="space-y-7">
      <FilterGroup title="Marque">
        {[...facets.brand.entries()].sort((a, b) => b[1] - a[1]).map(([b, n]) => (
          <Check key={b} label={b} count={n} checked={brands.some((x) => x.toLowerCase() === b.toLowerCase())} onChange={() => toggle('brand', brands, b)} />
        ))}
      </FilterGroup>
      <FilterGroup title="Puissance (W)">
        <div className="flex flex-wrap gap-2">
          {[...facets.power.keys()].sort((a, b) => a - b).map((w) => (
            <button key={w} onClick={() => toggle('power', powers, w)} aria-pressed={powers.includes(w)}
              className={cn('tabular h-9 rounded-full border px-3 text-sm font-medium', powers.includes(w) ? 'border-shop-text bg-shop-primary text-shop-primary-fg' : 'border-shop-border hover:border-shop-text')}>{w}W</button>
          ))}
        </div>
      </FilterGroup>
      <FilterGroup title="Tension (V)">
        {[...facets.volt.entries()].sort((a, b) => a[0] - b[0]).map(([v, n]) => (
          <Check key={v} label={`${v}V`} count={n} checked={volts.includes(v)} onChange={() => toggle('volt', volts, v)} />
        ))}
      </FilterGroup>
      {facets.connector.size > 0 && (
        <FilterGroup title="Connecteur / embout">
          {[...facets.connector.entries()].map(([c, n]) => (
            <Check key={c} label={c} count={n} checked={connectors.includes(c)} onChange={() => toggle('connector', connectors, c)} />
          ))}
        </FilterGroup>
      )}
      {facets.priceMax > 0 && (
        <FilterGroup title="Prix maximum">
          <input type="range" min={1000} max={Math.ceil(facets.priceMax / 500) * 500} step={500} value={maxPrice || Math.ceil(facets.priceMax / 500) * 500}
            onChange={(e) => update('max', Number(e.target.value) >= facets.priceMax ? null : e.target.value)}
            className="w-full accent-[#0B1220] dark:accent-[#C6F432]" aria-label="Prix maximum" />
          <p className="tabular mt-1 text-sm text-shop-muted">Jusqu'à {formatDA(maxPrice || facets.priceMax)}</p>
        </FilterGroup>
      )}
      <FilterGroup title="Disponibilité">
        <Check label="En promotion" checked={promoOnly} onChange={() => update('promo', promoOnly ? null : '1')} />
        <Check label="En stock" checked={stockOnly} onChange={() => update('stock', stockOnly ? null : '1')} />
      </FilterGroup>
    </div>
  );

  return (
    <div className="mx-auto max-w-[1280px] px-4 py-8 md:py-10">
      <Seo
        title={brands.length === 1 ? `Chargeurs ${brands[0]}` : 'Boutique — tous les chargeurs PC portables'}
        description="Tous nos chargeurs PC portables originaux : HP, Dell, Lenovo, Surface, Apple, Asus… Filtrez par marque, puissance et connecteur. Paiement à la livraison."
        jsonLd={breadcrumbLd([{ name: 'Accueil', path: '/website-shop' }, { name: 'Boutique', path: '/website-shop/offers' }])}
      />
      <nav aria-label="Fil d'Ariane" className="mb-3 text-sm text-shop-muted"><Link to="/website-shop" className="hover:text-shop-text">Accueil</Link> / <span className="text-shop-text">Boutique</span></nav>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold md:text-[40px]">Boutique</h1>
          <p className="tabular mt-1 text-shop-muted" aria-live="polite">{loading ? 'Chargement…' : `${filtered.length} résultat${filtered.length > 1 ? 's' : ''}`}</p>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute start-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-shop-muted" />
          <label htmlFor="cat-search" className="sr-only">Rechercher dans le catalogue</label>
          <input id="cat-search" type="search" value={qInput} onChange={(e) => setQInput(e.target.value)} placeholder="Modèle de PC, marque, puissance… (ex. Omen 17, Latitude 5420)" className={cn(fieldCls, 'ps-10')} />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="lg:hidden" onClick={() => setFiltersOpen(true)}>
            <SlidersHorizontal /> Filtres {chips.length > 0 && <span className="tabular rounded-full bg-shop-volt px-1.5 text-xs text-shop-volt-ink">{chips.length}</span>}
          </Button>
          <label htmlFor="cat-sort" className="sr-only">Trier par</label>
          <Select id="cat-sort" value={sort} onChange={(e) => update('sort', e.target.value === 'relevance' ? null : e.target.value)} className="w-auto min-w-[180px]">
            {SORTS.map((s) => <option key={s.v} value={s.v}>{s.label}</option>)}
          </Select>
        </div>
      </div>

      {chips.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {chips.map((c) => (
            <button key={c.label} onClick={c.onRemove} className="inline-flex h-8 items-center gap-1 rounded-full bg-shop-volt-soft px-3 text-sm font-medium" aria-label={`Retirer le filtre ${c.label}`}>
              {c.label} <X className="h-3.5 w-3.5" />
            </button>
          ))}
          <button onClick={clearAll} className="text-sm font-semibold text-shop-electric hover:underline">Tout effacer</button>
        </div>
      )}

      <div className="mt-8 grid gap-8 lg:grid-cols-[240px_1fr]">
        <aside className="hidden lg:block" aria-label="Filtres">{filtersUi}</aside>
        <div>
          {loading ? (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 xl:grid-cols-4">{Array.from({ length: 8 }).map((_, i) => <ProductCardSkeleton key={i} />)}</div>
          ) : filtered.length === 0 ? (
            <EmptyState title="Aucun chargeur ne correspond" text="Essayez d'enlever un filtre, ou demandez-nous directement : on trouve le bon modèle pour vous."
              action={<><Button variant="outline" onClick={clearAll}>Tout effacer</Button><Link to="/website-shop/contacts" className={btnClass('primary', 'md')}>Nous contacter</Link></>} />
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 xl:grid-cols-4">
                {filtered.slice(0, visible).map((p, i) => <ProductCard key={p.id} product={p} priority={i < 4} />)}
              </div>
              {visible < filtered.length && (
                <div className="mt-8 flex flex-col items-center gap-2">
                  <p className="tabular text-sm text-shop-muted">{visible} sur {filtered.length}</p>
                  <Button variant="outline" size="lg" onClick={() => setVisible((v) => v + PAGE)}>Charger plus</Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <Drawer open={filtersOpen} onOpenChange={setFiltersOpen} side="bottom" title="Filtres"
        footer={<div className="flex gap-2"><Button variant="outline" className="flex-1" onClick={clearAll}>Tout effacer</Button><Button className="flex-1" onClick={() => setFiltersOpen(false)}>Voir {filtered.length} résultat{filtered.length > 1 ? 's' : ''}</Button></div>}>
        {filtersUi}
      </Drawer>
    </div>
  );
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset>
      <legend className="mb-3 text-sm font-semibold">{title}</legend>
      <div className="space-y-1">{children}</div>
    </fieldset>
  );
}

function Check({ label, count, checked, onChange }: { label: string; count?: number; checked: boolean; onChange: () => void }) {
  return (
    <label className="flex min-h-[40px] cursor-pointer items-center gap-3 rounded-lg px-1 text-sm hover:bg-shop-surface-2">
      <input type="checkbox" checked={checked} onChange={onChange} className="h-[18px] w-[18px] rounded accent-[#0B1220] dark:accent-[#C6F432]" />
      <span className="flex-1">{label}</span>
      {count !== undefined && <span className="tabular text-xs text-shop-muted">{count}</span>}
    </label>
  );
}
