import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Percent, Timer } from 'lucide-react';
import { useCatalog, type ShopProduct } from '../lib/catalog';
import { formatDA } from '../lib/format';
import { Seo, breadcrumbLd } from '../components/Seo';
import { ProductCard, ProductCardSkeleton } from '../components/ProductCard';
import { EmptyState, btnClass } from '../components/ui';

function Countdown({ end }: { end: string }) {
  const target = new Date(end).getTime();
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, []);
  if (!Number.isFinite(target) || target <= now) return null;
  const s = Math.floor((target - now) / 1000);
  const d = Math.floor(s / 86400), h = Math.floor((s % 86400) / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
  return (
    <span className="tabular inline-flex items-center gap-1.5 rounded-full bg-shop-danger/10 px-2.5 py-1 text-xs font-semibold text-shop-danger">
      <Timer className="h-3.5 w-3.5" /> {d > 0 && `${d}j `}{String(h).padStart(2, '0')}:{String(m).padStart(2, '0')}:{String(sec).padStart(2, '0')}
    </span>
  );
}

export function PromoCard({ p }: { p: ShopProduct }) {
  return (
    <div className="flex flex-col gap-2">
      <ProductCard product={p} />
      <div className="flex flex-wrap items-center justify-between gap-2 px-1 text-xs">
        {p.oldPrice && p.price > 0 && <span className="tabular font-semibold text-shop-danger">-{formatDA(p.oldPrice - p.price)}</span>}
        {p.offerEndsAt && <Countdown end={p.offerEndsAt} />}
      </div>
    </div>
  );
}

export default function Promotions() {
  const { products, loading } = useCatalog();
  const promos = useMemo(() => products.filter((p) => p.oldPrice).sort((a, b) => (b.discountPct || 0) - (a.discountPct || 0)), [products]);

  return (
    <div className="mx-auto max-w-[1280px] px-4 py-8 md:py-10">
      <Seo title="Promotions — chargeurs PC à prix réduit" description="Les promotions du moment sur nos chargeurs PC portables originaux. Paiement à la livraison, 69 wilayas."
        jsonLd={breadcrumbLd([{ name: 'Accueil', path: '/website-shop' }, { name: 'Promotions', path: '/website-shop/special-offers' }])} />
      <nav aria-label="Fil d'Ariane" className="mb-3 text-sm text-shop-muted"><Link to="/website-shop" className="hover:text-shop-text">Accueil</Link> / <span className="text-shop-text">Promotions</span></nav>
      <h1 className="text-3xl font-bold md:text-[40px]">Promotions</h1>
      <p className="mt-1 text-shop-muted">{loading ? 'Chargement…' : `${promos.length} offre${promos.length > 1 ? 's' : ''} en cours`}</p>
      <div className="mt-8">
        {loading ? (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 lg:grid-cols-4">{Array.from({ length: 4 }).map((_, i) => <ProductCardSkeleton key={i} />)}</div>
        ) : promos.length === 0 ? (
          <EmptyState icon={Percent} title="Pas de promotion pour le moment" text="Revenez bientôt, ou découvrez tout le catalogue à prix juste."
            action={<Link to="/website-shop/offers" className={btnClass('primary', 'md')}>Voir la boutique</Link>} />
        ) : (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 lg:grid-cols-4">{promos.map((p) => <PromoCard key={p.id} p={p} />)}</div>
        )}
      </div>
    </div>
  );
}
