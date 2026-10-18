import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ShoppingBag, MessageCircle, Minus, Plus, Truck, ShieldCheck, BadgeCheck, Wallet, ChevronDown, CheckCircle2, HelpCircle, XCircle, Star,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCatalog, useReviews, useStoreSettings, whatsappLink, type ShopProduct } from '../lib/catalog';
import { cart, recentlyViewed } from '../lib/cart';
import { formatDA, hasPrice } from '../lib/format';
import { summarize } from '../lib/description';
import { track } from '../lib/track';
import { useWilayaFees } from '../lib/delivery';
import { WILAYAS } from '../wilayas';
import { storeConfig } from '../storeConfig';
import { Seo, breadcrumbLd } from '../components/Seo';
import { ProductCard, productPath } from '../components/ProductCard';
import { matchScore } from '../components/Finder';
import { ReviewModal } from './Home';
import { Badge, Button, ChargeBar, EmptyState, Input, PriceTag, ProductImage, Rating, Select, SpecChip, StockBadge, btnClass } from '../components/ui';

export default function Product() {
  const { slug = '' } = useParams();
  const { products, loading } = useCatalog();
  const product = useMemo(() => {
    const suffix = slug.split('-').pop() || '';
    return products.find((p) => p.slug === slug) || products.find((p) => p.id === slug) || products.find((p) => suffix.length >= 6 && p.id.startsWith(suffix));
  }, [products, slug]);

  if (loading) return <ProductSkeleton />;
  if (!product) {
    return (
      <div className="mx-auto max-w-[1280px] px-4 py-16">
        <Seo title="Produit introuvable" noindex />
        <EmptyState title="Ce produit n'est plus disponible" text="Il a peut-être été retiré du catalogue. Découvrez nos autres chargeurs."
          action={<Link to="/website-shop/offers" className={btnClass('primary', 'md')}>Voir la boutique</Link>} />
      </div>
    );
  }
  return <ProductView key={product.id} p={product} all={products} />;
}

