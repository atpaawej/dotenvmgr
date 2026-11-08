'use client';

import { Loader2, LogOut } from 'lucide-react';
import { useFormStatus } from 'react-dom';
import { Button } from '@/components/ui/button';

export function SignOutButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" variant="outline" size="sm" disabled={pending}>
      {pending ? (
        <Loader2 aria-hidden="true" className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <LogOut
          aria-hidden="true"
          strokeWidth={1.75}
          className="h-3.5 w-3.5 transition-transform duration-200 ease-[var(--ease-out)] group-hover:-translate-x-0.5"
        />
      )}
      <span>{pending ? 'Signing out' : 'Sign out'}</span>
    </Button>
  );
}
