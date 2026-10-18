import { ShieldCheck, Truck, BadgeCheck, RefreshCcw, type LucideIcon } from 'lucide-react';
import { storeConfig } from './storeConfig';

export const WHY: { icon: LucideIcon; title: string; text: string }[] = [
  { icon: BadgeCheck, title: 'Testé avant livraison', text: 'Chaque chargeur est branché et contrôlé (tension, ampérage) avant de partir.' },
  { icon: ShieldCheck, title: storeConfig.guarantee.short, text: storeConfig.guarantee.long },
  { icon: Truck, title: `Livré en ${storeConfig.delivery.delayText}`, text: `Livraison à domicile ou en stop-desk dans les ${storeConfig.delivery.wilayaCount} wilayas.` },
  { icon: RefreshCcw, title: 'Échange si mauvais modèle', text: storeConfig.delivery.exchangeText },
];

export const FAQ: { q: string; a: string }[] = [
  {
    q: 'Comment savoir quel chargeur convient à mon PC ?',
    a: "Regardez l'étiquette sous votre PC ou sur votre ancien chargeur : la tension (V), l'ampérage (A) et la forme de l'embout doivent correspondre. Utilisez notre outil « Trouver mon chargeur » ou envoyez-nous une photo sur WhatsApp, on vous répond rapidement.",
  },
  {
    q: 'Quel est le délai et le prix de livraison ?',
    a: `La livraison prend généralement ${storeConfig.delivery.delayText}. Le prix dépend de votre wilaya et du type (à domicile ou stop-desk) ; il s'affiche automatiquement au moment de la commande.`,
  },
  { q: 'Puis-je payer à la livraison ?', a: 'Oui. Vous payez en espèces au livreur à la réception de votre colis. Aucun paiement en ligne n’est demandé.' },
  { q: 'Quelle est la garantie ?', a: storeConfig.guarantee.long },
  { q: 'Et si le chargeur ne correspond pas à mon PC ?', a: storeConfig.delivery.exchangeText },
];

export const TRUST = ['Testé avant livraison', storeConfig.guarantee.short, 'Paiement à la livraison', `${storeConfig.delivery.wilayaCount} wilayas`];
