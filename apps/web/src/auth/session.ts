import { headers } from 'next/headers';
import { auth } from './auth';

export async function getAdminSession() {
  return auth.api.getSession({ headers: await headers() });
}
