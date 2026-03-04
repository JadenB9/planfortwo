import { boolean, integer, pgEnum, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { weddings } from './weddings'

export const thankYouStatusEnum = pgEnum('thank_you_status', ['not_started', 'drafted', 'sent'])

export const thankYouNotes = pgTable('thank_you_notes', {
  id: uuid('id').primaryKey().defaultRandom(),
  weddingId: uuid('wedding_id')
    .notNull()
    .references(() => weddings.id, { onDelete: 'cascade' }),
  guestId: uuid('guest_id'),
  giftId: uuid('gift_id'),
  recipientName: text('recipient_name').notNull(),
  recipientEmail: text('recipient_email'),
  recipientAddress: text('recipient_address'),
  message: text('message'),
  status: thankYouStatusEnum('status').notNull().default('not_started'),
  sentAt: timestamp('sent_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
})

export const nameChangeTasks = pgTable('name_change_tasks', {
  id: uuid('id').primaryKey().defaultRandom(),
  weddingId: uuid('wedding_id')
    .notNull()
    .references(() => weddings.id, { onDelete: 'cascade' }),
  institution: text('institution').notNull(),
  description: text('description'),
  documentsRequired: text('documents_required'),
  isCompleted: boolean('is_completed').notNull().default(false),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const vendorReviews = pgTable('vendor_reviews', {
  id: uuid('id').primaryKey().defaultRandom(),
  weddingId: uuid('wedding_id')
    .notNull()
    .references(() => weddings.id, { onDelete: 'cascade' }),
  vendorId: uuid('vendor_id').notNull(),
  rating: integer('rating').notNull(),
  reviewText: text('review_text'),
  isPublished: boolean('is_published').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const notificationPreferences = pgTable('notification_preferences', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(),
  weddingId: uuid('wedding_id')
    .notNull()
    .references(() => weddings.id, { onDelete: 'cascade' }),
  emailRsvp: boolean('email_rsvp').notNull().default(true),
  emailPaymentReminder: boolean('email_payment_reminder').notNull().default(true),
  emailTaskDue: boolean('email_task_due').notNull().default(true),
  emailWeeklySummary: boolean('email_weekly_summary').notNull().default(true),
  digestFrequency: text('digest_frequency').notNull().default('instant'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
})

export type ThankYouNoteRecord = typeof thankYouNotes.$inferSelect
export type NewThankYouNote = typeof thankYouNotes.$inferInsert
export type NameChangeTaskRecord = typeof nameChangeTasks.$inferSelect
export type NewNameChangeTask = typeof nameChangeTasks.$inferInsert
export type VendorReviewRecord = typeof vendorReviews.$inferSelect
export type NewVendorReview = typeof vendorReviews.$inferInsert
export type NotificationPreferenceRecord = typeof notificationPreferences.$inferSelect
export type NewNotificationPreference = typeof notificationPreferences.$inferInsert
