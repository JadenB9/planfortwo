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
  'budget_category_created',
  'budget_category_deleted',
  'expense_created',
  'expense_updated',
  'expense_deleted',
  'payment_scheduled',
  'payment_completed',
  'website_created',
  'website_published',
  'website_unpublished',
  'website_section_updated',
  'website_template_changed',
  'guestbook_entry_created',
  'campaign_created',
  'announcement_created',
  'event_created',
  'seating_chart_created',
  'vendor_created',
  'party_member_added',
  'payment_deleted',
])

export const entityTypeEnum = pgEnum('entity_type', [
  'task',
  'category',
  'note',
  'attachment',
  'guest',
  'household',
  'budget_category',
  'budget_item',
  'payment',
  'website',
  'website_section',
  'guestbook_entry',
  'email_campaign',
  'event',
  'seating_chart',
  'vendor',
  'wedding_party',
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
