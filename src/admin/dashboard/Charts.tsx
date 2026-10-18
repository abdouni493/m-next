import { useEffect, useState } from 'react';
import {
  Area, Bar, BarChart, CartesianGrid, ComposedChart, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell,
} from 'recharts';
import { formatCompactDA, formatDA } from '@/admin/ui';
import type { DashboardData } from './data';

/** Recharts needs concrete colours (SVG attributes can't read CSS variables). */
export function useChartTheme() {
  const read = () => document.documentElement.classList.contains('dark');
  const [dark, setDark] = useState(read);
  useEffect(() => {
    const mo = new MutationObserver(() => setDark(read()));
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => mo.disconnect();
  }, []);
  return {
    dark,
    series: [dark ? '#F2F4F8' : '#0B1220', dark ? '#5B93FF' : '#1F6FFF', '#C6F432', dark ? '#32D583' : '#12B76A', dark ? '#FDB022' : '#F79009', '#8B95A7'],
    grid: dark ? '#262D3D' : '#E2E6EC',
    muted: dark ? '#9AA3B5' : '#5B6475',
    surface: dark ? '#121722' : '#FFFFFF',
    danger: dark ? '#FF6369' : '#E5484D',
  };
}

const axisCommon = (muted: string) => ({ tick: { fill: muted, fontSize: 11 }, tickLine: false, axisLine: false });

function CardTooltip({ active, payload, label, money = true }: { active?: boolean; payload?: { name: string; value: number; color: string; dataKey: string }[]; label?: string; money?: boolean }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-border bg-card px-3 py-2 text-xs shadow-md">
      {label && <p className="mb-1 font-semibold">{label}</p>}
      {payload.map((p) => (
        <p key={p.dataKey} className="flex items-center gap-2 tabular-nums">
          <span className="h-2 w-2 rounded-full" style={{ background: p.color }} />
          <span className="text-muted-foreground">{p.name}</span>
          <span className="ml-auto font-semibold">{money && p.dataKey !== 'orders' && p.dataKey !== 'units' && p.dataKey !== 'value' ? formatDA(p.value) : p.value.toLocaleString('fr-FR')}</span>
        </p>
      ))}
    </div>
  );
}

/** Legend items toggle their series. */
function useHidden() {
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const toggle = (key: string) => setHidden((h) => { const n = new Set(h); n.has(key) ? n.delete(key) : n.add(key); return n; });
  return { hidden, toggle };
}

export function RevenueChart({ data }: { data: DashboardData['series'] }) {
  const t = useChartTheme();
  const { hidden, toggle } = useHidden();
  return (
    <ResponsiveContainer width="100%" height={300}>
      <ComposedChart data={data} margin={{ top: 8, right: 4, left: 4, bottom: 0 }}>
        <defs>
          <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={t.series[0]} stopOpacity={0.14} /><stop offset="1" stopColor={t.series[0]} stopOpacity={0} /></linearGradient>
        </defs>
        <CartesianGrid stroke={t.grid} vertical={false} />
        <XAxis dataKey="label" {...axisCommon(t.muted)} minTickGap={16} />
        <YAxis yAxisId="money" {...axisCommon(t.muted)} width={64} tickFormatter={(v) => formatCompactDA(v).replace(' DA', '')} />
        <YAxis yAxisId="count" orientation="right" {...axisCommon(t.muted)} width={28} allowDecimals={false} />
        <Tooltip content={<CardTooltip />} cursor={{ fill: t.grid, opacity: 0.4 }} />
        <Legend onClick={(e) => toggle(String(e.dataKey))} wrapperStyle={{ fontSize: 12, cursor: 'pointer', paddingTop: 8 }}
          formatter={(v, e) => <span style={{ color: hidden.has(String(e.dataKey)) ? t.muted : undefined, opacity: hidden.has(String(e.dataKey)) ? 0.5 : 1 }}>{v}</span>} />
        <Bar yAxisId="count" dataKey="orders" name="Commandes" fill={t.series[2]} radius={[4, 4, 0, 0]} maxBarSize={22} hide={hidden.has('orders')} />
        <Area yAxisId="money" type="monotone" dataKey="revenue" name="Chiffre d'affaires" stroke={t.series[0]} strokeWidth={2} fill="url(#rev)" hide={hidden.has('revenue')} />
        <Area yAxisId="money" type="monotone" dataKey="profit" name="Bénéfice brut" stroke={t.series[1]} strokeWidth={2} fill="transparent" hide={hidden.has('profit')} />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

export function HBarChart({ data, dataKey, nameKey = 'name', money, height }: { data: Record<string, unknown>[]; dataKey: string; nameKey?: string; money?: boolean; height?: number }) {
  const t = useChartTheme();
  return (
    <ResponsiveContainer width="100%" height={height || Math.max(160, data.length * 36)}>
      <BarChart data={data} layout="vertical" margin={{ top: 0, right: 12, left: 0, bottom: 0 }}>
        <CartesianGrid stroke={t.grid} horizontal={false} />
        <XAxis type="number" {...axisCommon(t.muted)} tickFormatter={(v) => (money ? formatCompactDA(v).replace(' DA', '') : String(v))} allowDecimals={false} />
        <YAxis type="category" dataKey={nameKey} {...axisCommon(t.muted)} width={92} />
        <Tooltip content={<CardTooltip money={money} />} cursor={{ fill: t.grid, opacity: 0.4 }} />
        <Bar dataKey={dataKey} name={money ? "Chiffre d'affaires" : 'Unités'} radius={[0, 6, 6, 0]} maxBarSize={20}>
          {data.map((_, i) => <Cell key={i} fill={i === 0 ? t.series[0] : t.series[1]} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function ColumnChart({ data, dataKey, money }: { data: Record<string, unknown>[]; dataKey: string; money?: boolean }) {
  const t = useChartTheme();
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} margin={{ top: 8, right: 4, left: 4, bottom: 0 }}>
        <CartesianGrid stroke={t.grid} vertical={false} />
        <XAxis dataKey="name" {...axisCommon(t.muted)} interval={0} />
        <YAxis {...axisCommon(t.muted)} width={56} tickFormatter={(v) => (money ? formatCompactDA(v).replace(' DA', '') : String(v))} />
        <Tooltip content={<CardTooltip money={money} />} cursor={{ fill: t.grid, opacity: 0.4 }} />
        <Bar dataKey={dataKey} name={money ? "Chiffre d'affaires" : 'Unités'} fill={t.series[1]} radius={[6, 6, 0, 0]} maxBarSize={44} />
      </BarChart>
    </ResponsiveContainer>
  );
}
