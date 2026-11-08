import type { EncryptedPayload } from '../crypto/types.js';

export interface Project {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export type EnvironmentMode = 'production' | 'dev' | 'test';

export const ENVIRONMENT_MODES: readonly EnvironmentMode[] = [
  'production',
  'dev',
  'test',
];

export interface StoredSecret {
  id: string;
  key: string;
  ciphertext: string;
  iv: string;
  tag: string;
  updatedAt: Date;
}

export interface DataStorage {
  createProject(data: {
    name: string;
    slug: string;
    description?: string;
  }): Promise<Project>;
  getProjectBySlug(slug: string): Promise<Project | null>;
  listProjects(): Promise<Project[]>;
  deleteProject(id: string): Promise<void>;

  getSecrets(projectId: string, env: EnvironmentMode): Promise<StoredSecret[]>;
  setSecret(
    projectId: string,
    env: EnvironmentMode,
    key: string,
    payload: EncryptedPayload,
  ): Promise<void>;
  bulkSetSecrets(
    projectId: string,
    env: EnvironmentMode,
    items: Array<{ key: string } & EncryptedPayload>,
  ): Promise<void>;
  deleteSecret(projectId: string, env: EnvironmentMode, key: string): Promise<void>;
}

export class StorageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'StorageError';
  }
}