function ProductView({ p, all }: { p: ShopProduct; all: ShopProduct[] }) {
  const navigate = useNavigate();
  const settings = useStoreSettings();
  const { reviews } = useReviews();
  const [active, setActive] = useState(0);
  const [qty, setQty] = useState(1);
  const [reviewOpen, setReviewOpen] = useState(false);
  const priced = hasPrice(p.price);
  const outOfStock = p.stock !== undefined && p.stock <= 0;
  const buyRef = useRef<HTMLDivElement>(null);
  const [showSticky, setShowSticky] = useState(false);

  useEffect(() => {
    recentlyViewed.push(p.id);
    track('view_item', { id: p.id, name: p.title, price: p.price, brand: p.brand });
  }, [p]);

  useEffect(() => {
    const el = buyRef.current;
    if (!el || !('IntersectionObserver' in window)) return;
    const io = new IntersectionObserver(([e]) => setShowSticky(!e.isIntersecting && e.boundingClientRect.top < 0));
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const related = useMemo(() => all
    .filter((x) => x.id !== p.id && (x.brand === p.brand || x.wattage === p.wattage))
    .sort((a, b) => Number(b.brand === p.brand) - Number(a.brand === p.brand) || Math.abs((a.wattage || 0) - (p.wattage || 0)) - Math.abs((b.wattage || 0) - (p.wattage || 0)))
    .slice(0, 4), [all, p]);
  const recent = useMemo(() => {
    const ids = recentlyViewed.get().filter((id) => id !== p.id);
    return ids.map((id) => all.find((x) => x.id === id)).filter(Boolean).slice(0, 4) as ShopProduct[];
  }, [all, p.id]);
  // Testimonials are store-wide (no product link in the DB); shown as store reviews.
  const avg = reviews.length ? reviews.reduce((s, r) => s + (r.rating || 5), 0) / reviews.length : 0;

  const specRows = [
    ['Tension', p.voltage && `${p.voltage} V`],
    ['Ampérage', p.amperage && `${p.amperage} A`],
    ['Puissance', p.wattage && `${p.wattage} W`],
    ['Connecteur', p.connector],
    ['Marque', p.brand],
    ['Type', /original/i.test(p.description) ? 'Original' : 'Original / compatible certifié'],
    ['Garantie', storeConfig.guarantee.short],
  ].filter(([, v]) => v) as [string, string][];

  const sections = p.parsed.sections.filter((s) => s.kind !== 'compat');
  const safety = sections.filter((s) => s.kind === 'safety');
  const features = sections.filter((s) => s.kind !== 'safety');
  const waProduct = whatsappLink(settings.whatsapp, `Bonjour M NEXT, j'ai une question sur le ${p.title} : `);

  const add = () => { cart.add(p, qty); };
  const buyNow = () => { cart.add(p, qty, false); navigate('/website-shop/order'); };

  const jsonLd = [
    breadcrumbLd([{ name: 'Accueil', path: '/website-shop' }, { name: 'Boutique', path: '/website-shop/offers' }, { name: p.title, path: productPath(p) }]),
    {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: p.title,
      brand: { '@type': 'Brand', name: p.brand },
      image: p.images.length ? p.images : undefined,
      description: summarize(p.description) || p.title,
      sku: p.id,
      ...(priced ? {
        offers: {
          '@type': 'Offer',
          priceCurrency: 'DZD',
          price: p.price,
          availability: outOfStock ? 'https://schema.org/OutOfStock' : 'https://schema.org/InStock',
          url: storeConfig.siteUrl + productPath(p),
          seller: { '@type': 'Organization', name: storeConfig.name },
        },
      } : {}),
      ...(reviews.length ? { aggregateRating: { '@type': 'AggregateRating', ratingValue: avg.toFixed(1), reviewCount: reviews.length } } : {}),
    },
  ];

  return (
    <div className="mx-auto max-w-[1280px] px-4 py-6 md:py-10">
      <Seo title={p.title} description={summarize(p.description) || `${p.title} — livraison 69 wilayas, paiement à la livraison.`} image={p.images[0]} type="product" jsonLd={jsonLd} />

      <nav aria-label="Fil d'Ariane" className="mb-5 flex flex-wrap gap-1 text-sm text-shop-muted">
        <Link to="/website-shop" className="hover:text-shop-text">Accueil</Link> /
        <Link to="/website-shop/offers" className="hover:text-shop-text">Boutique</Link> /
        <Link to={`/website-shop/offers?brand=${encodeURIComponent(p.brand)}`} className="hover:text-shop-text">{p.brand}</Link> /
        <span className="line-clamp-1 text-shop-text">{p.title}</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-12">
        {/* Gallery */}
        <div>
          <Gallery images={p.images} title={p.title} active={active} setActive={setActive} />
        </div>

        {/* Buy box */}
        <div>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <Badge tone="ink">{p.brand}</Badge>
            {p.discountPct ? <Badge tone="danger">-{p.discountPct}%</Badge> : null}
            {reviews.length > 0 && <button onClick={() => document.getElementById('avis')?.scrollIntoView({ behavior: 'smooth' })} className="inline-flex items-center gap-1.5"><Rating value={avg} size={14} count={reviews.length} /></button>}
          </div>
          <h1 className="text-2xl font-bold md:text-[32px]">{p.title}</h1>
          {p.rawName.trim() !== p.title && <p className="mt-1 text-sm text-shop-muted">{p.rawName}</p>}

          <div className="mt-4 flex flex-wrap gap-1.5">
            {[p.voltage && `${p.voltage}V`, p.amperage && `${p.amperage}A`, p.wattage && `${p.wattage}W`, p.connector].filter(Boolean).map((s) => <SpecChip key={String(s)}>{s}</SpecChip>)}
          </div>

          <div className="mt-6 rounded-2xl border border-shop-border bg-shop-surface p-5">
            <PriceTag price={p.price} oldPrice={p.oldPrice} size="lg" />
            {p.oldPrice && priced && <p className="tabular mt-1 text-sm font-medium text-shop-danger">Vous économisez {formatDA(p.oldPrice - p.price)}</p>}
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between text-sm"><StockBadge stock={p.stock} />{p.stock !== undefined && p.stock > 0 && p.stock <= 3 && <span className="font-medium text-shop-warning">Plus que {p.stock} en stock</span>}</div>
              <ChargeBar value={outOfStock ? 0 : p.stock !== undefined && p.stock <= 3 ? 30 : 100} label="Disponibilité" />
            </div>

            <div ref={buyRef} className="mt-5 space-y-3">
              {priced ? (
                <>
                  <div className="flex gap-3">
                    <div className="inline-flex items-center rounded-[10px] border border-shop-border" role="group" aria-label="Quantité">
                      <button className="flex h-12 w-11 items-center justify-center disabled:opacity-40" onClick={() => setQty((q) => Math.max(1, q - 1))} disabled={qty <= 1} aria-label="Diminuer"><Minus className="h-4 w-4" /></button>
                      <span className="tabular w-8 text-center font-semibold" aria-live="polite">{qty}</span>
                      <button className="flex h-12 w-11 items-center justify-center" onClick={() => setQty((q) => Math.min(20, q + 1))} aria-label="Augmenter"><Plus className="h-4 w-4" /></button>
                    </div>
                    <Button variant="primary" size="lg" className="flex-1" onClick={add} disabled={outOfStock}><ShoppingBag /> Ajouter au panier</Button>
                  </div>
                  <Button variant="volt" size="lg" className="w-full" onClick={buyNow} disabled={outOfStock}>Commander maintenant</Button>
                </>
              ) : (
                <a href={waProduct} target="_blank" rel="noopener noreferrer" className={btnClass('primary', 'lg', 'w-full')}><MessageCircle /> Demander le prix sur WhatsApp</a>
              )}
              <a href={waProduct} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm font-semibold text-shop-electric hover:underline"><MessageCircle className="h-4 w-4" /> Une question ? Écrivez-nous</a>
            </div>

            <ul className="mt-5 grid grid-cols-2 gap-3 border-t border-shop-border pt-5 text-sm">
              <li className="flex items-center gap-2"><BadgeCheck className="h-[18px] w-[18px] text-shop-success" />Testé avant livraison</li>
              <li className="flex items-center gap-2"><ShieldCheck className="h-[18px] w-[18px] text-shop-success" />{storeConfig.guarantee.short}</li>
              <li className="flex items-center gap-2"><Wallet className="h-[18px] w-[18px] text-shop-success" />Paiement à la livraison</li>
              <li className="flex items-center gap-2"><Truck className="h-[18px] w-[18px] text-shop-success" />69 wilayas</li>
            </ul>
          </div>

          <DeliveryEstimator />
          {p.compatibleModels.length > 0 && <CompatChecker p={p} waNumber={settings.whatsapp} />}
        </div>
      </div>

      {/* Details */}
      <div className="mt-12 grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-12">
        <div className="space-y-3">
          <h2 className="text-xl font-bold md:text-2xl">Fiche technique</h2>
          <table className="w-full overflow-hidden rounded-2xl border border-shop-border bg-shop-surface text-sm">
            <tbody>
              {specRows.map(([k, v]) => (
                <tr key={k} className="border-b border-shop-border last:border-0">
                  <th scope="row" className="w-2/5 bg-shop-surface-2/50 px-4 py-3 text-start font-medium text-shop-muted">{k}</th>
                  <td className="tabular px-4 py-3 font-medium">{v}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {p.compatibleModels.length > 0 && (
            <div className="pt-6">
              <h2 className="mb-3 text-xl font-bold md:text-2xl">Compatibilité</h2>
              <ul className="grid gap-2 sm:grid-cols-2">
                {p.compatibleModels.map((m) => (
                  <li key={m} className="flex items-start gap-2 rounded-xl bg-shop-surface px-3 py-2.5 text-sm ring-1 ring-shop-border"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-shop-success" />{m}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="space-y-3">
          <Collapsible title="Description" defaultOpen>
            {p.parsed.intro.map((t, i) => <p key={i} className="mb-2">{t}</p>)}
            {features.map((s) => (
              <div key={s.title} className="mb-4">
                <h3 className="mb-2 text-sm font-semibold" style={{ fontFamily: 'Inter, sans-serif' }}>{s.title}</h3>
                {s.text.map((t, i) => <p key={i} className="mb-1">{t}</p>)}
                {s.items.length > 0 && <ul className="space-y-1.5">{s.items.map((it) => <li key={it} className="flex gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-shop-success" />{it}</li>)}</ul>}
              </div>
            ))}
            {!p.parsed.intro.length && !features.length && <p>Chargeur {p.brand} {p.wattage ? `${p.wattage}W` : ''} testé avant expédition.</p>}
          </Collapsible>
          <Collapsible title="Sécurité & protections">
            {safety.length ? safety.flatMap((s) => s.items).map((it) => <p key={it} className="mb-1">• {it}</p>) : (
              <ul className="space-y-1.5">
                {['Protection contre les surtensions et courts-circuits', 'Protection contre la surchauffe', 'Tension de sortie stable pour préserver votre batterie'].map((t) => <li key={t} className="flex gap-2"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />{t}</li>)}
              </ul>
            )}
          </Collapsible>
          <Collapsible title="Livraison & retours">
            <p className="mb-2">Livraison en {storeConfig.delivery.delayText} dans les 69 wilayas, à domicile ou en stop-desk. Paiement en espèces à la réception.</p>
            <p>{storeConfig.delivery.exchangeText} {storeConfig.guarantee.long}</p>
          </Collapsible>
        </div>
      </div>

      {/* Reviews */}
      <section id="avis" className="mt-14 scroll-mt-24">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-bold md:text-2xl">Avis clients {reviews.length > 0 && <span className="tabular text-base font-medium text-shop-muted">· {avg.toFixed(1)}/5 ({reviews.length})</span>}</h2>
          <Button variant="outline" onClick={() => setReviewOpen(true)}><Star /> Laisser un avis</Button>
        </div>
        {reviews.length ? (
          <div className="grid gap-4 md:grid-cols-3">
            {reviews.slice(0, 3).map((r) => (
              <figure key={r.id} className="shop-card p-5"><Rating value={r.rating || 5} size={14} /><blockquote className="mt-3 text-sm">{r.opinion}</blockquote><figcaption className="mt-3 text-sm font-semibold">{r.client_name}</figcaption></figure>
            ))}
          </div>
        ) : <p className="text-sm text-shop-muted">Soyez le premier à donner votre avis.</p>}
      </section>

      {related.length > 0 && (
        <section className="mt-14">
          <h2 className="mb-5 text-xl font-bold md:text-2xl">Produits similaires</h2>
          <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">{related.map((x) => <ProductCard key={x.id} product={x} />)}</div>
        </section>
      )}
      {recent.length > 0 && (
        <section className="mt-14">
          <h2 className="mb-5 text-xl font-bold md:text-2xl">Vus récemment</h2>
          <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">{recent.map((x) => <ProductCard key={x.id} product={x} />)}</div>
        </section>
      )}

      {/* Sticky mobile add-to-cart */}
      {priced && (
        <div className={cn('fixed inset-x-3 bottom-[84px] z-30 transition-all duration-200 lg:hidden', showSticky ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-4 opacity-0')}>
          <div className="flex items-center gap-3 rounded-2xl border border-shop-border bg-shop-surface p-3 shadow-lg">
            <div className="min-w-0 flex-1"><p className="truncate text-xs text-shop-muted">{p.title}</p><PriceTag price={p.price} oldPrice={p.oldPrice} size="sm" /></div>
            <Button onClick={add} disabled={outOfStock}><ShoppingBag /> Ajouter</Button>
          </div>
        </div>
      )}

      <ReviewModal open={reviewOpen} onOpenChange={setReviewOpen} />
    </div>
  );
}

function Gallery({ images, title, active, setActive }: { images: string[]; title: string; active: number; setActive: (i: number) => void }) {
  const [zoom, setZoom] = useState<{ x: number; y: number } | null>(null);
  const touchX = useRef<number | null>(null);
  const list = images.length ? images : [undefined];
  return (
    <div className="lg:sticky lg:top-24">
      <div
        className="relative aspect-square overflow-hidden rounded-[24px] border border-shop-border bg-shop-surface"
        onMouseMove={(e) => { if (!images[active]) return; const r = e.currentTarget.getBoundingClientRect(); setZoom({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 }); }}
        onMouseLeave={() => setZoom(null)}
        onTouchStart={(e) => { touchX.current = e.touches[0].clientX; }}
        onTouchEnd={(e) => {
          if (touchX.current === null) return;
          const dx = e.changedTouches[0].clientX - touchX.current;
          if (Math.abs(dx) > 40) setActive((active + (dx < 0 ? 1 : -1) + list.length) % list.length);
          touchX.current = null;
        }}
      >
        <ProductImage src={list[active]} alt={title} priority className="p-6 md:p-10" />
        {zoom && images[active] && (
          <div className="pointer-events-none absolute inset-0 hidden bg-no-repeat md:block" style={{ backgroundImage: `url(${images[active]})`, backgroundSize: '200%', backgroundPosition: `${zoom.x}% ${zoom.y}%`, backgroundColor: 'var(--shop-surface)' }} aria-hidden />
        )}
        {list.length > 1 && (
          <div className="absolute inset-x-0 bottom-3 flex justify-center gap-1.5 md:hidden">
            {list.map((_, i) => <span key={i} className={cn('h-1.5 rounded-full transition-all', i === active ? 'w-5 bg-shop-text' : 'w-1.5 bg-shop-border')} />)}
          </div>
        )}
      </div>
      {images.length > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto">
          {images.slice(0, 6).map((src, i) => (
            <button key={src} onClick={() => setActive(i)} aria-label={`Image ${i + 1}`} aria-current={i === active}
              className={cn('h-20 w-20 shrink-0 overflow-hidden rounded-xl border-2 bg-shop-surface', i === active ? 'border-shop-text' : 'border-shop-border')}>
              <img src={src} alt="" className="h-full w-full object-contain p-1.5" loading="lazy" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function DeliveryEstimator() {
  const [wilaya, setWilaya] = useState(() => { try { return localStorage.getItem('shop:wilaya') || ''; } catch { return ''; } });
  const { domicile, bureau, hasAgency } = useWilayaFees(wilaya);
  return (
    <div className="mt-4 rounded-2xl border border-shop-border bg-shop-surface p-5">
      <div className="mb-3 flex items-center gap-2"><Truck className="h-5 w-5" /><h2 className="text-base font-semibold" style={{ fontFamily: 'Inter, sans-serif' }}>Livraison</h2></div>
      <label htmlFor="pd-wilaya" className="sr-only">Votre wilaya</label>
      <Select id="pd-wilaya" value={wilaya} onChange={(e) => { setWilaya(e.target.value); try { localStorage.setItem('shop:wilaya', e.target.value); } catch { /* ignore */ } }}>
        <option value="">Choisissez votre wilaya…</option>
        {WILAYAS.map((w) => <option key={w.code} value={w.name}>{w.code} — {w.name}</option>)}
      </Select>
      {wilaya && (
        <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-xl bg-shop-surface-2 p-3"><dt className="text-shop-muted">À domicile</dt><dd className="tabular mt-0.5 font-semibold">{domicile === null ? (hasAgency ? '…' : 'Sur confirmation') : domicile > 0 ? formatDA(domicile) : 'Gratuite'}</dd></div>
          <div className="rounded-xl bg-shop-surface-2 p-3"><dt className="text-shop-muted">Stop-desk</dt><dd className="tabular mt-0.5 font-semibold">{bureau === null ? (hasAgency ? '…' : 'Sur confirmation') : bureau > 0 ? formatDA(bureau) : 'Gratuite'}</dd></div>
        </dl>
      )}
      <p className="mt-3 text-xs text-shop-muted">Délai estimé : {storeConfig.delivery.delayText}.</p>
    </div>
  );
}

function CompatChecker({ p, waNumber }: { p: ShopProduct; waNumber: string }) {
  const [model, setModel] = useState('');
  const [checked, setChecked] = useState(false);
  const score = checked ? matchScore(p, model) : -1;
  const verdict = score >= 90 ? 'yes' : score >= 50 ? 'maybe' : score >= 0 ? 'no' : null;
  return (
    <form className="mt-4 rounded-2xl border border-shop-border bg-shop-surface p-5" onSubmit={(e) => { e.preventDefault(); if (model.trim()) setChecked(true); }}>
      <label htmlFor="compat" className="mb-3 block text-base font-semibold">Vérifier la compatibilité</label>
      <div className="flex gap-2">
        <Input id="compat" value={model} onChange={(e) => { setModel(e.target.value); setChecked(false); }} placeholder="Modèle de votre PC (ex. Latitude 5480)" />
        <Button type="submit" variant="outline">Vérifier</Button>
      </div>
      {verdict === 'yes' && <p className="mt-3 flex items-center gap-2 text-sm font-medium text-shop-success"><CheckCircle2 className="h-5 w-5" /> Compatible avec votre {model}.</p>}
      {verdict === 'maybe' && <p className="mt-3 flex items-center gap-2 text-sm font-medium text-shop-warning"><HelpCircle className="h-5 w-5" /> Probablement compatible — confirmez avec nous sur WhatsApp.</p>}
      {verdict === 'no' && <p className="mt-3 flex items-center gap-2 text-sm font-medium text-shop-danger"><XCircle className="h-5 w-5" /> Modèle non listé pour ce chargeur.</p>}
      {verdict && verdict !== 'yes' && (
        <a href={whatsappLink(waNumber, `Bonjour M NEXT, le ${p.title} est-il compatible avec mon ${model} ?`)} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-shop-electric hover:underline">
          <MessageCircle className="h-4 w-4" /> Demander sur WhatsApp
        </a>
      )}
    </form>
  );
}

function Collapsible({ title, children, defaultOpen }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(!!defaultOpen);
  return (
    <div className="rounded-2xl border border-shop-border bg-shop-surface">
      <h2 style={{ fontFamily: 'Inter, sans-serif', letterSpacing: 0 }}>
        <button className="flex w-full items-center justify-between px-5 py-4 text-start text-base font-semibold" aria-expanded={open} onClick={() => setOpen(!open)}>
          {title}<ChevronDown className={cn('h-5 w-5 text-shop-muted transition-transform', open && 'rotate-180')} />
        </button>
      </h2>
      {open && <div className="px-5 pb-5 text-sm leading-relaxed text-shop-muted">{children}</div>}
    </div>
  );
}

function ProductSkeleton() {
  return (
    <div className="mx-auto grid max-w-[1280px] gap-8 px-4 py-10 lg:grid-cols-2">
      <div className="aspect-square animate-pulse rounded-[24px] bg-shop-surface-2" />
      <div className="space-y-4">
        <div className="h-6 w-24 animate-pulse rounded bg-shop-surface-2" />
        <div className="h-10 w-3/4 animate-pulse rounded bg-shop-surface-2" />
        <div className="h-40 animate-pulse rounded-2xl bg-shop-surface-2" />
      </div>
    </div>
  );
}
