import { integer, numeric, pgEnum, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { weddings } from './weddings'
import { budgetCategories, payerEnum } from './budget-categories'

export const paymentStatusEnum = pgEnum('payment_status', ['unpaid', 'deposit', 'partial', 'paid'])

export const budgetItems = pgTable('budget_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  weddingId: uuid('wedding_id')
    .notNull()
    .references(() => weddings.id, { onDelete: 'cascade' }),
  categoryId: uuid('category_id')
    .notNull()
    .references(() => budgetCategories.id, { onDelete: 'cascade' }),
  vendorName: text('vendor_name'),
  description: text('description').notNull(),
  amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
  paidAmount: numeric('paid_amount', { precision: 12, scale: 2 }).notNull().default('0'),
  paymentStatus: paymentStatusEnum('payment_status').notNull().default('unpaid'),
  payer: payerEnum('payer').notNull().default('couple'),
  dueDate: timestamp('due_date', { withTimezone: true }),
  paidDate: timestamp('paid_date', { withTimezone: true }),
  receiptUrl: text('receipt_url'),
  receiptFileName: text('receipt_file_name'),
  notes: text('notes'),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
})

export type BudgetItemRecord = typeof budgetItems.$inferSelect
export type NewBudgetItem = typeof budgetItems.$inferInsert
