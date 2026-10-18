import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, MessageCircle, Check, ChevronRight, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ShopProduct } from '../lib/catalog';
import { useStoreSettings, whatsappLink } from '../lib/catalog';
import { storeConfig } from '../storeConfig';
import { ChargeBar, btnClass, fieldCls } from './ui';
import { ProductCard } from './ProductCard';

const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ').trim();

/** Scores how well a product matches a laptop model query (0 = no match). */
export function matchScore(p: ShopProduct, query: string): number {
  const q = norm(query);
  if (!q) return 0;
  const tokens = q.split(' ').filter((t) => t.length > 1);
  let best = 0;
  for (const m of p.compatibleModels) {
    const nm = norm(m);
    if (nm === q || nm.includes(q)) return 100;
    const hits = tokens.filter((t) => nm.includes(t)).length;
    best = Math.max(best, Math.round((hits / Math.max(tokens.length, 1)) * 80));
  }
  if (p.searchText.includes(q)) best = Math.max(best, 60);
  return best;
}

export function Finder({ products, compact }: { products: ShopProduct[]; compact?: boolean }) {
  const settings = useStoreSettings();
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const step = !brand ? 1 : !submitted ? 2 : 3;

  const brands = useMemo(() => {
    const present = new Set(products.map((p) => p.brand));
    return storeConfig.brands.filter((b) => present.has(b)).concat([...present].filter((b) => !storeConfig.brands.includes(b) && b !== 'Autre'));
  }, [products]);

  const suggestions = useMemo(() => {
    const pool = new Set<string>();
    products.filter((p) => !brand || p.brand === brand).forEach((p) => p.compatibleModels.forEach((m) => pool.add(m)));
    const q = norm(model);
    return [...pool].filter((m) => !q || norm(m).includes(q)).slice(0, 8);
  }, [products, brand, model]);

  const results = useMemo(() => {
    const inBrand = products.filter((p) => p.brand === brand);
    if (!model.trim()) return inBrand.slice(0, 8);
    return inBrand
      .map((p) => ({ p, s: matchScore(p, model) }))
      .filter((r) => r.s >= 50)
      .sort((a, b) => b.s - a.s)
      .map((r) => r.p)
      .slice(0, 8);
  }, [products, brand, model]);

  const reset = () => { setBrand(''); setModel(''); setSubmitted(false); };

  return (
    <section aria-labelledby="finder-title" className={cn('shop-card overflow-hidden', compact ? 'p-5' : 'p-5 md:p-8')}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 id="finder-title" className="text-xl font-bold md:text-2xl">Trouver mon chargeur</h2>
          <p className="mt-1 text-sm text-shop-muted">En 3 étapes : marque, modèle de PC, résultat compatible.</p>
        </div>
        {step > 1 && (
          <button onClick={reset} className="inline-flex items-center gap-1.5 text-sm font-medium text-shop-muted hover:text-shop-text"><RotateCcw className="h-4 w-4" /> Recommencer</button>
        )}
      </div>

      <ol className="mt-5 grid grid-cols-3 gap-3" aria-label="Étapes">
        {['Marque', 'Modèle', 'Résultat'].map((label, i) => (
          <li key={label} className="space-y-1.5">
            <ChargeBar value={step > i + 1 ? 100 : step === i + 1 ? 50 : 0} label={label} />
            <span className={cn('text-xs font-medium', step >= i + 1 ? 'text-shop-text' : 'text-shop-muted')}>{i + 1}. {label}</span>
          </li>
        ))}
      </ol>

      <div className="mt-6">
        {/* Step 1 — brand */}
        <p className="mb-3 text-sm font-semibold">1. Quelle est la marque de votre PC ?</p>
        <div className="flex flex-wrap gap-2">
          {brands.map((b) => (
            <button
              key={b}
              onClick={() => { setBrand(b); setSubmitted(false); }}
              aria-pressed={brand === b}
              className={cn('inline-flex h-11 items-center gap-1.5 rounded-full border px-4 text-sm font-semibold transition-colors',
                brand === b ? 'border-shop-text bg-shop-primary text-shop-primary-fg' : 'border-shop-border bg-shop-surface hover:border-shop-text')}
            >
              {brand === b && <Check className="h-4 w-4" />}{b}
            </button>
          ))}
        </div>

        {/* Step 2 — model */}
        {brand && (
          <form className="mt-6" onSubmit={(e) => { e.preventDefault(); setSubmitted(true); }}>
            <label htmlFor="finder-model" className="mb-3 block text-sm font-semibold">2. Quel est le modèle de votre PC ? <span className="font-normal text-shop-muted">(optionnel)</span></label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute start-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-shop-muted" />
                <input id="finder-model" list="finder-models" value={model} onChange={(e) => { setModel(e.target.value); setSubmitted(false); }}
                  placeholder={`ex. ${suggestions[0] || `${brand} …`}`} className={cn(fieldCls, 'ps-10')} autoComplete="off" />
                <datalist id="finder-models">{suggestions.map((s) => <option key={s} value={s} />)}</datalist>
              </div>
              <button type="submit" className={btnClass('volt', 'md')}>Voir les chargeurs <ChevronRight /></button>
            </div>
            {suggestions.length > 0 && !submitted && (
              <div className="mt-3 flex flex-wrap gap-2">
                {suggestions.slice(0, 5).map((s) => (
                  <button type="button" key={s} onClick={() => { setModel(s); setSubmitted(true); }} className="rounded-full bg-shop-surface-2 px-3 py-1.5 text-xs font-medium hover:bg-shop-border">{s}</button>
                ))}
              </div>
            )}
          </form>
        )}

        {/* Step 3 — results */}
        {submitted && (
          <div className="mt-8">
            <p className="mb-4 text-sm font-semibold">
              3. {results.length > 0 ? `${results.length} chargeur${results.length > 1 ? 's' : ''} compatible${results.length > 1 ? 's' : ''}${model ? ` avec « ${model} »` : ` ${brand}`}` : 'Aucun résultat certain'}
            </p>
            {results.length > 0 && (
              <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
                {results.map((p) => <ProductCard key={p.id} product={p} />)}
              </div>
            )}
            <div className="mt-5 flex flex-col items-start gap-3 rounded-2xl bg-shop-volt-soft p-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm font-medium">Pas sûr ? Envoyez-nous une photo de votre chargeur ou de l'étiquette sous votre PC sur WhatsApp.</p>
              <a href={whatsappLink(settings.whatsapp, `${storeConfig.whatsappMessage}${brand} ${model}`.trim())} target="_blank" rel="noopener noreferrer" className={btnClass('primary', 'md')}>
                <MessageCircle /> WhatsApp
              </a>
            </div>
            <Link to={`/website-shop/offers?brand=${encodeURIComponent(brand)}${model ? `&q=${encodeURIComponent(model)}` : ''}`} className="mt-4 inline-block text-sm font-semibold text-shop-electric hover:underline">
              Voir tout le catalogue {brand} →
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
