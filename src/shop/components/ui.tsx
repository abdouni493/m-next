import * as React from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Star, X, Zap, PackageSearch } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDA, hasPrice } from '../lib/format';
import { useShopI18n } from '../i18n';

/* ---------------- Button ---------------- */
type BtnVariant = 'primary' | 'volt' | 'outline' | 'ghost' | 'danger';
type BtnSize = 'sm' | 'md' | 'lg' | 'icon';

const variantCls: Record<BtnVariant, string> = {
  primary: 'bg-shop-primary text-shop-primary-fg hover:opacity-90',
  volt: 'bg-shop-volt text-shop-volt-ink hover:brightness-95',
  outline: 'border border-shop-border bg-shop-surface text-shop-text hover:bg-shop-surface-2',
  ghost: 'text-shop-text hover:bg-shop-surface-2',
  danger: 'bg-shop-danger text-white hover:opacity-90',
};
const sizeCls: Record<BtnSize, string> = {
  sm: 'h-9 px-3 text-sm gap-1.5',
  md: 'h-11 px-4 text-sm gap-2',
  lg: 'h-12 px-6 text-base gap-2',
  icon: 'h-11 w-11',
};

export interface ShopButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: BtnVariant;
  size?: BtnSize;
  asChild?: boolean;
}

export const btnClass = (variant: BtnVariant = 'primary', size: BtnSize = 'md', extra?: string) =>
  cn(
    'inline-flex shrink-0 items-center justify-center rounded-[10px] font-semibold transition-[background,opacity,filter,transform] duration-150 ease-out active:scale-[0.98] disabled:pointer-events-none disabled:opacity-45 [&_svg]:size-[18px] [&_svg]:shrink-0',
    variantCls[variant],
    sizeCls[size],
    extra,
  );

export const Button = React.forwardRef<HTMLButtonElement, ShopButtonProps>(
  ({ variant = 'primary', size = 'md', className, type = 'button', ...props }, ref) => (
    <button ref={ref} type={type} className={btnClass(variant, size, className)} {...props} />
  ),
);
Button.displayName = 'ShopButton';

/* ---------------- Badge / chips ---------------- */
type Tone = 'neutral' | 'volt' | 'success' | 'warning' | 'danger' | 'electric' | 'ink';
const toneCls: Record<Tone, string> = {
  neutral: 'bg-shop-surface-2 text-shop-text',
  volt: 'bg-shop-volt text-shop-volt-ink',
  success: 'bg-shop-success/10 text-shop-success border border-shop-success/25',
  warning: 'bg-shop-warning/10 text-shop-warning border border-shop-warning/25',
  danger: 'bg-shop-danger text-white',
  electric: 'bg-shop-electric/10 text-shop-electric',
  ink: 'bg-shop-primary text-shop-primary-fg',
};

export const Badge = ({ tone = 'neutral', className, children }: { tone?: Tone; className?: string; children: React.ReactNode }) => (
  <span className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold leading-5 [&_svg]:size-3.5', toneCls[tone], className)}>
    {children}
  </span>
);

export const SpecChip = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <span className={cn('tabular inline-flex items-center rounded-full bg-shop-surface-2 px-2.5 py-1 text-xs font-medium text-shop-text', className)}>
    {children}
  </span>
);

/* ---------------- Price ---------------- */
export const PriceTag = ({ price, oldPrice, size = 'md', className }: { price: number; oldPrice?: number; size?: 'sm' | 'md' | 'lg'; className?: string }) => {
  const { t } = useShopI18n();
  if (!hasPrice(price)) {
    return <span className={cn('text-sm font-semibold text-shop-muted', className)}>{t('price.onRequest')}</span>;
  }
  const main = size === 'lg' ? 'text-3xl' : size === 'sm' ? 'text-base' : 'text-xl';
  const promo = oldPrice && oldPrice > price;
  return (
    <span className={cn('tabular inline-flex flex-wrap items-baseline gap-x-2', className)}>
      <span className={cn('font-sora font-bold', main, promo ? 'text-shop-danger' : 'text-shop-text')}>{formatDA(price)}</span>
      {promo && <s className="text-sm text-shop-muted">{formatDA(oldPrice)}</s>}
    </span>
  );
};

