import { describe, expect, it } from 'vitest';
import { createAdminAuth } from '../src/auth/admin-auth';

const BASE_URL = 'https://admin.dotenvmgr.test';
const CREDENTIALS = {
  username: 'operator',
  password: 'correct horse battery staple',
};

function createTestAuth() {
  return createAdminAuth({
    credentials: CREDENTIALS,
    secret: 'test-only-better-auth-secret-with-enough-entropy',
    baseURL: BASE_URL,
    secureCookies: true,
  });
}

function authRequest(path: string, init: RequestInit = {}): Request {
  const headers = new Headers(init.headers);
  headers.set('origin', BASE_URL);
  if (init.body) {
    headers.set('content-type', 'application/json');
  }

  return new Request(`${BASE_URL}/api/auth${path}`, {
    ...init,
    headers,
  });
}

function signIn(
  auth: ReturnType<typeof createTestAuth>,
  username: string,
  password: string,
): Promise<Response> {
  return auth.handler(
    authRequest('/sign-in/admin', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),
  );
}

describe('single-admin authentication', () => {
  it('rejects an invalid password without issuing a session cookie', async () => {
    const auth = createTestAuth();

    const response = await signIn(auth, CREDENTIALS.username, 'wrong password');

    expect(response.status).toBe(401);
    expect(response.headers.get('set-cookie')).toBeNull();
  });

  it('rejects an invalid username without issuing a session cookie', async () => {
    const auth = createTestAuth();

    const response = await signIn(auth, 'intruder', CREDENTIALS.password);

    expect(response.status).toBe(401);
    expect(response.headers.get('set-cookie')).toBeNull();
  });

  it('issues an HTTP-only secure session for valid credentials', async () => {
    const auth = createTestAuth();

    const response = await signIn(auth, CREDENTIALS.username, CREDENTIALS.password);

    expect(response.status).toBe(200);
    const setCookie = response.headers.get('set-cookie');
    expect(setCookie).not.toBeNull();
    expect(setCookie).toMatch(/HttpOnly/i);
    expect(setCookie).toMatch(/SameSite=Lax/i);
    expect(setCookie).toMatch(/Secure/i);

    const cookie = setCookie!.split(';', 1)[0]!;
    const sessionResponse = await auth.handler(
      authRequest('/get-session', { headers: { cookie } }),
    );

    expect(sessionResponse.status).toBe(200);
    await expect(sessionResponse.json()).resolves.toMatchObject({
      user: { name: CREDENTIALS.username },
    });
  });

  it('has no session before sign-in and invalidates the cookie on sign-out', async () => {
    const auth = createTestAuth();

    const anonymousResponse = await auth.handler(authRequest('/get-session'));
    await expect(anonymousResponse.json()).resolves.toBeNull();

    const signInResponse = await signIn(
      auth,
      CREDENTIALS.username,
      CREDENTIALS.password,
    );
    const cookie = signInResponse.headers.get('set-cookie')!.split(';', 1)[0]!;

    const signOutResponse = await auth.handler(
      authRequest('/sign-out', {
        method: 'POST',
        headers: { cookie },
      }),
    );
    expect(signOutResponse.status).toBe(200);

    const staleSessionResponse = await auth.handler(
      authRequest('/get-session', { headers: { cookie } }),
    );
    await expect(staleSessionResponse.json()).resolves.toBeNull();
  });

  it('fails closed when instance credentials are not configured', async () => {
    const auth = createAdminAuth({
      credentials: { username: '', password: '' },
      secret: 'test-only-better-auth-secret-with-enough-entropy',
      baseURL: BASE_URL,
      secureCookies: true,
    });

    const response = await signIn(auth, '', '');

    expect(response.status).toBeGreaterThanOrEqual(400);
    expect(response.headers.get('set-cookie')).toBeNull();
  });
});
