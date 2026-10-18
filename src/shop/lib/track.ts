import { storeConfig } from '../storeConfig';

type EventName = 'view_item' | 'add_to_cart' | 'begin_checkout' | 'purchase' | 'search' | 'contact_whatsapp';

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
    fbq?: (...args: unknown[]) => void;
  }
}

const FB_MAP: Partial<Record<EventName, string>> = {
  view_item: 'ViewContent',
  add_to_cart: 'AddToCart',
  begin_checkout: 'InitiateCheckout',
  purchase: 'Purchase',
  search: 'Search',
  contact_whatsapp: 'Contact',
};

let loaded = false;

/** Loads GA4 / Meta Pixel only when their IDs are set in env (VITE_GA4_ID, VITE_META_PIXEL_ID). */
export function initTracking() {
  if (loaded || typeof window === 'undefined') return;
  loaded = true;
  const { ga4Id, metaPixelId } = storeConfig.analytics;
  if (ga4Id) {
    const s = document.createElement('script');
    s.async = true;
    s.src = `https://www.googletagmanager.com/gtag/js?id=${ga4Id}`;
    document.head.appendChild(s);
    window.dataLayer = window.dataLayer || [];
    window.gtag = function gtag() { window.dataLayer!.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', ga4Id);
  }
  if (metaPixelId) {
    /* eslint-disable */
    (function (f: any, b: any, e: any, v: any) {
      if (f.fbq) return; const n: any = (f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); });
      if (!f._fbq) f._fbq = n; n.push = n; n.loaded = true; n.version = '2.0'; n.queue = [];
      const t = b.createElement(e); t.async = true; t.src = v; const s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s);
    })(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
    /* eslint-enable */
    window.fbq!('init', metaPixelId);
    window.fbq!('track', 'PageView');
  }
}

export function track(event: EventName, params: Record<string, unknown> = {}) {
  try {
    window.gtag?.('event', event, { currency: 'DZD', ...params });
    const fb = FB_MAP[event];
    if (fb) window.fbq?.('track', fb, { currency: 'DZD', ...params });
    if (import.meta.env.DEV) console.debug('[track]', event, params);
  } catch { /* never break the UI for analytics */ }
}
