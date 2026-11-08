import { redirect } from 'next/navigation';
import { getAdminSession } from '@/auth/session';
import { LoginForm } from './login-form';

export default async function LoginPage() {
  const session = await getAdminSession();
  if (session) {
    redirect('/dashboard');
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-6 py-12">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-40 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-white/5 blur-3xl"
      />

      <div className="relative w-full max-w-sm">
        <div className="mb-8 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 shadow-inner shadow-white/5">
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
              className="h-5 w-5 text-neutral-200"
            >
              <rect width="14" height="10" x="5" y="11" rx="2" />
              <path d="M8 11V7a4 4 0 0 1 8 0v4" />
              <path d="M12 15v2" />
            </svg>
          </span>
          <span className="text-sm font-semibold tracking-tight text-neutral-100">
            dotenvmgr
          </span>
        </div>

        <section className="rounded-2xl border border-white/10 bg-neutral-900/70 p-8 shadow-2xl shadow-black/40 backdrop-blur-xl">
          <p className="text-[0.6875rem] font-medium uppercase tracking-[0.2em] text-neutral-500">
            Single-admin instance
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white">
            Sign in
          </h1>
          <p className="mt-2 text-sm leading-6 text-neutral-400">
            Use the instance credentials to open the dashboard.
          </p>

          <LoginForm />
        </section>

        <p className="mt-6 text-center text-xs text-neutral-600">
          Secrets stay encrypted at rest. Sessions are HTTP-only.
        </p>
      </div>
    </main>
  );
}
