import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface GlowCardProps {
  children: ReactNode;
  className?: string;
  glowColor?: 'cyan' | 'violet' | 'orange' | 'emerald';
  onClick?: () => void;
  animate?: boolean;
}

const glowMap = {
  cyan: 'rgba(139,92,246,0.3)',
  violet: 'rgba(236,72,153,0.3)',
  orange: 'rgba(249,115,22,0.3)',
  emerald: 'rgba(16,185,129,0.3)',
};

export default function GlowCard({
  children,
  className = '',
  glowColor = 'cyan',
  onClick,
  animate = true,
}: GlowCardProps) {
  const glow = glowMap[glowColor];

  const card = (
    <div
      onClick={onClick}
      className={`relative bg-[#13112A] border border-[#2E2A5A] rounded-2xl overflow-hidden transition-all duration-300 ${onClick ? 'cursor-pointer' : ''} ${className}`}
      style={{
        background: 'linear-gradient(135deg, rgba(139,92,246,0.03) 0%, rgba(236,72,153,0.03) 100%), #13112A',
      }}
    >
      {/* Gradient overlay */}
      <div
        className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{
          background: `linear-gradient(135deg, rgba(139,92,246,0.05) 0%, rgba(236,72,153,0.05) 100%)`,
        }}
      />
      {children}
    </div>
  );

  if (!animate) return card;

  return (
    <motion.div
      whileHover={{
        scale: 1.02,
        y: -4,
        boxShadow: `0 0 20px ${glow}, 0 20px 40px rgba(0,0,0,0.4)`,
        borderColor: glow,
      }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      onClick={onClick}
      className={`relative bg-[#13112A] border border-[#2E2A5A] rounded-2xl overflow-hidden transition-colors duration-300 ${onClick ? 'cursor-pointer' : ''} ${className}`}
      style={{
        background: 'linear-gradient(135deg, rgba(139,92,246,0.03) 0%, rgba(236,72,153,0.03) 100%), #13112A',
      }}
    >
      {/* Gradient overlay on hover */}
      <div
        className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-2xl"
        style={{
          background: `linear-gradient(135deg, rgba(139,92,246,0.05) 0%, rgba(236,72,153,0.05) 100%)`,
        }}
      />
      {children}
    </motion.div>
  );
}
