import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';
import { storeConfig } from '../storeConfig';

interface SeoProps {
  title?: string;
  description?: string;
  image?: string;
  type?: 'website' | 'product';
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
  noindex?: boolean;
}

export function Seo({ title, description, image, type = 'website', jsonLd, noindex }: SeoProps) {
  const { pathname } = useLocation();
  const fullTitle = title ? `${title} | ${storeConfig.name}` : storeConfig.defaultTitle;
  const desc = description || storeConfig.defaultDescription;
  const url = storeConfig.siteUrl + pathname;
  const img = image ? (image.startsWith('http') ? image : storeConfig.siteUrl + image) : storeConfig.siteUrl + storeConfig.ogImage;
  const ld = jsonLd ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd]) : [];

  return (
    <Helmet>
      <html lang="fr" />
      <title>{fullTitle}</title>
      <meta name="description" content={desc} />
      <link rel="canonical" href={url} />
      {noindex && <meta name="robots" content="noindex" />}
      <meta property="og:site_name" content={storeConfig.name} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={desc} />
      <meta property="og:type" content={type === 'product' ? 'product' : 'website'} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={img} />
      <meta property="og:locale" content="fr_DZ" />
      <meta name="twitter:card" content="summary_large_image" />
      {ld.map((obj, i) => (
        <script key={i} type="application/ld+json">{JSON.stringify(obj)}</script>
      ))}
    </Helmet>
  );
}

export const organizationLd = (phone: string, logo?: string) => ({
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: storeConfig.name,
  legalName: storeConfig.legalName,
  url: storeConfig.siteUrl,
  logo: logo || storeConfig.siteUrl + '/favicon.svg',
  contactPoint: { '@type': 'ContactPoint', telephone: phone, contactType: 'customer service', areaServed: 'DZ', availableLanguage: ['fr', 'ar'] },
});

export const breadcrumbLd = (items: { name: string; path: string }[]) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: items.map((it, i) => ({ '@type': 'ListItem', position: i + 1, name: it.name, item: storeConfig.siteUrl + it.path })),
});

export const faqLd = (faq: { q: string; a: string }[]) => ({
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faq.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
});
