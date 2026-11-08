import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-white/[0.08] bg-white/[0.025] shadow-[0_1px_0_rgba(255,255,255,0.04)_inset,0_24px_80px_-48px_rgba(0,0,0,0.9)]',
        className,
      )}
      {...props}
    />
  );
}
