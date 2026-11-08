import { redirect } from 'next/navigation';
import { signOutAction } from '@/app/actions/auth';
import { getAdminSession } from '@/auth/session';
import { SignOutButton } from './sign-out-button';

const cards = [
  {
    title: 'Projects',
    value: '0',
    description: 'Projects will appear here once the secret pipeline lands.',
  },
  {
    title: 'Environments',
    value: '3',
    description: 'Production, dev, and test environments are provisioned per project.',
  },
  {
    title: 'Secrets',
    value: '0',
    description: 'Encrypted values only. Plaintext never touches storage.',
  },
];

export default async function DashboardPage() {
  const session = await getAdminSession();
  if (!session) {
    redirect('/login');
  }

  const username = session.user.name || session.user.email;

  return (
    <div className="min-h-screen">
      <header className="border-b border-white/10 bg-neutral-950/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5">
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
                className="h-4 w-4 text-neutral-200"
              >
                <rect width="14" height="10" x="5" y="11" rx="2" />
                <path d="M8 11V7a4 4 0 0 1 8 0v4" />
                <path d="M12 15v2" />
              </svg>
            </span>
            <span className="text-sm font-semibold tracking-tight">
              dotenvmgr
            </span>
          </div>

          <div className="flex items-center gap-4">
            <span className="hidden text-xs text-neutral-500 sm:inline">
              Signed in as <span className="text-neutral-300">{username}</span>
            </span>
            <form action={signOutAction}>
              <SignOutButton />
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-12">
        <div className="max-w-2xl">
          <p className="text-[0.6875rem] font-medium uppercase tracking-[0.2em] text-neutral-500">
            Dashboard shell
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white">
            Welcome back, {username}
          </h1>
          <p className="mt-3 text-sm leading-6 text-neutral-400">
            Authentication is wired. Project and secret management arrive in the
            next slice, using the same encrypted storage pipeline.
          </p>
        </div>

        <section className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((card) => (
            <article
              key={card.title}
              className="rounded-2xl border border-white/10 bg-neutral-900/50 p-6 shadow-xl shadow-black/20"
            >
              <p className="text-xs font-medium uppercase tracking-[0.16em] text-neutral-500">
                {card.title}
              </p>
              <p className="mt-3 text-2xl font-semibold tracking-tight text-white">
                {card.value}
              </p>
              <p className="mt-2 text-sm leading-6 text-neutral-500">
                {card.description}
              </p>
            </article>
          ))}
        </section>
      </main>
    </div>
  );
}
