import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, type = 'text', ...props }, ref) {
    return (
      <input
        ref={ref}
        type={type}
        className={cn(
          'h-11 w-full rounded-xl border border-white/[0.08] bg-black/30 px-3.5 text-sm text-neutral-100 shadow-[0_1px_0_rgba(255,255,255,0.04)_inset] outline-none transition-[border-color,background-color,box-shadow] duration-200 ease-[var(--ease-out)] placeholder:text-neutral-600 hover:border-white/[0.14] focus:border-white/25 focus:bg-black/40 focus:ring-1 focus:ring-white/20 focus-visible:outline-none',
          className,
        )}
        {...props}
      />
    );
  },
);
