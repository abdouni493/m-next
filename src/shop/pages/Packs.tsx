import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Package, Check, ShoppingBag } from 'lucide-react';
import { getPackageDetails } from '@/lib/supabaseClient';
import { usePacks } from '../lib/catalog';
import { cart } from '../lib/cart';
import { formatDA } from '../lib/format';
import { Seo } from '../components/Seo';
import { Badge, Button, EmptyState, ProductImage, btnClass } from '../components/ui';

interface PackItem { id: string; product_id: string; product_name: string; product_image?: string; product_mark?: string; quantity: number; custom_price?: number; product_wattage?: string }

function PackCard({ pack }: { pack: any }) {
  const navigate = useNavigate();
  const [items, setItems] = useState<PackItem[]>([]);
  useEffect(() => { getPackageDetails(pack.id).then((d) => setItems((d as PackItem[]) || [])).catch(() => setItems([])); }, [pack.id]);

  const separate = items.reduce((s, i) => s + (Number(i.custom_price) || 0) * (i.quantity || 1), 0);
  const price = Number(pack.package_price) || 0;
  const saving = separate > price && price > 0 ? separate - price : 0;

  const addPack = (go?: boolean) => {
    if (!items.length || !price) return;
    // Spread the pack price across its items so order lines still map to real products.
    const ratio = separate > 0 ? price / separate : 1 / items.length;
    items.forEach((i) => cart.addRaw({
      product_id: i.product_id,
      name: `${i.product_name} (pack ${pack.name})`,
      price: Math.round((separate > 0 ? (Number(i.custom_price) || 0) * ratio : price * ratio)),
      quantity: i.quantity || 1,
      image: i.product_image,
      product_image: i.product_image,
      product_mark: i.product_mark,
      from_offer: true,
      offer_id: null,
    }));
    if (go) navigate('/website-shop/order'); else cart.openDrawer();
  };

  return (
    <article className="shop-card flex flex-col overflow-hidden">
      <div className="relative aspect-[16/10] bg-shop-surface-2/60">
        <ProductImage src={pack.image_url} alt={pack.name} className="p-4" />
        {saving > 0 && <Badge tone="danger" className="absolute start-3 top-3">-{formatDA(saving)}</Badge>}
      </div>
      <div className="flex flex-1 flex-col gap-4 p-5">
        <div>
          <h2 className="text-lg font-semibold">{pack.name}</h2>
          {pack.description && <p className="mt-1 line-clamp-2 text-sm text-shop-muted">{pack.description}</p>}
        </div>
        {items.length > 0 && (
          <ul className="space-y-1.5 text-sm">
            {items.map((i) => <li key={i.id} className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-shop-success" />{i.quantity > 1 && `${i.quantity}× `}{i.product_name}</li>)}
          </ul>
        )}
        <div className="mt-auto">
          <p className="tabular font-sora text-2xl font-bold">{price > 0 ? formatDA(price) : 'Prix sur demande'}</p>
          {saving > 0 && <p className="tabular text-sm text-shop-muted">au lieu de <s>{formatDA(separate)}</s> séparément</p>}
        </div>
        <div className="flex gap-2">
          <Button className="flex-1" onClick={() => addPack()} disabled={!items.length || !price}><ShoppingBag /> Ajouter le pack</Button>
          <Button variant="outline" onClick={() => addPack(true)} disabled={!items.length || !price}>Commander</Button>
        </div>
      </div>
    </article>
  );
}

export default function Packs() {
  const { packs, loading } = usePacks();
  return (
    <div className="mx-auto max-w-[1280px] px-4 py-8 md:py-10">
      <Seo title="Packs chargeurs" description="Nos packs de chargeurs PC à prix réduit. Paiement à la livraison dans les 69 wilayas." />
      <nav aria-label="Fil d'Ariane" className="mb-3 text-sm text-shop-muted"><Link to="/website-shop" className="hover:text-shop-text">Accueil</Link> / <span className="text-shop-text">Packs</span></nav>
      <h1 className="text-3xl font-bold md:text-[40px]">Packs</h1>
      <p className="mt-1 text-shop-muted">Plusieurs produits, un seul prix.</p>
      <div className="mt-8">
        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="shop-card h-96 animate-pulse" />)}</div>
        ) : packs.length === 0 ? (
          <EmptyState icon={Package} title="Aucun pack disponible pour le moment" text="Composez votre propre sélection dans la boutique."
            action={<Link to="/website-shop/offers" className={btnClass('primary', 'md')}>Voir la boutique</Link>} />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{packs.map((p) => <PackCard key={p.id} pack={p} />)}</div>
        )}
      </div>
    </div>
  );
}
