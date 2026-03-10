import { boolean, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { weddings } from './weddings'

export const prayers = pgTable('prayers', {
  id: uuid('id').primaryKey().defaultRandom(),
  weddingId: uuid('wedding_id')
    .notNull()
    .references(() => weddings.id, { onDelete: 'cascade' }),
  authorName: text('author_name').notNull(),
  prayerText: text('prayer_text').notNull(),
  isApproved: boolean('is_approved').notNull().default(false),
  isVisible: boolean('is_visible').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export type PrayerRecord = typeof prayers.$inferSelect
export type NewPrayer = typeof prayers.$inferInsert
