import { useEffect, useRef, useState } from 'react';
import { ChevronDown, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FAQ } from '../content';

/** Count-up that fires once when visible; always settles on the real value (no "0+" stuck state). */
export function CountUp({ value, suffix = '', duration = 1200 }: { value: number; suffix?: string; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [display, setDisplay] = useState(value);

  useEffect(() => {
    const el = ref.current;
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (!el || reduce || !('IntersectionObserver' in window) || value <= 0) { setDisplay(value); return; }
    let raf = 0;
    let started = false;
    const run = () => {
      if (started) return;
      started = true;
      const t0 = performance.now();
      const tick = (t: number) => {
        const k = Math.min(1, (t - t0) / duration);
        setDisplay(Math.round(value * (1 - Math.pow(1 - k, 3))));
        if (k < 1) raf = requestAnimationFrame(tick);
      };
      setDisplay(0);
      raf = requestAnimationFrame(tick);
    };
    const io = new IntersectionObserver((entries) => { if (entries.some((e) => e.isIntersecting)) { run(); io.disconnect(); } }, { threshold: 0.3 });
    io.observe(el);
    const fallback = window.setTimeout(() => { if (!started) setDisplay(value); }, 3000);
    return () => { io.disconnect(); cancelAnimationFrame(raf); clearTimeout(fallback); };
  }, [value, duration]);

  return <span ref={ref} className="tabular">{display}{suffix}</span>;
}

export function FaqList({ items = FAQ }: { items?: { q: string; a: string }[] }) {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div className="divide-y divide-shop-border rounded-2xl border border-shop-border bg-shop-surface">
      {items.map((f, i) => {
        const isOpen = open === i;
        return (
          <div key={f.q}>
            <h3 style={{ fontFamily: 'Inter, sans-serif', letterSpacing: 0 }}>
              <button
                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-start text-[15px] font-semibold"
                aria-expanded={isOpen}
                aria-controls={`faq-${i}`}
                onClick={() => setOpen(isOpen ? null : i)}
              >
                {f.q}
                <ChevronDown className={cn('h-5 w-5 shrink-0 text-shop-muted transition-transform duration-200', isOpen && 'rotate-180')} />
              </button>
            </h3>
            <div id={`faq-${i}`} role="region" hidden={!isOpen} className="px-5 pb-5 text-sm leading-relaxed text-shop-muted">{f.a}</div>
          </div>
        );
      })}
    </div>
  );
}

/** Product-free hero illustration (used until real photos are uploaded). */
export function ChargerIllustration({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 480 400" className={className} role="img" aria-label="Chargeur de PC portable">
      <defs>
        <linearGradient id="brick" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#1A2232" />
          <stop offset="1" stopColor="#0B1220" />
        </linearGradient>
      </defs>
      <path d="M120 250 C 60 260, 40 320, 110 340 S 250 330, 300 360" fill="none" stroke="#0B1220" strokeWidth="10" strokeLinecap="round" />
      <path d="M330 150 C 400 130, 430 90, 420 50" fill="none" stroke="#0B1220" strokeWidth="10" strokeLinecap="round" />
      <rect x="140" y="130" width="220" height="130" rx="26" fill="url(#brick)" />
      <rect x="160" y="150" width="180" height="90" rx="16" fill="none" stroke="#2A3448" strokeWidth="2" />
      <path d="M262 165 l-30 42 h21 l-6 30 33 -45 h-21 z" fill="#C6F432" />
      <rect x="290" y="344" width="64" height="30" rx="8" fill="#0B1220" />
      <rect x="352" y="352" width="22" height="14" rx="3" fill="#5B6475" />
      <rect x="398" y="20" width="44" height="38" rx="8" fill="#0B1220" />
      <rect x="160" y="275" width="180" height="8" rx="4" fill="#E2E6EC" />
      <rect x="160" y="275" width="126" height="8" rx="4" fill="#C6F432" />
    </svg>
  );
}

export const VoltMark = () => (
  <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-shop-volt"><Zap className="h-3.5 w-3.5 text-shop-volt-ink" fill="currentColor" /></span>
);
