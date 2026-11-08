import { createCryptoVault } from '@dotenvmgr/core';

export const CLI_NAME = 'dotenvmgr';

export async function main(argv: string[]): Promise<number> {
  if (argv.includes('--help') || argv.length === 0) {
    process.stdout.write('Usage: dotenvmgr <command>\n');
    return 0;
  }

  // Commands are added by subsequent issues; the vault is wired here so the
  // CLI package participates in the shared cryptographic seam from day one.
  const vault = await createCryptoVault(process.env.ENCRYPTION_MASTER_KEY ?? '');
  void vault;

  process.stderr.write(`Unknown command: ${argv[0]}\n`);
  return 1;
}
