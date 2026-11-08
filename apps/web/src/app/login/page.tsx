import { redirect } from 'next/navigation';
import { BrandMark } from '@/components/brand-mark';
import { Card } from '@/components/ui/card';
import { getAdminSession } from '@/auth/session';
import { LoginForm } from './login-form';

export default async function LoginPage() {
  const session = await getAdminSession();
  if (session) {
    redirect('/dashboard');
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-16">
      <div className="w-full max-w-[24rem]">
        <div className="mb-8 flex flex-col items-center text-center">
          <BrandMark size="lg" />
          <div className="mt-4 flex items-center gap-2">
            <span className="text-sm font-semibold tracking-tight text-neutral-100">
              dotenvmgr
            </span>
            <span className="rounded-full border border-white/[0.08] bg-white/[0.03] px-2 py-0.5 text-[0.65rem] font-medium text-neutral-500">
              self-hosted
            </span>
          </div>
        </div>

        <Card className="bg-neutral-950/50 p-7 backdrop-blur-2xl sm:p-8">
          <h1 className="text-xl font-semibold tracking-[-0.02em] text-white">
            Sign in
          </h1>
          <p className="mt-2 text-sm leading-6 text-neutral-400">
            Use the credentials configured for this instance. Secrets stay
            encrypted at rest.
          </p>

          <LoginForm />
        </Card>

        <p className="mt-8 text-center text-xs leading-5 text-neutral-600">
          Sessions are HTTP-only. The vault never stores plaintext.
        </p>
      </div>
    </main>
  );
}
