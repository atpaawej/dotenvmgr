import { redirect } from 'next/navigation';
import { BrandMark } from '@/components/brand-mark';
import { DashboardMetrics } from '@/components/dashboard/dashboard-metrics';
import { DashboardWorkspace } from '@/components/dashboard/dashboard-workspace';
import { signOutAction } from '@/app/actions/auth';
import { getAdminSession } from '@/auth/session';
import { SignOutButton } from './sign-out-button';

export default async function DashboardPage() {
  const session = await getAdminSession();
  if (!session) {
    redirect('/login');
  }

  const username = session.user.name || session.user.email;

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-white/[0.06] bg-[#08090a]/70 backdrop-blur-xl">
        <div
          aria-hidden="true"
          className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.14] to-transparent"
        />
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-3.5">
          <div className="flex items-center gap-3">
            <BrandMark />
            <div className="leading-tight">
              <p className="text-sm font-semibold tracking-tight text-neutral-100">
                dotenvmgr
              </p>
              <p className="hidden text-[0.65rem] text-neutral-600 sm:block">
                Encrypted environments
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden items-center gap-2 rounded-full border border-white/[0.07] bg-white/[0.03] px-2.5 py-1 text-[0.65rem] font-medium text-neutral-400 sm:flex">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400/60 [animation-duration:2.4s] motion-reduce:animate-none" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
              </span>
              Encrypted
            </span>
            <span className="hidden max-w-40 truncate text-xs text-neutral-500 md:inline">
              {username}
            </span>
            <form action={signOutAction}>
              <SignOutButton />
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-12 sm:py-16">
        <div className="max-w-2xl">
          <p className="text-sm font-medium text-neutral-500">Instance overview</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.03em] text-white sm:text-4xl">
            Welcome back, {username}
          </h1>
          <p className="mt-3 text-sm leading-6 text-neutral-400">
            Authentication is wired. Project and secret management arrive in the
            next slice, using the same encrypted storage pipeline.
          </p>
        </div>

        <DashboardMetrics />
        <DashboardWorkspace />
      </main>
    </div>
  );
}
