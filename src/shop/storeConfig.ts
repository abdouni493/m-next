/**
 * Single source of truth for storefront configuration.
 * Contact values here are fallbacks — values saved in the admin "Gestion du Site"
 * (website_settings) override them at runtime via useStoreSettings().
 */
export const storeConfig = {
  name: 'M NEXT',
  legalName: 'M Next Tech DZ',
  siteUrl: 'https://m-next-tech.vercel.app',
  tagline: 'Chargeurs PC portables originaux',
  defaultTitle: 'M NEXT — Chargeurs PC Portables Originaux | Livraison 69 Wilayas',
  defaultDescription:
    "Chargeurs originaux et testés pour PC portables HP, Dell, Lenovo, Apple, Asus, Acer… Livraison dans les 69 wilayas, paiement à la livraison et garantie.",
  ogImage: '/og-image.svg',

  contact: {
    phone: '0654 72 03 98',
    whatsapp: '213654720398', // international format, no "+" — edit here or in admin settings
    email: 'contact@m-next.dz',
    address: 'Algérie',
    mapsQuery: 'M Next Tech DZ Algérie',
    hours: [
      { days: 'Samedi – Jeudi', time: '09:00 – 19:00' },
      { days: 'Vendredi', time: '14:00 – 19:00' },
    ],
  },

  whatsappMessage: 'Bonjour M NEXT, je cherche un chargeur pour mon PC : ',

  guarantee: {
    months: 6,
    short: 'Garantie 6 mois',
    long: 'Chaque chargeur est garanti 6 mois contre tout défaut de fabrication.',
  },
  delivery: {
    wilayaCount: 69,
    delayText: '24 – 72 h selon la wilaya',
    exchangeText: 'Échange gratuit sous 7 jours si le modèle ne correspond pas.',
  },

  brands: ['HP', 'Dell', 'Lenovo', 'Apple', 'Asus', 'ROG', 'Acer', 'Surface', 'Toshiba'],
  powers: [45, 65, 90, 120, 135, 150, 200, 230, 330],
  connectors: ['USB-C', 'Blue Pin 4.5×3.0', 'Big Pin 7.4×5.0', 'Slim tip 4.5×3.0 (XPS)', 'Surface Connect', 'MagSafe'],

  features: {
    promoCode: false, // no backend support yet
    arabic: false, // FR/AR switch (phase 2)
    showLoginInFooter: true,
  },

  analytics: {
    ga4Id: import.meta.env.VITE_GA4_ID as string | undefined,
    metaPixelId: import.meta.env.VITE_META_PIXEL_ID as string | undefined,
  },

  orderRateLimitMinutes: 10,
};

export const DESCRIPTION_NOISE = [
  /disponible\s+chez/i,
  /livraison\s+(dans\s+)?(toute|les\s+\d+)/i,
  /(\+213|00213|\b0)[\s.-]?[5-7](?:[\s.-]?\d){8}/,
  /whats\s?app/i,
  /appelez|contactez[- ]nous/i,
];
