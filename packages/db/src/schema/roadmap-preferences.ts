import { jsonb, pgTable, timestamp, uuid } from 'drizzle-orm/pg-core'
import { weddings } from './weddings'

export const roadmapPreferences = pgTable('roadmap_preferences', {
  id: uuid('id').primaryKey().defaultRandom(),
  weddingId: uuid('wedding_id')
    .notNull()
    .unique()
    .references(() => weddings.id, { onDelete: 'cascade' }),
  overrides: jsonb('overrides').notNull().default({}),
  hidden: jsonb('hidden').notNull().default([]),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export type RoadmapPreferencesRecord = typeof roadmapPreferences.$inferSelect
export type NewRoadmapPreferences = typeof roadmapPreferences.$inferInsert
