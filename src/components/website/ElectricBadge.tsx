import { Zap } from 'lucide-react';
import { ReactNode } from 'react';

interface ElectricBadgeProps {
  children: ReactNode;
  className?: string;
  color?: 'cyan' | 'violet' | 'orange' | 'gold' | 'emerald';
}

const colorMap = {
  cyan:    { text: '#00D4FF', border: 'rgba(0,212,255,0.4)',   bg: 'rgba(0,212,255,0.1)'   },
  violet:  { text: '#7C3AED', border: 'rgba(124,58,237,0.4)',  bg: 'rgba(124,58,237,0.1)'  },
  orange:  { text: '#FF6B35', border: 'rgba(255,107,53,0.4)',  bg: 'rgba(255,107,53,0.1)'  },
  gold:    { text: '#F59E0B', border: 'rgba(245,158,11,0.4)',  bg: 'rgba(245,158,11,0.1)'  },
  emerald: { text: '#10B981', border: 'rgba(16,185,129,0.4)',  bg: 'rgba(16,185,129,0.1)'  },
};

export default function ElectricBadge({ children, className = '', color = 'cyan' }: ElectricBadgeProps) {
  const c = colorMap[color];
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${className}`}
      style={{
        color: c.text,
        border: `1px solid ${c.border}`,
        background: c.bg,
        animation: 'borderGlow 2s ease-in-out infinite alternate',
      }}
    >
      <Zap className="w-3 h-3" />
      {children}
    </span>
  );
}
