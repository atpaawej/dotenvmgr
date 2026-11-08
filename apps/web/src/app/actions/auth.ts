'use server';

import { isAPIError } from 'better-auth/api';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { auth } from '@/auth/auth';

export interface LoginState {
  error: string | null;
}

export async function signInAction(
  _previousState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const username = String(formData.get('username') ?? '').trim();
  const password = String(formData.get('password') ?? '');

  if (!username || !password) {
    return { error: 'Enter both your username and password.' };
  }

  try {
    await auth.api.signInAdmin({
      body: { username, password },
      headers: await headers(),
    });
  } catch (error) {
    if (isAPIError(error) && error.statusCode === 401) {
      return { error: 'Invalid username or password.' };
    }

    return { error: 'Sign in failed. Please try again.' };
  }

  redirect('/dashboard');
}

export async function signOutAction(): Promise<void> {
  await auth.api.signOut({ headers: await headers() });
  redirect('/login');
}
