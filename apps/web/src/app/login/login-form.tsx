'use client';

import { AnimatePresence, motion } from 'motion/react';
import { AlertCircle, ArrowRight, Loader2 } from 'lucide-react';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { signInAction, type LoginState } from '@/app/actions/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const initialState: LoginState = { error: null };

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending} className="w-full">
      <AnimatePresence mode="wait" initial={false}>
        {pending ? (
          <motion.span
            key="pending"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ type: 'spring', duration: 0.25, bounce: 0 }}
            className="flex items-center gap-2"
          >
            <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
            Signing in
          </motion.span>
        ) : (
          <motion.span
            key="idle"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ type: 'spring', duration: 0.25, bounce: 0 }}
            className="flex items-center gap-2"
          >
            Sign in
            <ArrowRight
              aria-hidden="true"
              strokeWidth={1.75}
              className="h-4 w-4 transition-transform duration-200 ease-[var(--ease-out)] group-hover:translate-x-0.5"
            />
          </motion.span>
        )}
      </AnimatePresence>
    </Button>
  );
}

export function LoginForm() {
  const [state, formAction] = useActionState(signInAction, initialState);

  return (
    <form action={formAction} className="mt-7 space-y-5">
      <div className="space-y-2">
        <label
          htmlFor="username"
          className="block text-xs font-medium tracking-[0.01em] text-neutral-300"
        >
          Username
        </label>
        <Input
          id="username"
          name="username"
          required
          autoFocus
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          placeholder="admin"
        />
      </div>

      <div className="space-y-2">
        <label
          htmlFor="password"
          className="block text-xs font-medium tracking-[0.01em] text-neutral-300"
        >
          Password
        </label>
        <Input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          placeholder="••••••••"
        />
      </div>

      <div className="space-y-3">
        <SubmitButton />

        <div aria-live="polite" className="min-h-5">
          <AnimatePresence initial={false}>
            {state.error ? (
              <motion.p
                key="error"
                role="alert"
                initial={{ opacity: 0, y: -4, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -2, scale: 0.98 }}
                transition={{ type: 'spring', duration: 0.3, bounce: 0.12 }}
                className="flex items-start gap-1.5 text-xs leading-5 text-red-300"
              >
                <AlertCircle
                  aria-hidden="true"
                  strokeWidth={1.75}
                  className="mt-0.5 h-3.5 w-3.5 shrink-0"
                />
                {state.error}
              </motion.p>
            ) : null}
          </AnimatePresence>
        </div>
      </div>
    </form>
  );
}
