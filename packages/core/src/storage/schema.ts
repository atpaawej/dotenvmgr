import {
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from 'drizzle-orm/sqlite-core';

export const projects = sqliteTable('projects', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  description: text('description'),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull(),
});

export const environments = sqliteTable(
  'environments',
  {
    id: text('id').primaryKey(),
    projectId: text('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    mode: text('mode', { enum: ['production', 'dev', 'test'] }).notNull(),
    createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
  },
  (table) => [
    uniqueIndex('environments_project_mode_unique').on(
      table.projectId,
      table.mode,
    ),
  ],
);

export const secrets = sqliteTable(
  'secrets',
  {
    id: text('id').primaryKey(),
    environmentId: text('environment_id')
      .notNull()
      .references(() => environments.id, { onDelete: 'cascade' }),
    key: text('key').notNull(),
    ciphertext: text('ciphertext').notNull(),
    iv: text('iv').notNull(),
    tag: text('tag').notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull(),
  },
  (table) => [
    uniqueIndex('secrets_environment_key_unique').on(
      table.environmentId,
      table.key,
    ),
  ],
);

export const schema = {
  projects,
  environments,
  secrets,
};
