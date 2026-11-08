import { APIError, createAuthEndpoint } from 'better-auth/api';
import { memoryAdapter } from 'better-auth/adapters/memory';
import { setSessionCookie } from 'better-auth/cookies';
import { nextCookies } from 'better-auth/next-js';
import { betterAuth } from 'better-auth';
import { z } from 'zod';
import { verifyAdminCredentials, type AdminCredentials } from './credentials';

const ADMIN_EMAIL = 'admin@dotenvmgr.local';

export interface AdminAuthConfig {
  credentials: AdminCredentials;
  secret: string;
  baseURL: string;
  /** Defaults to requiring HTTPS whenever the configured base URL is HTTPS. */
  secureCookies?: boolean;
}

const signInBodySchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
  rememberMe: z.boolean().optional(),
});

/**
 * Builds the single-admin Better Auth instance.
 *
 * The admin account is derived from instance environment credentials rather
 * than a database row. Better Auth still owns session creation, cookie signing,
 * and session invalidation, so routes never handle tokens directly.
 */
export function createAdminAuth(config: AdminAuthConfig) {
  const signInAdmin = createAuthEndpoint(
    '/sign-in/admin',
    {
      method: 'POST',
      body: signInBodySchema,
    },
    async (ctx) => {
      const { username, password, rememberMe } = ctx.body;

      if (!(await verifyAdminCredentials({ username, password }, config.credentials))) {
        throw APIError.from('UNAUTHORIZED', {
          code: 'INVALID_ADMIN_CREDENTIALS',
          message: 'Invalid username or password',
        });
      }

      let admin = await ctx.context.internalAdapter.findUserByEmail(ADMIN_EMAIL);
      if (!admin) {
        const user = await ctx.context.internalAdapter.createUser(
          {
            email: ADMIN_EMAIL,
            name: username,
            emailVerified: true,
          },
          { method: 'email-password' },
        );
        admin = { user, accounts: [] };
      } else if (admin.user.name !== username) {
        admin.user = await ctx.context.internalAdapter.updateUser(admin.user.id, {
          name: username,
        });
      }

      const session = await ctx.context.internalAdapter.createSession(
        admin.user.id,
        rememberMe === false,
      );
      await setSessionCookie(ctx, { session, user: admin.user }, rememberMe === false);

      return ctx.json({
        token: session.token,
        user: {
          id: admin.user.id,
          username: admin.user.name,
        },
      });
    },
  );

  return betterAuth({
    appName: 'dotenvmgr',
    baseURL: config.baseURL,
    secret: config.secret,
    database: memoryAdapter({
      user: [],
      session: [],
      account: [],
      verification: [],
    }),
    session: {
      expiresIn: 60 * 60 * 24 * 7,
      updateAge: 60 * 60 * 24,
      cookieCache: {
        enabled: true,
        maxAge: 60 * 60 * 24 * 7,
      },
    },
    advanced: {
      useSecureCookies: config.secureCookies ?? config.baseURL.startsWith('https://'),
      defaultCookieAttributes: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
      },
    },
    plugins: [
      {
        id: 'admin-credentials',
        endpoints: {
          signInAdmin,
        },
      },
      nextCookies(),
    ],
  });
}
