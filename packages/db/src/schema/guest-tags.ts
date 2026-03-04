import { boolean, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { weddings } from './weddings'

export const guestTags = pgTable('guest_tags', {
  id: uuid('id').primaryKey().defaultRandom(),
  weddingId: uuid('wedding_id')
    .notNull()
    .references(() => weddings.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  color: text('color').notNull(),
  isDefault: boolean('is_default').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export type GuestTagRecord = typeof guestTags.$inferSelect
export type NewGuestTag = typeof guestTags.$inferInsert
