import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Compose Tailwind classes with the shadcn/ui conflict-resolution convention. */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