/* ---------------- Rating ---------------- */
export const Rating = ({ value, count, size = 16 }: { value: number; count?: number; size?: number }) => (
  <span className="inline-flex items-center gap-1" aria-label={`Note ${value.toFixed(1)} sur 5`}>
    {[1, 2, 3, 4, 5].map((i) => (
      <Star key={i} style={{ width: size, height: size }} className={i <= Math.round(value) ? 'fill-[#F5B400] text-[#F5B400]' : 'text-shop-border'} strokeWidth={1.75} />
    ))}
    {count !== undefined && <span className="tabular ms-1 text-sm text-shop-muted">({count})</span>}
  </span>
);

/* ---------------- Charge bar ---------------- */
export const ChargeBar = ({ value, className, label }: { value: number; className?: string; label?: string }) => (
  <div className={cn('charge-bar', className)} role="progressbar" aria-valuenow={Math.round(value)} aria-valuemin={0} aria-valuemax={100} aria-label={label}>
    <span style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
  </div>
);

export const StockBadge = ({ stock }: { stock?: number }) => {
  const { t } = useShopI18n();
  if (stock === undefined) return <Badge tone="success">{t('stock.in')}</Badge>;
  if (stock <= 0) return <Badge tone="neutral" className="text-shop-danger">{t('stock.out')}</Badge>;
  if (stock <= 3) return <Badge tone="warning">Plus que {stock}</Badge>;
  return <Badge tone="success">{t('stock.in')}</Badge>;
};

/* ---------------- Skeleton / empty / section ---------------- */
export const Skeleton = ({ className }: { className?: string }) => (
  <div className={cn('animate-pulse rounded-[10px] bg-shop-surface-2', className)} />
);

export const EmptyState = ({ icon: Icon = PackageSearch, title, text, action }: { icon?: React.ElementType; title: string; text?: string; action?: React.ReactNode }) => (
  <div className="shop-card flex flex-col items-center px-6 py-14 text-center">
    <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-shop-volt-soft">
      <Icon className="h-7 w-7 text-shop-text" strokeWidth={1.75} />
    </div>
    <h3 className="text-lg font-semibold">{title}</h3>
    {text && <p className="mt-1 max-w-md text-sm text-shop-muted">{text}</p>}
    {action && <div className="mt-6 flex flex-wrap justify-center gap-3">{action}</div>}
  </div>
);

export const SectionHeader = ({ eyebrow, title, subtitle, action, className }: { eyebrow?: string; title: string; subtitle?: string; action?: React.ReactNode; className?: string }) => (
  <div className={cn('mb-6 flex flex-wrap items-end justify-between gap-4 md:mb-8', className)}>
    <div className="max-w-2xl">
      {eyebrow && (
        <p className="mb-2 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-shop-muted">
          <span className="h-1 w-5 rounded-full bg-shop-volt" />
          {eyebrow}
        </p>
      )}
      <h2 className="text-2xl font-bold md:text-[32px]">{title}</h2>
      {subtitle && <p className="mt-2 text-shop-muted">{subtitle}</p>}
    </div>
    {action}
  </div>
);

/* ---------------- Form controls ---------------- */
export const fieldCls =
  'h-11 w-full rounded-[10px] border border-shop-border bg-shop-surface px-3 text-[16px] text-shop-text placeholder:text-shop-muted/80 transition-colors focus:border-shop-electric focus:outline-none focus:ring-2 focus:ring-shop-electric/25 md:text-sm';

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(({ className, ...p }, ref) => (
  <input ref={ref} className={cn(fieldCls, className)} {...p} />
));
Input.displayName = 'ShopInput';

export const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(({ className, ...p }, ref) => (
  <select ref={ref} className={cn(fieldCls, 'appearance-none bg-[length:16px] bg-[right_12px_center] bg-no-repeat pe-9', className)}
    style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%235B6475' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")" }}
    {...p} />
));
Select.displayName = 'ShopSelect';

export const Field = ({ label, htmlFor, error, hint, children, required }: { label: string; htmlFor: string; error?: string; hint?: string; children: React.ReactNode; required?: boolean }) => (
  <div className="space-y-1.5">
    <label htmlFor={htmlFor} className="text-sm font-medium">
      {label} {required && <span className="text-shop-danger" aria-hidden>*</span>}
    </label>
    {children}
    {error ? <p className="text-xs font-medium text-shop-danger" role="alert">{error}</p> : hint ? <p className="text-xs text-shop-muted">{hint}</p> : null}
  </div>
);

