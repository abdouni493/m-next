import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, Minus, Plus, Trash2, CheckCircle2, MessageCircle, Phone, ChevronDown, Wallet, Lock, Tag } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { createOrderREST } from '@/lib/supabaseClient';
import { cart, useCart, type CartItem } from '../lib/cart';
import { formatDA, normalizeDzPhone } from '../lib/format';
import { track } from '../lib/track';
import { useAgencies, deliveryPrice, type DeliveryType } from '../lib/delivery';
import { useStoreSettings, whatsappLink } from '../lib/catalog';
import { WILAYAS, communesFor } from '../wilayas';
import { storeConfig } from '../storeConfig';
import { Seo } from '../components/Seo';
import { Button, ChargeBar, EmptyState, Field, Input, ProductImage, Select, btnClass } from '../components/ui';

/** Payment methods — only cash on delivery for now; CIB / Edahabia can be enabled later. */
const PAYMENT_METHODS = [
  { id: 'cod', label: 'Paiement à la livraison', description: 'Vous payez en espèces au livreur.', enabled: true },
  { id: 'cib', label: 'Carte CIB / Edahabia', description: 'Bientôt disponible', enabled: false },
] as const;

const LAST_ORDER_KEY = 'shop:lastOrder';

interface Form { name: string; phone: string; wilaya: string; commune: string; address: string; type: DeliveryType; agencyId: string; note: string; website: string }

const cartSignature = (items: CartItem[]) => items.map((i) => `${i.product_id}x${i.quantity}`).sort().join('|');

