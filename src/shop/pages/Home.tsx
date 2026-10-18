import { useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BadgeCheck, ShieldCheck, Wallet, Truck, MessageCircle, Star, Quote } from 'lucide-react';
import { toast } from 'sonner';
import { createTestimonial } from '@/lib/supabaseClient';
import { useCatalog, useReviews, useStoreSettings, whatsappLink, loadReviews } from '../lib/catalog';
import { storeConfig } from '../storeConfig';
import { WHY, FAQ } from '../content';
import { Seo, organizationLd, faqLd } from '../components/Seo';
import { Finder } from '../components/Finder';
import { ProductCard, ProductCardSkeleton } from '../components/ProductCard';
import { CountUp, FaqList, ChargerIllustration } from '../components/sections';
import { Button, ChargeBar, Field, Input, Modal, Rating, SectionHeader, btnClass } from '../components/ui';

const TRUST_ROW = [
  { icon: BadgeCheck, label: 'Testé avant livraison' },
  { icon: ShieldCheck, label: storeConfig.guarantee.short },
  { icon: Wallet, label: 'Paiement à la livraison' },
  { icon: Truck, label: '69 wilayas' },
];

export default function Home() {
  const { products, loading } = useCatalog();
  const { reviews } = useReviews();
  const settings = useStoreSettings();
  const finderRef = useRef<HTMLDivElement>(null);
  const [reviewOpen, setReviewOpen] = useState(false);

  const featured = useMemo(() => {
    const flagged = products.filter((p) => p.featured);
    const pool = flagged.length ? flagged : [...products].filter((p) => p.price > 0).sort((a, b) => (b.wattage || 0) - (a.wattage || 0));
    return pool.slice(0, 8);
  }, [products]);
  const promos = useMemo(() => products.filter((p) => p.oldPrice).slice(0, 8), [products]);
  const brandCounts = useMemo(() => {
    const m = new Map<string, { n: number; logo?: string }>();
    products.forEach((p) => { const c = m.get(p.brand) || { n: 0 }; c.n++; c.logo ||= p.brandLogo; m.set(p.brand, c); });
    return m;
  }, [products]);
  const powers = useMemo(() => [...new Set(products.map((p) => p.wattage).filter(Boolean) as number[])].sort((a, b) => a - b), [products]);
  const connectors = useMemo(() => [...new Set(products.map((p) => p.connector).filter(Boolean) as string[])], [products]);
  const avg = reviews.length ? reviews.reduce((s, r) => s + (r.rating || 5), 0) / reviews.length : 0;
  const heroImages = products.filter((p) => p.images[0]).slice(0, 3);

  const scrollToFinder = () => finderRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  return (
    <>
      <Seo jsonLd={[organizationLd(settings.phone, settings.logoUrl), faqLd(FAQ)]} />

      {/* 1. Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_60%_at_85%_10%,rgba(198,244,50,0.22),transparent_70%)]" />
        <div className="relative mx-auto grid max-w-[1280px] items-center gap-10 px-4 pb-10 pt-10 md:pt-16 lg:grid-cols-[1.1fr_0.9fr] lg:pb-16">
          <div>
            <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-shop-border bg-shop-surface px-3 py-1 text-xs font-semibold">
              <span className="h-2 w-2 rounded-full bg-shop-success" /> Chargeurs originaux &amp; testés
            </p>
            <h1 className="text-[34px] font-bold sm:text-[44px] lg:text-[56px]">
              Le bon chargeur pour votre PC, <span className="relative whitespace-nowrap">livré partout<span className="absolute inset-x-0 -bottom-1 h-2 rounded-full bg-shop-volt/80 -z-10" /></span> en Algérie
            </h1>
            <p className="mt-5 max-w-xl text-base text-shop-muted md:text-lg">
              Chargeurs originaux HP, Dell, Lenovo, Surface, Apple… testés un par un avant l'envoi et garantis {storeConfig.guarantee.months} mois. Vous payez à la livraison.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Button variant="volt" size="lg" onClick={scrollToFinder}>Trouver mon chargeur <ArrowRight /></Button>
              <Link to="/website-shop/offers" className={btnClass('outline', 'lg')}>Voir la boutique</Link>
            </div>
            <ul className="mt-8 grid grid-cols-2 gap-x-6 gap-y-3 sm:flex sm:flex-wrap">
              {TRUST_ROW.map(({ icon: Icon, label }) => (
                <li key={label} className="inline-flex items-center gap-2 text-sm font-medium"><Icon className="h-[18px] w-[18px] text-shop-success" />{label}</li>
              ))}
            </ul>
          </div>
          <div className="relative">
            <div className="relative mx-auto aspect-[6/5] max-w-[560px] overflow-hidden rounded-[24px] border border-shop-border bg-shop-surface">
              {settings.heroImage ? (
                <img src={settings.heroImage} alt="Chargeurs M NEXT" className="h-full w-full object-cover" fetchPriority="high" />
              ) : heroImages.length >= 2 ? (
                <div className="grid h-full grid-cols-2 gap-2 p-4">
                  {heroImages.map((p, i) => (
                    <img key={p.id} src={p.images[0]} alt={p.title} className={i === 0 ? 'row-span-2 h-full w-full rounded-2xl object-contain' : 'h-full w-full rounded-2xl object-contain'} />
                  ))}
                </div>
              ) : (
                <ChargerIllustration className="h-full w-full p-8" />
              )}
              <div className="absolute inset-x-5 bottom-5 rounded-2xl border border-shop-border bg-shop-surface/95 p-4 backdrop-blur">
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="font-semibold">Votre commande</span>
                  <span className="text-shop-muted">Livraison {storeConfig.delivery.delayText}</span>
                </div>
                <ChargeBar value={72} label="Progression" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-[1280px] space-y-16 px-4 md:space-y-24">
        {/* 2. Finder */}
        <div ref={finderRef} className="scroll-mt-24">
          {loading ? <div className="shop-card h-64 animate-pulse" /> : <Finder products={products} />}
        </div>

        {/* 3. Brands */}
        <section>
          <SectionHeader eyebrow="Marques" title="Choisissez par marque" />
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
            {(storeConfig.brands.some((b) => brandCounts.get(b)) ? storeConfig.brands.filter((b) => brandCounts.get(b)) : storeConfig.brands).map((b) => {
              const c = brandCounts.get(b);
              return (
                <Link key={b} to={`/website-shop/offers?brand=${encodeURIComponent(b)}`}
                  className="shop-card shop-lift flex aspect-square flex-col items-center justify-center gap-1 p-3 text-center">
                  {c?.logo ? <img src={c.logo} alt={b} className="h-8 w-auto max-w-[80%] object-contain" loading="lazy" /> : <span className="font-sora text-lg font-bold">{b}</span>}
                  <span className="tabular text-xs text-shop-muted">{c?.n ?? 0} produit{(c?.n ?? 0) > 1 ? 's' : ''}</span>
                </Link>
              );
            })}
          </div>
        </section>

        {/* 4. Power / connector */}
        {(powers.length > 0 || connectors.length > 0) && (
          <section>
            <SectionHeader eyebrow="Puissance & connecteur" title="Vous connaissez la puissance ?" subtitle="Elle est écrite sur votre ancien chargeur (ex. 19.5V 3.34A = 65W)." />
            <div className="flex flex-wrap gap-2">
              {powers.map((w) => (
                <Link key={w} to={`/website-shop/offers?power=${w}`} className="tabular inline-flex h-11 items-center rounded-full border border-shop-border bg-shop-surface px-4 text-sm font-semibold hover:border-shop-text">{w}W</Link>
              ))}
              {connectors.map((c) => (
                <Link key={c} to={`/website-shop/offers?connector=${encodeURIComponent(c)}`} className="inline-flex h-11 items-center rounded-full bg-shop-surface-2 px-4 text-sm font-medium hover:bg-shop-border">{c}</Link>
              ))}
            </div>
          </section>
        )}

        {/* 5. Featured */}
        <section>
          <SectionHeader eyebrow="Sélection" title="Les plus demandés" action={<Link to="/website-shop/offers" className="text-sm font-semibold text-shop-electric hover:underline">Tout voir →</Link>} />
          <div className="shop-no-scrollbar -mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2 md:mx-0 md:grid md:grid-cols-3 md:gap-4 md:overflow-visible md:px-0 lg:grid-cols-4">
            {loading
              ? Array.from({ length: 4 }).map((_, i) => <div key={i} className="w-[46%] shrink-0 snap-start md:w-auto"><ProductCardSkeleton /></div>)
              : featured.map((p, i) => <div key={p.id} className="w-[46%] shrink-0 snap-start sm:w-[32%] md:w-auto"><ProductCard product={p} priority={i < 2} /></div>)}
          </div>
        </section>

        {/* 6. Promotions */}
        {promos.length > 0 && (
          <section className="rounded-[24px] bg-shop-primary p-5 text-shop-primary-fg md:p-8">
            <SectionHeader title="Promotions en cours" className="[&_p]:text-shop-primary-fg/70" action={<Link to="/website-shop/special-offers" className={btnClass('volt', 'md')}>Voir les promos</Link>} />
            <div className="shop-no-scrollbar -mx-5 flex gap-3 overflow-x-auto px-5 md:mx-0 md:grid md:grid-cols-4 md:px-0">
              {promos.slice(0, 4).map((p) => <div key={p.id} className="w-[46%] shrink-0 text-shop-text md:w-auto"><ProductCard product={p} /></div>)}
            </div>
          </section>
        )}

        {/* 7. Why */}
        <section>
          <SectionHeader eyebrow="Pourquoi M NEXT" title="Acheter un chargeur sans risque" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {WHY.map(({ icon: Icon, title, text }) => (
              <div key={title} className="shop-card p-6">
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-shop-volt-soft"><Icon className="h-[22px] w-[22px]" /></div>
                <h3 className="text-base font-semibold">{title}</h3>
                <p className="mt-1.5 text-sm text-shop-muted">{text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 8. Stats */}
        <section className="grid grid-cols-2 gap-4 lg:grid-cols-4" aria-label="Chiffres clés">
          {[
            { v: products.length, s: '+', label: 'Chargeurs au catalogue' },
            { v: storeConfig.delivery.wilayaCount, s: '', label: 'Wilayas livrées' },
            { v: storeConfig.guarantee.months, s: ' mois', label: 'De garantie' },
            { v: 7, s: 'j/7', label: 'Support WhatsApp' },
          ].map((st) => (
            <div key={st.label} className="shop-card p-5 md:p-6">
              <p className="font-sora text-3xl font-bold md:text-[40px]">{loading && st.label.startsWith('Chargeurs') ? '—' : <CountUp value={st.v} suffix={st.s} />}</p>
              <p className="mt-1 text-sm text-shop-muted">{st.label}</p>
              <ChargeBar value={100} className="mt-4 h-1" />
            </div>
          ))}
        </section>

        {/* 9. Reviews */}
        <section>
          {reviews.length > 0 ? (
            <>
              <SectionHeader eyebrow="Avis clients" title="Ils ont rechargé avec nous"
                action={<div className="flex items-center gap-3"><Rating value={avg} /><span className="tabular text-sm font-semibold">{avg.toFixed(1)}/5 · {reviews.length} avis</span></div>} />
              <div className="shop-no-scrollbar -mx-4 flex snap-x gap-4 overflow-x-auto px-4 md:mx-0 md:grid md:grid-cols-3 md:px-0">
                {reviews.slice(0, 6).map((r) => (
                  <figure key={r.id} className="shop-card w-[85%] shrink-0 snap-start p-6 md:w-auto">
                    <Quote className="mb-3 h-6 w-6 text-shop-muted" />
                    <blockquote className="text-[15px] leading-relaxed">{r.opinion}</blockquote>
                    <figcaption className="mt-4 flex items-center justify-between">
                      <span className="text-sm font-semibold">{r.client_name}</span>
                      <Rating value={r.rating || 5} size={14} />
                    </figcaption>
                  </figure>
                ))}
              </div>
              <Button variant="outline" className="mt-5" onClick={() => setReviewOpen(true)}><Star /> Laisser un avis</Button>
            </>
          ) : (
            <div className="shop-card flex flex-col items-start justify-between gap-4 p-6 sm:flex-row sm:items-center">
              <div>
                <h2 className="text-lg font-semibold">Vous avez déjà commandé chez nous ?</h2>
                <p className="text-sm text-shop-muted">Laissez le premier avis et aidez les autres clients à choisir.</p>
              </div>
              <Button variant="outline" onClick={() => setReviewOpen(true)}><Star /> Laisser un avis</Button>
            </div>
          )}
        </section>

        {/* 10. FAQ */}
        <section className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
          <SectionHeader eyebrow="FAQ" title="Vos questions, nos réponses" subtitle="Vous ne trouvez pas la réponse ? Écrivez-nous sur WhatsApp." className="mb-0" />
          <FaqList />
        </section>

        {/* 11. Final CTA */}
        <section className="relative overflow-hidden rounded-[24px] border border-shop-border bg-shop-surface p-8 md:p-12">
          <div className="pointer-events-none absolute -end-20 -top-20 h-64 w-64 rounded-full bg-shop-volt/30 blur-3xl" />
          <div className="relative flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
            <div>
              <h2 className="text-2xl font-bold md:text-[32px]">Un doute sur le modèle ?</h2>
              <p className="mt-2 max-w-lg text-shop-muted">Envoyez une photo de l'étiquette de votre PC sur WhatsApp : on vous indique le bon chargeur en quelques minutes.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <a href={whatsappLink(settings.whatsapp)} target="_blank" rel="noopener noreferrer" className={btnClass('primary', 'lg')}><MessageCircle /> WhatsApp</a>
              <Link to="/website-shop/offers" className={btnClass('outline', 'lg')}>Voir la boutique</Link>
            </div>
          </div>
        </section>
      </div>

      <ReviewModal open={reviewOpen} onOpenChange={setReviewOpen} />
    </>
  );
}

export function ReviewModal({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const [name, setName] = useState('');
  const [text, setText] = useState('');
  const [rating, setRating] = useState(5);
  const [busy, setBusy] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || text.trim().length < 5) return;
    setBusy(true);
    const res = await createTestimonial(name.trim(), text.trim(), rating);
    setBusy(false);
    if (res) {
      toast.success('Merci ! Votre avis sera publié après validation.');
      loadReviews(true);
      onOpenChange(false); setName(''); setText(''); setRating(5);
    } else toast.error("Impossible d'envoyer l'avis. Réessayez.");
  };
  return (
    <Modal open={open} onOpenChange={onOpenChange} title="Laisser un avis">
      <form onSubmit={submit} className="space-y-4">
        <Field label="Votre note" htmlFor="rv-rating">
          <div id="rv-rating" className="flex gap-1" role="radiogroup">
            {[1, 2, 3, 4, 5].map((i) => (
              <button type="button" key={i} role="radio" aria-checked={rating === i} aria-label={`${i} étoile${i > 1 ? 's' : ''}`} onClick={() => setRating(i)} className="p-1">
                <Star className={i <= rating ? 'h-7 w-7 fill-[#F5B400] text-[#F5B400]' : 'h-7 w-7 text-shop-border'} />
              </button>
            ))}
          </div>
        </Field>
        <Field label="Nom" htmlFor="rv-name" required><Input id="rv-name" value={name} onChange={(e) => setName(e.target.value)} required maxLength={60} /></Field>
        <Field label="Votre avis" htmlFor="rv-text" required>
          <textarea id="rv-text" value={text} onChange={(e) => setText(e.target.value)} required minLength={5} maxLength={600} rows={4}
            className="w-full rounded-[10px] border border-shop-border bg-shop-surface p-3 text-[16px] focus:border-shop-electric focus:outline-none focus:ring-2 focus:ring-shop-electric/25 md:text-sm" />
        </Field>
        <Button type="submit" variant="primary" className="w-full" disabled={busy}>{busy ? 'Envoi…' : 'Publier mon avis'}</Button>
      </form>
    </Modal>
  );
}
