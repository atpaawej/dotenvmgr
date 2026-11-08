'use client';

import { LockKeyhole } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { cn } from '@/lib/utils';

const sizes = {
  sm: { box: 'h-8 w-8 rounded-[0.6rem]', icon: 'h-4 w-4' },
  lg: { box: 'h-11 w-11 rounded-xl', icon: 'h-5 w-5' },
};

export function BrandMark({
  size = 'sm',
  className,
}: {
  size?: keyof typeof sizes;
  className?: string;
}) {
  const reduceMotion = useReducedMotion();
  const scale = sizes[size];

  return (
    <motion.span
      initial={reduceMotion ? false : { opacity: 0, scale: 0.9, y: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      whileHover={
        reduceMotion
          ? undefined
          : {
              y: -2,
              scale: 1.04,
              transition: { type: 'spring', duration: 0.35, bounce: 0.18 },
            }
      }
      transition={{ type: 'spring', duration: 0.6, bounce: 0.16 }}
      className={cn(
        'flex shrink-0 items-center justify-center border border-white/[0.1] bg-white/[0.05] text-neutral-200 shadow-[0_1px_0_rgba(255,255,255,0.12)_inset,0_10px_30px_-18px_rgba(255,255,255,0.35)]',
        scale.box,
        className,
      )}
    >
      <LockKeyhole aria-hidden="true" strokeWidth={1.75} className={scale.icon} />
    </motion.span>
  );
}
