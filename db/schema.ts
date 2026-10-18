// Intentionally empty by default.
// Add Drizzle tables here when the site actually needs a database.
// See examples/d1/db/schema.ts for an opt-in example.
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
export const workspaces = sqliteTable('workspaces', { userId: text('user_id').primaryKey(), payload: text('payload').notNull(), updatedAt: text('updated_at').notNull() });
export const usageLimits = sqliteTable('usage_limits', { bucket: text('bucket').primaryKey(), count: integer('count').notNull() });