export default function Checkout() {
  const { items, subtotal, count } = useCart();
  const agencies = useAgencies();
  const settings = useStoreSettings();
  const [form, setForm] = useState<Form>(() => {
    let wilaya = '';
    try { wilaya = localStorage.getItem('shop:wilaya') || ''; } catch { /* ignore */ }
    return { name: '', phone: '', wilaya, commune: '', address: '', type: 'domicile', agencyId: '', note: '', website: '' };
  });
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [fee, setFee] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<null | { number: string; items: CartItem[]; subtotal: number; fee: number; total: number; form: Form }>(null);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [promo, setPromo] = useState('');

  useEffect(() => { track('begin_checkout', { value: subtotal, items: count }); // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => { if (!form.agencyId && agencies[0]) setForm((f) => ({ ...f, agencyId: agencies[0].id })); }, [agencies, form.agencyId]);
  const agency = agencies.find((a) => a.id === form.agencyId);
  useEffect(() => {
    let alive = true;
    setFee(null);
    deliveryPrice(agency, form.wilaya, form.type).then((v) => alive && setFee(v));
    return () => { alive = false; };
  }, [agency, form.wilaya, form.type]);

  const communes = useMemo(() => communesFor(form.wilaya), [form.wilaya]);
  const phone = normalizeDzPhone(form.phone);
  const errors: Partial<Record<keyof Form, string>> = {
    name: form.name.trim().length < 3 ? 'Entrez votre nom complet.' : undefined,
    phone: !phone ? 'Numéro mobile invalide (ex. 0555 12 34 56 ou +213 555 12 34 56).' : undefined,
    wilaya: !form.wilaya ? 'Choisissez votre wilaya.' : undefined,
    commune: !form.commune.trim() ? 'Indiquez votre commune.' : undefined,
    address: form.type === 'domicile' && form.address.trim().length < 4 ? 'Indiquez votre adresse de livraison.' : undefined,
  };
  const infosOk = !errors.name && !errors.phone;
  const deliveryOk = infosOk && !errors.wilaya && !errors.commune && !errors.address;
  const step = !infosOk ? 1 : !deliveryOk ? 2 : 3;
  const total = subtotal + (fee || 0);

  const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm((f) => ({ ...f, [k]: v }));
  const err = (k: keyof Form) => (touched[k] ? errors[k] : undefined);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ name: true, phone: true, wilaya: true, commune: true, address: true });
    if (form.website) return; // honeypot: bots fill hidden fields
    if (!deliveryOk || !phone || items.length === 0) {
      toast.error('Vérifiez les champs en rouge.');
      document.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
      return;
    }
    // Duplicate / rapid re-submit guard
    try {
      const last = JSON.parse(localStorage.getItem(LAST_ORDER_KEY) || 'null');
      const windowMs = storeConfig.orderRateLimitMinutes * 60_000;
      if (last && Date.now() - last.at < windowMs && last.phone === phone && last.sig === cartSignature(items)) {
        toast.error(`Cette commande a déjà été envoyée il y a moins de ${storeConfig.orderRateLimitMinutes} minutes. Nous vous appellerons pour confirmer.`);
        return;
      }
    } catch { /* ignore */ }

    setSubmitting(true);
    const address = [form.type === 'domicile' ? form.address.trim() : `Stop-desk ${agency?.name || ''}`.trim(), form.commune.trim(), form.wilaya].filter(Boolean).join(', ')
      + (form.note.trim() ? ` | Note : ${form.note.trim()}` : '');
    try {
      const order = await createOrderREST({
        customer_name: form.name.trim(),
        customer_phone: phone,
        customer_wilaya: form.wilaya,
        customer_address: address,
        delivery_agency_id: form.agencyId || null,
        delivery_type: form.type,
        delivery_price: fee || 0,
        status: 'pending',
        total_price: total,
      }, items);
      const number = String(order.id).slice(0, 8).toUpperCase();
      try { localStorage.setItem(LAST_ORDER_KEY, JSON.stringify({ at: Date.now(), phone, sig: cartSignature(items), number })); localStorage.setItem('shop:wilaya', form.wilaya); } catch { /* ignore */ }
      track('purchase', { transaction_id: order.id, value: total, shipping: fee || 0 });
      setDone({ number, items, subtotal, fee: fee || 0, total, form });
      cart.clear();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      console.error(error);
      toast.error("La commande n'a pas pu être envoyée. Réessayez ou commandez sur WhatsApp.");
    } finally {
      setSubmitting(false);
    }
  };

  if (done) return <Confirmation done={done} wa={settings.whatsapp} />;

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-[1280px] px-4 py-12">
        <Seo title="Panier" noindex />
        <EmptyState icon={ShoppingBag} title="Votre panier est vide" text="Trouvez le chargeur qui correspond à votre PC en quelques clics."
          action={<><Link to="/website-shop/offers" className={btnClass('primary', 'md')}>Voir la boutique</Link><Link to="/website-shop/special-offers" className={btnClass('outline', 'md')}>Promotions</Link></>} />
      </div>
    );
  }

  const summary = (
    <div className="space-y-4">
      <ul className="divide-y divide-shop-border">
        {items.map((i) => (
          <li key={i.product_id + i.price} className="flex gap-3 py-3">
            <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-shop-surface-2"><ProductImage src={i.image} alt={i.name} className="p-1.5" /></div>
            <div className="min-w-0 flex-1">
              <p className="line-clamp-2 text-sm font-semibold">{i.name}</p>
              {i.product_description && <p className="tabular truncate text-xs text-shop-muted">{i.product_description}</p>}
              <div className="mt-1.5 flex items-center justify-between">
                <div className="inline-flex items-center rounded-lg border border-shop-border">
                  <button type="button" className="flex h-8 w-8 items-center justify-center disabled:opacity-40" onClick={() => cart.setQty(i.product_id, i.quantity - 1)} disabled={i.quantity <= 1} aria-label="Diminuer"><Minus className="h-3.5 w-3.5" /></button>
                  <span className="tabular w-6 text-center text-sm font-semibold">{i.quantity}</span>
                  <button type="button" className="flex h-8 w-8 items-center justify-center" onClick={() => cart.setQty(i.product_id, i.quantity + 1)} aria-label="Augmenter"><Plus className="h-3.5 w-3.5" /></button>
                </div>
                <span className="tabular text-sm font-bold">{formatDA(i.price * i.quantity)}</span>
              </div>
            </div>
            <button type="button" onClick={() => cart.remove(i.product_id)} className="flex h-8 w-8 items-center justify-center rounded-lg text-shop-muted hover:text-shop-danger" aria-label={`Retirer ${i.name}`}><Trash2 className="h-4 w-4" /></button>
          </li>
        ))}
      </ul>
      {storeConfig.features.promoCode && (
        <div className="flex gap-2"><Input placeholder="Code promo" value={promo} onChange={(e) => setPromo(e.target.value)} aria-label="Code promo" /><Button variant="outline" type="button"><Tag /> Appliquer</Button></div>
      )}
      <dl className="space-y-2 border-t border-shop-border pt-4 text-sm">
        <div className="flex justify-between"><dt className="text-shop-muted">Sous-total ({count} article{count > 1 ? 's' : ''})</dt><dd className="tabular font-medium">{formatDA(subtotal)}</dd></div>
        <div className="flex justify-between"><dt className="text-shop-muted">Livraison {form.type === 'bureau' ? '(stop-desk)' : '(domicile)'}</dt><dd className="tabular font-medium">{!form.wilaya ? 'Choisissez la wilaya' : fee === null ? (agencies.length ? '…' : 'Sur confirmation') : fee > 0 ? formatDA(fee) : 'Gratuite'}</dd></div>
        <div className="flex items-baseline justify-between border-t border-shop-border pt-3"><dt className="font-semibold">Total</dt><dd className="tabular font-sora text-2xl font-bold">{formatDA(total)}</dd></div>
      </dl>
    </div>
  );

  return (
    <div className="mx-auto max-w-[1280px] px-4 py-8 md:py-10">
      <Seo title="Commande" noindex />
      <h1 className="text-3xl font-bold md:text-[40px]">Finaliser la commande</h1>
      <p className="mt-1 text-shop-muted">Sans compte · Paiement à la livraison · Nous vous appelons pour confirmer.</p>

      <ol className="mt-6 grid max-w-xl grid-cols-3 gap-3" aria-label="Étapes de la commande">
        {['Infos', 'Livraison', 'Confirmation'].map((l, i) => (
          <li key={l} className="space-y-1.5" aria-current={step === i + 1 ? 'step' : undefined}>
            <ChargeBar value={step > i + 1 ? 100 : step === i + 1 ? 50 : 0} label={l} />
            <span className={cn('text-xs font-semibold', step >= i + 1 ? 'text-shop-text' : 'text-shop-muted')}>{i + 1}. {l}</span>
          </li>
        ))}
      </ol>

      {/* Mobile collapsible summary */}
      <div className="mt-6 lg:hidden">
        <button type="button" onClick={() => setSummaryOpen(!summaryOpen)} aria-expanded={summaryOpen} className="shop-card flex w-full items-center justify-between p-4">
          <span className="flex items-center gap-2 text-sm font-semibold"><ShoppingBag className="h-[18px] w-[18px]" /> {summaryOpen ? 'Masquer' : 'Voir'} le récapitulatif</span>
          <span className="flex items-center gap-2"><span className="tabular font-sora font-bold">{formatDA(total)}</span><ChevronDown className={cn('h-5 w-5 transition-transform', summaryOpen && 'rotate-180')} /></span>
        </button>
        {summaryOpen && <div className="shop-card mt-2 p-4">{summary}</div>}
      </div>

      <form onSubmit={submit} noValidate className="mt-6 grid gap-8 lg:grid-cols-[1fr_400px]">
        <div className="space-y-6">
          {/* honeypot */}
          <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
            <label htmlFor="website">Site web</label>
            <input id="website" tabIndex={-1} autoComplete="off" value={form.website} onChange={(e) => set('website', e.target.value)} />
          </div>

          <fieldset className="shop-card space-y-4 p-5 md:p-6">
            <legend className="sr-only">Vos informations</legend>
            <h2 className="text-lg font-semibold">1. Vos informations</h2>
            <Field label="Nom complet" htmlFor="co-name" required error={err('name')}>
              <Input id="co-name" value={form.name} onChange={(e) => set('name', e.target.value)} onBlur={() => setTouched((t) => ({ ...t, name: true }))} autoComplete="name" aria-invalid={!!err('name')} />
            </Field>
            <Field label="Téléphone" htmlFor="co-phone" required error={err('phone')} hint="Nous vous appelons sur ce numéro pour confirmer la commande.">
              <Input id="co-phone" type="tel" inputMode="tel" value={form.phone} onChange={(e) => set('phone', e.target.value)} onBlur={() => setTouched((t) => ({ ...t, phone: true }))} autoComplete="tel" placeholder="05 55 12 34 56" aria-invalid={!!err('phone')} />
            </Field>
          </fieldset>

          <fieldset className="shop-card space-y-4 p-5 md:p-6">
            <legend className="sr-only">Livraison</legend>
            <h2 className="text-lg font-semibold">2. Livraison</h2>
            <div className="grid grid-cols-2 gap-3" role="radiogroup" aria-label="Type de livraison">
              {([['domicile', 'À domicile', 'Livré à votre adresse'], ['bureau', 'Stop-desk', 'Retrait au bureau du livreur']] as const).map(([v, l, d]) => (
                <label key={v} className={cn('flex cursor-pointer flex-col rounded-xl border p-4 transition-colors', form.type === v ? 'border-shop-text bg-shop-surface-2' : 'border-shop-border hover:border-shop-text')}>
                  <input type="radio" name="type" value={v} checked={form.type === v} onChange={() => set('type', v)} className="sr-only" />
                  <span className="text-sm font-semibold">{l}</span><span className="text-xs text-shop-muted">{d}</span>
                </label>
              ))}
            </div>
            {agencies.length > 1 && (
              <Field label="Société de livraison" htmlFor="co-agency">
                <Select id="co-agency" value={form.agencyId} onChange={(e) => set('agencyId', e.target.value)}>{agencies.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}</Select>
              </Field>
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Wilaya" htmlFor="co-wilaya" required error={err('wilaya')}>
                <Select id="co-wilaya" value={form.wilaya} onChange={(e) => { set('wilaya', e.target.value); set('commune', ''); }} onBlur={() => setTouched((t) => ({ ...t, wilaya: true }))} aria-invalid={!!err('wilaya')}>
                  <option value="">Choisir…</option>
                  {WILAYAS.map((w) => <option key={w.code} value={w.name}>{w.code} — {w.name}</option>)}
                </Select>
              </Field>
              <Field label="Commune" htmlFor="co-commune" required error={err('commune')}>
                {communes.length ? (
                  <Select id="co-commune" value={form.commune} onChange={(e) => set('commune', e.target.value)} onBlur={() => setTouched((t) => ({ ...t, commune: true }))} disabled={!form.wilaya} aria-invalid={!!err('commune')}>
                    <option value="">{form.wilaya ? 'Choisir…' : "Choisissez d'abord la wilaya"}</option>
                    {communes.map((c) => <option key={c} value={c}>{c}</option>)}
                  </Select>
                ) : (
                  <Input id="co-commune" value={form.commune} onChange={(e) => set('commune', e.target.value)} onBlur={() => setTouched((t) => ({ ...t, commune: true }))} disabled={!form.wilaya} placeholder="Votre commune" aria-invalid={!!err('commune')} />
                )}
              </Field>
            </div>
            {form.type === 'domicile' && (
              <Field label="Adresse" htmlFor="co-address" required error={err('address')}>
                <Input id="co-address" value={form.address} onChange={(e) => set('address', e.target.value)} onBlur={() => setTouched((t) => ({ ...t, address: true }))} autoComplete="street-address" placeholder="Rue, quartier, n° de bâtiment…" aria-invalid={!!err('address')} />
              </Field>
            )}
            <Field label="Note (optionnel)" htmlFor="co-note" hint="Ex. le modèle exact de votre PC, un créneau pour l'appel…">
              <Input id="co-note" value={form.note} onChange={(e) => set('note', e.target.value)} maxLength={200} />
            </Field>
          </fieldset>

          <fieldset className="shop-card space-y-3 p-5 md:p-6">
            <legend className="sr-only">Paiement</legend>
            <h2 className="text-lg font-semibold">3. Paiement</h2>
            {PAYMENT_METHODS.map((m) => (
              <label key={m.id} className={cn('flex items-center gap-3 rounded-xl border p-4', m.enabled ? 'cursor-pointer border-shop-text bg-shop-surface-2' : 'cursor-not-allowed border-shop-border opacity-55')}>
                <input type="radio" name="payment" checked={m.id === 'cod'} disabled={!m.enabled} readOnly className="h-[18px] w-[18px] accent-[#0B1220] dark:accent-[#C6F432]" />
                <Wallet className="h-5 w-5" />
                <span><span className="block text-sm font-semibold">{m.label}</span><span className="block text-xs text-shop-muted">{m.description}</span></span>
              </label>
            ))}
          </fieldset>

          <div className="lg:hidden">
            <Button type="submit" variant="volt" size="lg" className="w-full" disabled={submitting}>{submitting ? 'Envoi…' : `Confirmer la commande · ${formatDA(total)}`}</Button>
            <p className="mt-2 flex items-center justify-center gap-1.5 text-xs text-shop-muted"><Lock className="h-3.5 w-3.5" /> Aucun paiement maintenant</p>
          </div>
        </div>

        <aside className="hidden lg:block">
          <div className="shop-card sticky top-24 p-6">
            <h2 className="mb-2 text-lg font-semibold">Récapitulatif</h2>
            {summary}
            <Button type="submit" variant="volt" size="lg" className="mt-5 w-full" disabled={submitting}>{submitting ? 'Envoi…' : 'Confirmer la commande'}</Button>
            <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-shop-muted"><Lock className="h-3.5 w-3.5" /> Aucun paiement maintenant · {storeConfig.guarantee.short}</p>
          </div>
        </aside>
      </form>
    </div>
  );
}

function Confirmation({ done, wa }: { done: { number: string; items: CartItem[]; subtotal: number; fee: number; total: number; form: Form }; wa: string }) {
  return (
    <div className="mx-auto max-w-2xl px-4 py-10 md:py-16">
      <Seo title="Commande confirmée" noindex />
      <div className="shop-card p-6 text-center md:p-10">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-shop-volt"><CheckCircle2 className="h-9 w-9 text-shop-volt-ink" /></div>
        <h1 className="text-2xl font-bold md:text-[32px]">Merci {done.form.name.split(' ')[0]} !</h1>
        <p className="mt-2 text-shop-muted">Votre commande <span className="tabular font-semibold text-shop-text">n° {done.number}</span> est bien reçue.</p>
        <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-shop-volt-soft px-4 py-2 text-sm font-medium"><Phone className="h-4 w-4" /> Nous vous appellerons au {done.form.phone} pour confirmer.</p>
        <ChargeBar value={100} className="mx-auto mt-6 max-w-xs" label="Commande envoyée" />
      </div>

      <div className="shop-card mt-4 p-6">
        <h2 className="mb-3 text-lg font-semibold">Récapitulatif</h2>
        <ul className="divide-y divide-shop-border text-sm">
          {done.items.map((i) => <li key={i.product_id + i.price} className="flex justify-between gap-4 py-2.5"><span>{i.quantity}× {i.name}</span><span className="tabular font-medium">{formatDA(i.price * i.quantity)}</span></li>)}
        </ul>
        <dl className="mt-3 space-y-1.5 border-t border-shop-border pt-3 text-sm">
          <div className="flex justify-between"><dt className="text-shop-muted">Livraison ({done.form.wilaya}, {done.form.type === 'bureau' ? 'stop-desk' : 'domicile'})</dt><dd className="tabular">{done.fee > 0 ? formatDA(done.fee) : 'Sur confirmation'}</dd></div>
          <div className="flex justify-between text-base font-semibold"><dt>Total à payer à la livraison</dt><dd className="tabular font-sora">{formatDA(done.total)}</dd></div>
        </dl>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <a href={whatsappLink(wa, `Bonjour M NEXT, je viens de passer la commande n° ${done.number}.`)} target="_blank" rel="noopener noreferrer" className={btnClass('primary', 'lg', 'flex-1')}><MessageCircle /> Suivre sur WhatsApp</a>
        <Link to="/website-shop" className={btnClass('outline', 'lg', 'flex-1')}>Retour à l'accueil</Link>
      </div>
    </div>
  );
}
