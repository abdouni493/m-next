import { useSyncExternalStore } from 'react';
import { storeConfig } from './storeConfig';

/**
 * Minimal i18n layer for the storefront. French is the default; Arabic is stubbed
 * and enabled later via storeConfig.features.arabic. Missing AR keys fall back to FR.
 */
const fr = {
  'nav.home': 'Accueil',
  'nav.shop': 'Boutique',
  'nav.promos': 'Promotions',
  'nav.packs': 'Packs',
  'nav.contact': 'Contact',
  'nav.search': 'Recherche',
  'nav.cart': 'Panier',
  'search.placeholder': 'Rechercher un chargeur ou un modèle de PC (ex. Latitude 5420)',
  'announce': 'Livraison dans les 69 wilayas · Paiement à la livraison · Garantie',
  'cta.add': 'Ajouter au panier',
  'cta.order': 'Commander',
  'cta.orderNow': 'Commander maintenant',
  'cta.find': 'Trouver mon chargeur',
  'cta.shop': 'Voir la boutique',
  'price.onRequest': 'Prix sur demande',
  'stock.in': 'En stock',
  'stock.low': 'Stock limité',
  'stock.out': 'Rupture',
  'trust.tested': 'Testé avant livraison',
  'trust.cod': 'Paiement à la livraison',
  'trust.wilayas': '69 wilayas',
  'cart.title': 'Votre panier',
  'cart.empty': 'Votre panier est vide',
  'cart.checkout': 'Passer la commande',
  'cart.subtotal': 'Sous-total',
} as const;

export type I18nKey = keyof typeof fr;
const ar: Partial<Record<I18nKey, string>> = {
  'nav.home': 'الرئيسية',
  'nav.shop': 'المتجر',
  'nav.promos': 'العروض',
  'nav.packs': 'الحزم',
  'nav.contact': 'اتصل بنا',
  'nav.cart': 'السلة',
};

type Lang = 'fr' | 'ar';
const KEY = 'shop:lang';
let lang: Lang = 'fr';
try { if (storeConfig.features.arabic && localStorage.getItem(KEY) === 'ar') lang = 'ar'; } catch { /* ignore */ }
const listeners = new Set<() => void>();

export const setShopLang = (l: Lang) => {
  lang = storeConfig.features.arabic ? l : 'fr';
  try { localStorage.setItem(KEY, lang); } catch { /* ignore */ }
  listeners.forEach((fn) => fn());
};

export const useShopI18n = () => {
  const current = useSyncExternalStore((l) => { listeners.add(l); return () => listeners.delete(l); }, () => lang);
  const t = (k: I18nKey) => (current === 'ar' ? ar[k] : undefined) ?? fr[k];
  return { t, lang: current, dir: current === 'ar' ? ('rtl' as const) : ('ltr' as const), setLang: setShopLang };
};
