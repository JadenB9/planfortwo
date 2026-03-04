import { jsonb, pgEnum, pgTable, timestamp, uuid } from 'drizzle-orm/pg-core'
import { weddings } from './weddings'
import { users } from './users'

export const activityActionEnum = pgEnum('activity_action', [
  'task_created',
  'task_completed',
  'task_uncompleted',
  'task_updated',
  'task_deleted',
  'task_assigned',
  'note_added',
  'attachment_uploaded',
  'category_created',
  'category_deleted',
  'checklist_seeded',
  'guest_created',
  'guest_updated',
  'guest_deleted',
  'guest_imported',
  'rsvp_submitted',
  'household_created',
  'household_deleted',
])

export const entityTypeEnum = pgEnum('entity_type', [
  'task',
  'category',
  'note',
  'attachment',
  'guest',
  'household',
])

export const activityLog = pgTable('activity_log', {
  id: uuid('id').primaryKey().defaultRandom(),
  weddingId: uuid('wedding_id')
    .notNull()
    .references(() => weddings.id, { onDelete: 'cascade' }),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  action: activityActionEnum('action').notNull(),
  entityType: entityTypeEnum('entity_type').notNull(),
  entityId: uuid('entity_id').notNull(),
  metadata: jsonb('metadata').$type<Record<string, unknown>>(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export type ActivityLogRecord = typeof activityLog.$inferSelect
export type NewActivityLog = typeof activityLog.$inferInsert
