import { describe, expect, it } from 'vitest';
import { createCryptoVault, createMemorySqliteStorage } from '../src/index.js';

const MASTER_SECRET = 'integration master secret that never touches sqlite';

describe('secret storage roundtrip', () => {
  it('ingests dotenv, encrypts, persists ciphertext only, and decrypts', async () => {
    const vault = await createCryptoVault(MASTER_SECRET);
    const storage = await createMemorySqliteStorage();
    const project = await storage.createProject({
      name: 'Payments API',
      slug: 'payments-api',
    });

    const source = [
      '# Production payment configuration',
      'DATABASE_URL="postgres://admin:hunter2@db.internal:5432/payments"',
      'STRIPE_SECRET_KEY=sk_live_51H8xYzABC123',
      'MULTILINE_CERT="-----BEGIN CERTIFICATE-----',
      'MIIBszCCAVmgAwIBAgIUQ4',
      '-----END CERTIFICATE-----"',
      'ENABLE_RETRIES=retry-policy-v2',
    ].join('\n');

    const parsed = vault.parseDotenv(source);
    const encrypted = await Promise.all(
      Object.entries(parsed).map(async ([key, value]) => ({
        key,
        ...(await vault.encrypt(value)),
      })),
    );

    await storage.bulkSetSecrets(project.id, 'production', encrypted);

    const stored = await storage.getSecrets(project.id, 'production');
    expect(stored).toHaveLength(Object.keys(parsed).length);

    const decrypted: Record<string, string> = {};
    for (const secret of stored) {
      expect(secret.ciphertext).not.toContain(parsed[secret.key]);
      decrypted[secret.key] = await vault.decrypt(secret);
    }

    expect(decrypted).toEqual(parsed);
    expect(vault.formatDotenv(decrypted)).toBe(vault.formatDotenv(parsed));

    const databaseBytes = Buffer.from(storage.exportDatabase()).toString(
      'latin1',
    );
    for (const value of Object.values(parsed)) {
      expect(databaseBytes).not.toContain(value);
    }
    for (const secret of stored) {
      expect(databaseBytes).toContain(secret.ciphertext);
    }
  });
});
