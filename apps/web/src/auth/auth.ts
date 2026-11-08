import { createAdminAuth } from './admin-auth';

type AuthGlobals = typeof globalThis & {
  __dotenvmgrAuth?: ReturnType<typeof createAdminAuth>;
};

const authGlobals = globalThis as AuthGlobals;
const baseURL = process.env.BETTER_AUTH_URL ?? 'http://localhost:3000';

/**
 * Reuse one auth instance across Next.js route handlers, server actions, and
 * server components. The in-memory session store must be shared so a session
 * created by sign-in is the same session the dashboard validates.
 */
export const auth =
  authGlobals.__dotenvmgrAuth ??
  (authGlobals.__dotenvmgrAuth = createAdminAuth({
    credentials: {
      username: process.env.ADMIN_USERNAME ?? '',
      password: process.env.ADMIN_PASSWORD ?? '',
    },
    secret:
      process.env.BETTER_AUTH_SECRET ??
      'dotenvmgr-development-only-auth-secret-change-me',
    baseURL,
  }));
