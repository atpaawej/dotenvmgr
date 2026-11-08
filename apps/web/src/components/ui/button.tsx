'use client';

import { motion, type HTMLMotionProps } from 'motion/react';
import { cn } from '@/lib/utils';

type ButtonVariant = 'primary' | 'outline' | 'ghost';
type ButtonSize = 'sm' | 'md';

const variants: Record<ButtonVariant, string> = {
  primary:
    'bg-neutral-100 text-neutral-950 shadow-[0_1px_0_rgba(255,255,255,0.35)_inset,0_8px_24px_-12px_rgba(255,255,255,0.35)] hover:bg-white',
  outline:
    'border border-white/[0.08] bg-white/[0.04] text-neutral-200 hover:border-white/[0.14] hover:bg-white/[0.07] hover:text-white',
  ghost:
    'text-neutral-400 hover:bg-white/[0.05] hover:text-neutral-100',
};

const sizes: Record<ButtonSize, string> = {
  sm: 'h-8 gap-1.5 rounded-lg px-3 text-xs',
  md: 'h-11 gap-2 rounded-xl px-4 text-sm',
};

export interface ButtonProps extends HTMLMotionProps<'button'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export function Button({
  className,
  variant = 'primary',
  size = 'md',
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <motion.button
      type={type}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', duration: 0.22, bounce: 0 }}
      className={cn(
        'group inline-flex select-none items-center justify-center font-medium tracking-[-0.01em] transition-[background-color,border-color,color,box-shadow] duration-200 ease-[var(--ease-out)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/30 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950 disabled:cursor-not-allowed disabled:opacity-60',
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    />
  );
}
