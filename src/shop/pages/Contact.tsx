import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Phone, MessageCircle, Mail, MapPin, Clock, Send } from 'lucide-react';
import { useStoreSettings, whatsappLink } from '../lib/catalog';
import { track } from '../lib/track';
import { storeConfig } from '../storeConfig';
import { FAQ } from '../content';
import { Seo, faqLd, organizationLd } from '../components/Seo';
import { FaqList } from '../components/sections';
import { Button, Field, Input, btnClass } from '../components/ui';

export default function Contact() {
  const s = useStoreSettings();
  const [form, setForm] = useState({ name: '', phone: '', message: '' });
  const send = (e: React.FormEvent) => {
    e.preventDefault();
    // No mail backend yet: the form opens WhatsApp with the message pre-filled.
    const text = `Bonjour M NEXT,\n${form.message}\n\n— ${form.name}${form.phone ? ` (${form.phone})` : ''}`;
    track('contact_whatsapp', { source: 'contact_form' });
    window.open(whatsappLink(s.whatsapp, text), '_blank', 'noopener');
  };

  const cards = [
    { icon: Phone, label: 'Téléphone', value: s.phone, href: `tel:${s.phone.replace(/\s/g, '')}` },
    { icon: MessageCircle, label: 'WhatsApp', value: 'Réponse rapide 7j/7', href: whatsappLink(s.whatsapp), external: true },
    { icon: Mail, label: 'E-mail', value: s.email, href: `mailto:${s.email}` },
  ];

  return (
    <div className="mx-auto max-w-[1280px] px-4 py-8 md:py-10">
      <Seo title="Contact" description={`Contactez ${storeConfig.name} par téléphone, WhatsApp ou e-mail. Horaires, adresse et questions fréquentes.`} jsonLd={[organizationLd(s.phone, s.logoUrl), faqLd(FAQ)]} />
      <nav aria-label="Fil d'Ariane" className="mb-3 text-sm text-shop-muted"><Link to="/website-shop" className="hover:text-shop-text">Accueil</Link> / <span className="text-shop-text">Contact</span></nav>
      <h1 className="text-3xl font-bold md:text-[40px]">Contact</h1>
      <p className="mt-1 text-shop-muted">Une question sur un modèle, une commande ou la livraison ? On vous répond.</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {cards.map(({ icon: Icon, label, value, href, external }) => (
          <a key={label} href={href} {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})} className="shop-card shop-lift flex items-center gap-4 p-5">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-shop-volt-soft"><Icon className="h-5 w-5" /></span>
            <span><span className="block text-sm text-shop-muted">{label}</span><span className="block font-semibold">{value}</span></span>
          </a>
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <form onSubmit={send} className="shop-card space-y-4 p-6">
          <h2 className="text-xl font-bold">Écrivez-nous</h2>
          <Field label="Nom" htmlFor="ct-name" required><Input id="ct-name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} autoComplete="name" /></Field>
          <Field label="Téléphone" htmlFor="ct-phone"><Input id="ct-phone" type="tel" inputMode="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} autoComplete="tel" placeholder="05 / 06 / 07…" /></Field>
          <Field label="Message" htmlFor="ct-msg" required hint="Indiquez le modèle de votre PC si possible.">
            <textarea id="ct-msg" required rows={5} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })}
              className="w-full rounded-[10px] border border-shop-border bg-shop-surface p-3 text-[16px] focus:border-shop-electric focus:outline-none focus:ring-2 focus:ring-shop-electric/25 md:text-sm" />
          </Field>
          <Button type="submit" size="lg" className="w-full"><Send /> Envoyer via WhatsApp</Button>
        </form>

        <div className="space-y-4">
          <div className="shop-card overflow-hidden">
            <iframe
              title="Carte"
              src={`https://www.google.com/maps?q=${encodeURIComponent(storeConfig.contact.mapsQuery)}&output=embed`}
              className="h-64 w-full border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
            <div className="flex items-start gap-3 p-5"><MapPin className="mt-0.5 h-5 w-5 shrink-0" /><span className="text-sm">{s.address}</span></div>
          </div>
          <div className="shop-card p-5">
            <h2 className="mb-3 flex items-center gap-2 text-base font-semibold" style={{ fontFamily: 'Inter, sans-serif' }}><Clock className="h-5 w-5" /> Horaires</h2>
            <dl className="space-y-1.5 text-sm">
              {storeConfig.contact.hours.map((h) => <div key={h.days} className="flex justify-between gap-4"><dt className="text-shop-muted">{h.days}</dt><dd className="tabular font-medium">{h.time}</dd></div>)}
            </dl>
            <a href={whatsappLink(s.whatsapp)} target="_blank" rel="noopener noreferrer" className={btnClass('outline', 'md', 'mt-4 w-full')}><MessageCircle /> WhatsApp</a>
          </div>
        </div>
      </div>

      <section className="mt-12">
        <h2 className="mb-5 text-2xl font-bold">Questions fréquentes</h2>
        <FaqList />
      </section>
    </div>
  );
}
