import { pgEnum, pgTable, timestamp, uuid } from 'drizzle-orm/pg-core'

import { users } from './users'
import { weddings } from './weddings'

export const weddingRoleEnum = pgEnum('wedding_role', [
  'owner',
  'partner',
  'planner',
  'family',
  'party_member',
])

export const weddingMembers = pgTable('wedding_members', {
  id: uuid('id').primaryKey().defaultRandom(),
  weddingId: uuid('wedding_id')
    .notNull()
    .references(() => weddings.id, { onDelete: 'cascade' }),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  role: weddingRoleEnum('role').notNull().default('owner'),
  invitedAt: timestamp('invited_at', { withTimezone: true }).notNull().defaultNow(),
  joinedAt: timestamp('joined_at', { withTimezone: true }),
})

export type WeddingMemberRecord = typeof weddingMembers.$inferSelect
export type NewWeddingMember = typeof weddingMembers.$inferInsert
