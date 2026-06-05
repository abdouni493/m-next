import { useRef } from 'react';
import { useInView } from 'framer-motion';

export const useScrollReveal = (margin = '-100px') => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: margin as any });
  return { ref, isInView };
};
