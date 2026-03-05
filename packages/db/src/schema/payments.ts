import { boolean, numeric, pgEnum, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { weddings } from './weddings'

export const purchaseStatusEnum = pgEnum('purchase_status', ['pending', 'completed', 'refunded', 'failed'])

export const purchases = pgTable('purchases', {
  id: uuid('id').primaryKey().defaultRandom(),
  weddingId: uuid('wedding_id')
    .notNull()
    .references(() => weddings.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull(),
  stripeSessionId: text('stripe_session_id'),
  stripePaymentIntentId: text('stripe_payment_intent_id'),
  amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
  currency: text('currency').notNull().default('usd'),
  status: purchaseStatusEnum('status').notNull().default('pending'),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const referrals = pgTable('referrals', {
  id: uuid('id').primaryKey().defaultRandom(),
  referrerUserId: uuid('referrer_user_id').notNull(),
  referralCode: text('referral_code').notNull().unique(),
  referredEmail: text('referred_email'),
  referredUserId: uuid('referred_user_id'),
  isConverted: boolean('is_converted').notNull().default(false),
  convertedAt: timestamp('converted_at', { withTimezone: true }),
  rewardGranted: boolean('reward_granted').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const contactSubmissions = pgTable('contact_submissions', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  email: text('email').notNull(),
  subject: text('subject').notNull(),
  message: text('message').notNull(),
  isRead: boolean('is_read').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const adminNotes = pgTable('admin_notes', {
  id: uuid('id').primaryKey().defaultRandom(),
  entityType: text('entity_type').notNull(),
  entityId: uuid('entity_id').notNull(),
  content: text('content').notNull(),
  createdBy: uuid('created_by').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export type PurchaseRecord = typeof purchases.$inferSelect
export type NewPurchase = typeof purchases.$inferInsert
export type ReferralRecord = typeof referrals.$inferSelect
export type NewReferral = typeof referrals.$inferInsert
export type ContactSubmissionRecord = typeof contactSubmissions.$inferSelect
export type NewContactSubmission = typeof contactSubmissions.$inferInsert
export type AdminNoteRecord = typeof adminNotes.$inferSelect
export type NewAdminNote = typeof adminNotes.$inferInsert
