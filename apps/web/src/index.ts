import { createCryptoVault } from '@dotenvmgr/core';

export const WEB_APP_NAME = 'dotenvmgr web';

export async function openVault(masterSecret: string) {
  return createCryptoVault(masterSecret);
}
