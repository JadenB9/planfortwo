import { pgEnum, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'

import { users } from './users'
import { weddings } from './weddings'

export const invitationStatusEnum = pgEnum('invitation_status', [
  'pending',
  'accepted',
  'expired',
  'cancelled',
])

export const invitationRoleEnum = pgEnum('invitation_role', ['partner', 'planner', 'family'])

export const partnerInvitations = pgTable('partner_invitations', {
  id: uuid('id').primaryKey().defaultRandom(),
  weddingId: uuid('wedding_id')
    .notNull()
    .references(() => weddings.id, { onDelete: 'cascade' }),
  invitedByUserId: uuid('invited_by_user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  email: text('email').notNull(),
  token: text('token').notNull().unique(),
  role: invitationRoleEnum('role').notNull().default('partner'),
  status: invitationStatusEnum('status').notNull().default('pending'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
})

export type PartnerInvitationRecord = typeof partnerInvitations.$inferSelect
export type NewPartnerInvitation = typeof partnerInvitations.$inferInsert
