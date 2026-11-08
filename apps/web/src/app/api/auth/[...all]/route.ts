import { toNextJsHandler } from 'better-auth/next-js';
import { auth } from '@/auth/auth';

const handler = toNextJsHandler(auth);

export const { GET, POST, PATCH, PUT, DELETE } = handler;
