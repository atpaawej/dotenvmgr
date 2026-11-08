'use client';

import { signInAction, type LoginState } from '@/app/actions/auth';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';

const initialState: LoginState = { error: null };

const fieldClassName =
  'w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-neutral-100 outline-none transition-colors duration-200 placeholder:text-neutral-600 focus:border-white/25 focus:bg-black/40 focus:ring-2 focus:ring-white/10';

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="group flex w-full items-center justify-center gap-2 rounded-lg bg-neutral-100 px-4 py-2.5 text-sm font-semibold text-neutral-950 transition-all duration-200 ease-out hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-900 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? (
        <>
          <span
            aria-hidden="true"
            className="h-4 w-4 animate-spin rounded-full border-2 border-neutral-400/40 border-t-neutral-900"
          />
          Signing in…
        </>
      ) : (
        <>
          Sign in
          <svg
            aria-hidden="true"
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            className="h-4 w-4 transition-transform duration-200 ease-out group-hover:translate-x-0.5"
          >
            <path d="M4 10h12M11 5l5 5-5 5" />
          </svg>
        </>
      )}
    </button>
  );
}

export function LoginForm() {
  const [state, formAction] = useActionState(signInAction, initialState);

  return (
    <form action={formAction} className="mt-6 space-y-4">
      <div className="space-y-2">
        <label
          htmlFor="username"
          className="block text-xs font-medium text-neutral-300"
        >
          Username
        </label>
        <input
          id="username"
          name="username"
          type="text"
          required
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          className={fieldClassName}
          placeholder="admin"
        />
      </div>

      <div className="space-y-2">
        <label
          htmlFor="password"
          className="block text-xs font-medium text-neutral-300"
        >
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className={fieldClassName}
          placeholder="••••••••"
        />
      </div>

      {state.error ? (
        <p
          role="alert"
          aria-live="polite"
          className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-300"
        >
          {state.error}
        </p>
      ) : null}

      <SubmitButton />
    </form>
  );
}
