import { pgTable, timestamp, unique, uuid } from 'drizzle-orm/pg-core'
import { guests } from './guests'
import { guestTags } from './guest-tags'

export const guestTagAssignments = pgTable(
  'guest_tag_assignments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    guestId: uuid('guest_id')
      .notNull()
      .references(() => guests.id, { onDelete: 'cascade' }),
    tagId: uuid('tag_id')
      .notNull()
      .references(() => guestTags.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [unique('guest_tag_unique').on(t.guestId, t.tagId)],
)

export type GuestTagAssignmentRecord = typeof guestTagAssignments.$inferSelect
export type NewGuestTagAssignment = typeof guestTagAssignments.$inferInsert
