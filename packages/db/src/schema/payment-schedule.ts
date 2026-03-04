import { boolean, numeric, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { weddings } from './weddings'
import { budgetItems } from './budget-items'

export const paymentSchedule = pgTable('payment_schedule', {
  id: uuid('id').primaryKey().defaultRandom(),
  weddingId: uuid('wedding_id')
    .notNull()
    .references(() => weddings.id, { onDelete: 'cascade' }),
  budgetItemId: uuid('budget_item_id')
    .notNull()
    .references(() => budgetItems.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
  dueDate: timestamp('due_date', { withTimezone: true }).notNull(),
  paidDate: timestamp('paid_date', { withTimezone: true }),
  isPaid: boolean('is_paid').notNull().default(false),
  reminderSent7d: boolean('reminder_sent_7d').notNull().default(false),
  reminderSent1d: boolean('reminder_sent_1d').notNull().default(false),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export type PaymentScheduleRecord = typeof paymentSchedule.$inferSelect
export type NewPaymentSchedule = typeof paymentSchedule.$inferInsert
