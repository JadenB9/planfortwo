import { boolean, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { weddings } from './weddings'

export const guestbookEntries = pgTable('guestbook_entries', {
  id: uuid('id').primaryKey().defaultRandom(),
  weddingId: uuid('wedding_id')
    .notNull()
    .references(() => weddings.id, { onDelete: 'cascade' }),
  authorName: text('author_name').notNull(),
  message: text('message').notNull(),
  isApproved: boolean('is_approved').notNull().default(false),
  isVisible: boolean('is_visible').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export type GuestbookEntryRecord = typeof guestbookEntries.$inferSelect
export type NewGuestbookEntry = typeof guestbookEntries.$inferInsert
