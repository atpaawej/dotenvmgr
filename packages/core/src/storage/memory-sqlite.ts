import { createRequire } from 'node:module';
import initSqlJs, { type Database as SqlJsDatabase } from 'sql.js';
import { and, eq } from 'drizzle-orm';
import { drizzle, type SQLJsDatabase } from 'drizzle-orm/sql-js';
import type { EncryptedPayload } from '../crypto/types.js';
import { environments, projects, schema, secrets } from './schema.js';
import {
  ENVIRONMENT_MODES,
  StorageError,
  type DataStorage,
  type EnvironmentMode,
  type Project,
  type StoredSecret,
} from './types.js';

const require = createRequire(import.meta.url);

const SCHEMA_SQL = `
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS environments (
  id TEXT PRIMARY KEY NOT NULL,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  mode TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS environments_project_mode_unique
  ON environments (project_id, mode);

CREATE TABLE IF NOT EXISTS secrets (
  id TEXT PRIMARY KEY NOT NULL,
  environment_id TEXT NOT NULL REFERENCES environments(id) ON DELETE CASCADE,
  key TEXT NOT NULL,
  ciphertext TEXT NOT NULL,
  iv TEXT NOT NULL,
  tag TEXT NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS secrets_environment_key_unique
  ON secrets (environment_id, key);
`;

export interface MemorySqliteStorageOptions {
  /** Inject an existing in-memory database, useful for inspecting persisted bytes. */
  database?: SqlJsDatabase;
}

function toProject(row: typeof projects.$inferSelect): Project {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class MemorySqliteStorageAdapter implements DataStorage {
  private constructor(
    private readonly sqlite: SqlJsDatabase,
    private readonly db: SQLJsDatabase<typeof schema>,
  ) {}

  static async create(
    options: MemorySqliteStorageOptions = {},
  ): Promise<MemorySqliteStorageAdapter> {
    let sqlite = options.database;
    if (!sqlite) {
      const SQL = await initSqlJs({
        locateFile: () => require.resolve('sql.js/dist/sql-wasm.wasm'),
      });
      sqlite = new SQL.Database();
    }

    sqlite.exec(SCHEMA_SQL);
    const db = drizzle(sqlite, { schema });
    return new MemorySqliteStorageAdapter(sqlite, db);
  }

  private findEnvironment(
    projectId: string,
    mode: EnvironmentMode,
  ): typeof environments.$inferSelect {
    const environment = this.db
      .select()
      .from(environments)
      .where(
        and(
          eq(environments.projectId, projectId),
          eq(environments.mode, mode),
        ),
      )
      .get();

    if (!environment) {
      throw new StorageError(
        `Environment "${mode}" does not exist for project ${projectId}`,
      );
    }

    return environment;
  }

  async createProject(data: {
    name: string;
    slug: string;
    description?: string;
  }): Promise<Project> {
    const now = new Date();
    const project: Project = {
      id: globalThis.crypto.randomUUID(),
      name: data.name,
      slug: data.slug,
      description: data.description ?? null,
      createdAt: now,
      updatedAt: now,
    };

    this.db.transaction((tx) => {
      tx.insert(projects).values(project).run();
      for (const mode of ENVIRONMENT_MODES) {
        tx.insert(environments)
          .values({
            id: globalThis.crypto.randomUUID(),
            projectId: project.id,
            mode,
            createdAt: now,
          })
          .run();
      }
    });

    return project;
  }

  async getProjectBySlug(slug: string): Promise<Project | null> {
    const row = this.db
      .select()
      .from(projects)
      .where(eq(projects.slug, slug))
      .get();

    return row ? toProject(row) : null;
  }

  async listProjects(): Promise<Project[]> {
    return this.db
      .select()
      .from(projects)
      .all()
      .map(toProject);
  }

  async deleteProject(id: string): Promise<void> {
    this.db.delete(projects).where(eq(projects.id, id)).run();
  }

  async getSecrets(
    projectId: string,
    env: EnvironmentMode,
  ): Promise<StoredSecret[]> {
    const environment = this.findEnvironment(projectId, env);

    return this.db
      .select({
        id: secrets.id,
        key: secrets.key,
        ciphertext: secrets.ciphertext,
        iv: secrets.iv,
        tag: secrets.tag,
        updatedAt: secrets.updatedAt,
      })
      .from(secrets)
      .where(eq(secrets.environmentId, environment.id))
      .all();
  }

  async setSecret(
    projectId: string,
    env: EnvironmentMode,
    key: string,
    payload: EncryptedPayload,
  ): Promise<void> {
    const environment = this.findEnvironment(projectId, env);
    this.upsertSecret(environment.id, key, payload);
  }

  async bulkSetSecrets(
    projectId: string,
    env: EnvironmentMode,
    items: Array<{ key: string } & EncryptedPayload>,
  ): Promise<void> {
    const environment = this.findEnvironment(projectId, env);

    this.db.transaction((tx) => {
      for (const { key, ...payload } of items) {
        const now = new Date();
        tx.insert(secrets)
          .values({
            id: globalThis.crypto.randomUUID(),
            environmentId: environment.id,
            key,
            ...payload,
            updatedAt: now,
          })
          .onConflictDoUpdate({
            target: [secrets.environmentId, secrets.key],
            set: {
              ciphertext: payload.ciphertext,
              iv: payload.iv,
              tag: payload.tag,
              updatedAt: now,
            },
          })
          .run();
      }
    });
  }

  async deleteSecret(
    projectId: string,
    env: EnvironmentMode,
    key: string,
  ): Promise<void> {
    const environment = this.findEnvironment(projectId, env);
    this.db
      .delete(secrets)
      .where(
        and(
          eq(secrets.environmentId, environment.id),
          eq(secrets.key, key),
        ),
      )
      .run();
  }

  private upsertSecret(
    environmentId: string,
    key: string,
    payload: EncryptedPayload,
  ): void {
    const now = new Date();
    this.db
      .insert(secrets)
      .values({
        id: globalThis.crypto.randomUUID(),
        environmentId,
        key,
        ...payload,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: [secrets.environmentId, secrets.key],
        set: {
          ciphertext: payload.ciphertext,
          iv: payload.iv,
          tag: payload.tag,
          updatedAt: now,
        },
      })
      .run();
  }

  /** Exposes the in-memory database for byte-level persistence assertions. */
  exportDatabase(): Uint8Array {
    return this.sqlite.export();
  }
}

export async function createMemorySqliteStorage(
  options: MemorySqliteStorageOptions = {},
): Promise<MemorySqliteStorageAdapter> {
  return MemorySqliteStorageAdapter.create(options);
}
