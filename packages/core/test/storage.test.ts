import { describe, expect, it } from 'vitest';
import {
  createCryptoVault,
  createMemorySqliteStorage,
  StorageError,
  type EnvironmentMode,
  type EncryptedPayload,
} from '../src/index.js';

const MASTER_SECRET = 'storage adapter master secret';

async function encrypted(
  plaintext: string,
): Promise<EncryptedPayload> {
  const vault = await createCryptoVault(MASTER_SECRET);
  return vault.encrypt(plaintext);
}

describe('MemorySqliteStorageAdapter', () => {
  it('provisions projects with all environments', async () => {
    const storage = await createMemorySqliteStorage();

    const project = await storage.createProject({
      name: 'Payments API',
      slug: 'payments-api',
      description: 'Production payment credentials',
    });

    expect(project.description).toBe('Production payment credentials');
    expect(await storage.getProjectBySlug('payments-api')).toEqual(project);
    expect(await storage.listProjects()).toEqual([project]);

    for (const mode of ['production', 'dev', 'test'] as EnvironmentMode[]) {
      await expect(storage.getSecrets(project.id, mode)).resolves.toEqual([]);
    }
  });

  it('stores encrypted payloads and upserts by key', async () => {
    const storage = await createMemorySqliteStorage();
    const project = await storage.createProject({
      name: 'Payments API',
      slug: 'payments-api',
    });
    const first = await encrypted('first value');
    const second = await encrypted('second value');

    await storage.setSecret(project.id, 'production', 'API_KEY', first);
    await storage.setSecret(project.id, 'production', 'API_KEY', second);

    const stored = await storage.getSecrets(project.id, 'production');
    expect(stored).toHaveLength(1);
    expect(stored[0]).toMatchObject({
      key: 'API_KEY',
      ciphertext: second.ciphertext,
      iv: second.iv,
      tag: second.tag,
    });
  });

  it('bulk sets and deletes secrets per environment', async () => {
    const storage = await createMemorySqliteStorage();
    const project = await storage.createProject({
      name: 'Payments API',
      slug: 'payments-api',
    });
    const apiKey = await encrypted('api-key');
    const databaseUrl = await encrypted('database-url');

    await storage.bulkSetSecrets(project.id, 'dev', [
      { key: 'API_KEY', ...apiKey },
      { key: 'DATABASE_URL', ...databaseUrl },
    ]);

    expect(
      (await storage.getSecrets(project.id, 'dev')).map((secret) => secret.key),
    ).toEqual(['API_KEY', 'DATABASE_URL']);
    expect(await storage.getSecrets(project.id, 'production')).toEqual([]);

    await storage.deleteSecret(project.id, 'dev', 'API_KEY');

    expect(
      (await storage.getSecrets(project.id, 'dev')).map((secret) => secret.key),
    ).toEqual(['DATABASE_URL']);
  });

  it('cascades environment and secret deletion with the project', async () => {
    const storage = await createMemorySqliteStorage();
    const project = await storage.createProject({
      name: 'Payments API',
      slug: 'payments-api',
    });
    await storage.setSecret(
      project.id,
      'test',
      'API_KEY',
      await encrypted('api-key'),
    );

    await storage.deleteProject(project.id);

    expect(await storage.getProjectBySlug('payments-api')).toBeNull();
    await expect(storage.getSecrets(project.id, 'test')).rejects.toBeInstanceOf(
      StorageError,
    );
  });

  it('rejects secrets for unknown environments', async () => {
    const storage = await createMemorySqliteStorage();

    await expect(
      storage.setSecret(
        'missing-project',
        'production',
        'API_KEY',
        await encrypted('api-key'),
      ),
    ).rejects.toBeInstanceOf(StorageError);
  });
});