/* ---------------- Drawer / Modal (Radix: focus trap + Esc + aria) ---------------- */
export const Drawer = ({ open, onOpenChange, side = 'right', title, children, footer, className }: {
  open: boolean; onOpenChange: (o: boolean) => void; side?: 'right' | 'left' | 'bottom'; title: string; children: React.ReactNode; footer?: React.ReactNode; className?: string;
}) => (
  <Dialog.Root open={open} onOpenChange={onOpenChange}>
    <Dialog.Portal>
      <Dialog.Overlay className="fixed inset-0 z-[80] bg-[#0B1220]/50 backdrop-blur-[2px] data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0" />
      <Dialog.Content
        className={cn(
          'shop-root fixed z-[81] flex flex-col bg-shop-surface text-shop-text shadow-2xl outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:duration-250 data-[state=closed]:duration-150',
          side === 'right' && 'inset-y-0 end-0 w-full max-w-[420px] border-s border-shop-border data-[state=open]:slide-in-from-right data-[state=closed]:slide-out-to-right',
          side === 'left' && 'inset-y-0 start-0 w-full max-w-[360px] border-e border-shop-border data-[state=open]:slide-in-from-left data-[state=closed]:slide-out-to-left',
          side === 'bottom' && 'inset-x-0 bottom-0 max-h-[88dvh] rounded-t-3xl border-t border-shop-border data-[state=open]:slide-in-from-bottom data-[state=closed]:slide-out-to-bottom',
          className,
        )}
      >
        {side === 'bottom' && <div className="mx-auto mt-2 h-1.5 w-10 rounded-full bg-shop-border" />}
        <div className="flex items-center justify-between border-b border-shop-border px-5 py-4">
          <Dialog.Title className="font-sora text-lg font-semibold">{title}</Dialog.Title>
          <Dialog.Close className={btnClass('ghost', 'icon', 'h-10 w-10')} aria-label="Fermer"><X /></Dialog.Close>
        </div>
        <Dialog.Description className="sr-only">{title}</Dialog.Description>
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer && <div className="border-t border-shop-border px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">{footer}</div>}
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>
);

export const Modal = ({ open, onOpenChange, title, children, className }: { open: boolean; onOpenChange: (o: boolean) => void; title: string; children: React.ReactNode; className?: string }) => (
  <Dialog.Root open={open} onOpenChange={onOpenChange}>
    <Dialog.Portal>
      <Dialog.Overlay className="fixed inset-0 z-[80] bg-[#0B1220]/50 backdrop-blur-[2px] data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0" />
      <Dialog.Content className={cn('shop-root fixed left-1/2 top-1/2 z-[81] w-[calc(100%-32px)] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-3xl border border-shop-border bg-shop-surface p-6 text-shop-text shadow-2xl outline-none data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95', className)}>
        <div className="mb-4 flex items-start justify-between gap-4">
          <Dialog.Title className="font-sora text-lg font-semibold">{title}</Dialog.Title>
          <Dialog.Close className={btnClass('ghost', 'icon', '-me-2 -mt-2 h-10 w-10')} aria-label="Fermer"><X /></Dialog.Close>
        </div>
        <Dialog.Description className="sr-only">{title}</Dialog.Description>
        {children}
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>
);

/* ---------------- Product image with branded fallback ---------------- */
export const ProductImage = ({ src, alt, className, priority, sizes = 'w-full' }: { src?: string; alt: string; className?: string; priority?: boolean; sizes?: string }) => {
  const [failed, setFailed] = React.useState(false);
  if (!src || failed) {
    return (
      <div className={cn('flex h-full w-full flex-col items-center justify-center gap-2 bg-shop-surface-2 text-shop-muted', className)} role="img" aria-label={alt}>
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-shop-volt"><Zap className="h-6 w-6 text-shop-volt-ink" fill="currentColor" /></div>
        <span className="font-sora text-[11px] font-semibold tracking-[0.18em]">M NEXT</span>
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={alt}
      width={600}
      height={600}
      loading={priority ? 'eager' : 'lazy'}
      decoding="async"
      {...{ fetchpriority: priority ? 'high' : 'auto' }}
      onError={() => setFailed(true)}
      className={cn('h-full object-contain', sizes, className)}
    />
  );
};
