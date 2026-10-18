import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, MessageCircle, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ShopProduct } from '../lib/catalog';
import { whatsappLink, useStoreSettings } from '../lib/catalog';
import { cart } from '../lib/cart';
import { hasPrice } from '../lib/format';
import { useShopI18n } from '../i18n';
import { Badge, Button, PriceTag, ProductImage, SpecChip, StockBadge, btnClass } from './ui';

export const productPath = (p: ShopProduct) => `/website-shop/product/${p.slug}`;

export function ProductCard({ product: p, priority, className }: { product: ShopProduct; priority?: boolean; className?: string }) {
  const { t } = useShopI18n();
  const navigate = useNavigate();
  const settings = useStoreSettings();
  const priced = hasPrice(p.price);
  const outOfStock = p.stock !== undefined && p.stock <= 0;
  const specs = [p.voltage && `${p.voltage}V`, p.amperage && `${p.amperage}A`, p.wattage && `${p.wattage}W`].filter(Boolean) as string[];

  return (
    <article className={cn('shop-card shop-lift shop-zoom group relative flex flex-col overflow-hidden', className)}>
      <Link to={productPath(p)} className="relative block aspect-square overflow-hidden bg-shop-surface-2/60" aria-label={p.title}>
        <ProductImage src={p.images[0]} alt={p.title} priority={priority} className="p-4" />
        {p.images[1] && (
          <img
            src={p.images[1]}
            alt=""
            aria-hidden
            loading="lazy"
            decoding="async"
            width={600}
            height={600}
            className="absolute inset-0 h-full w-full object-contain p-4 opacity-0 transition-opacity duration-200 group-hover:opacity-100"
          />
        )}
        <div className="absolute inset-x-3 top-3 flex items-start justify-between gap-2">
          <Badge tone="ink">{p.brand}</Badge>
          {p.discountPct ? <Badge tone="danger">-{p.discountPct}%</Badge> : null}
        </div>
      </Link>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-center justify-between gap-2">
          <StockBadge stock={p.stock} />
          {p.connector && <span className="truncate text-xs text-shop-muted">{p.connector}</span>}
        </div>

        <h3 className="line-clamp-2 min-h-[2.75rem] font-sans text-[15px] font-semibold leading-snug" style={{ fontFamily: 'Inter, sans-serif' }}>
          <Link to={productPath(p)} className="after:absolute after:inset-0 after:content-[''] hover:underline">
            {p.title}
          </Link>
        </h3>

        {specs.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {specs.map((s) => <SpecChip key={s}>{s}</SpecChip>)}
          </div>
        )}

        <div className="mt-auto pt-1">
          <PriceTag price={p.price} oldPrice={p.oldPrice} />
        </div>

        <div className="relative z-10 flex gap-2">
          {priced ? (
            <>
              <Button className="flex-1" onClick={() => cart.add(p)} disabled={outOfStock} aria-label={`${t('cta.add')} : ${p.title}`}>
                <ShoppingBag /> <span className="truncate">{t('cta.add')}</span>
              </Button>
              <Button
                variant="outline"
                size="icon"
                aria-label={`${t('cta.order')} : ${p.title}`}
                title={t('cta.order')}
                disabled={outOfStock}
                onClick={() => { cart.add(p, 1, false); navigate('/website-shop/order'); }}
              >
                <ArrowRight />
              </Button>
            </>
          ) : (
            <a
              href={whatsappLink(settings.whatsapp, `Bonjour M NEXT, quel est le prix du ${p.title} ?`)}
              target="_blank"
              rel="noopener noreferrer"
              className={btnClass('outline', 'md', 'flex-1')}
            >
              <MessageCircle /> Demander le prix
            </a>
          )}
        </div>
      </div>
    </article>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="shop-card overflow-hidden">
      <div className="aspect-square animate-pulse bg-shop-surface-2" />
      <div className="space-y-3 p-4">
        <div className="h-4 w-1/3 animate-pulse rounded bg-shop-surface-2" />
        <div className="h-4 w-full animate-pulse rounded bg-shop-surface-2" />
        <div className="h-4 w-2/3 animate-pulse rounded bg-shop-surface-2" />
        <div className="h-11 w-full animate-pulse rounded-[10px] bg-shop-surface-2" />
      </div>
    </div>
  );
}
