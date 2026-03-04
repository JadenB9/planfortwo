import { integer, jsonb, numeric, pgEnum, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { weddings } from './weddings'

export const vendorStatusEnum = pgEnum('vendor_status', [
  'researching', 'contacted', 'quoted', 'booked', 'paid', 'completed',
])

export const contractStatusEnum = pgEnum('contract_status', [
  'pending', 'signed', 'active', 'completed',
])

export const vendors = pgTable('vendors', {
  id: uuid('id').primaryKey().defaultRandom(),
  weddingId: uuid('wedding_id')
    .notNull()
    .references(() => weddings.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  category: text('category').notNull(),
  status: vendorStatusEnum('status').notNull().default('researching'),
  contactName: text('contact_name'),
  email: text('email'),
  phone: text('phone'),
  website: text('website'),
  address: text('address'),
  notes: text('notes'),
  cost: numeric('cost', { precision: 12, scale: 2 }),
  depositAmount: numeric('deposit_amount', { precision: 12, scale: 2 }),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
})

export const vendorCommunications = pgTable('vendor_communications', {
  id: uuid('id').primaryKey().defaultRandom(),
  vendorId: uuid('vendor_id')
    .notNull()
    .references(() => vendors.id, { onDelete: 'cascade' }),
  type: text('type').notNull().default('note'),
  subject: text('subject'),
  content: text('content').notNull(),
  contactDate: timestamp('contact_date', { withTimezone: true }).notNull().defaultNow(),
  followUpDate: timestamp('follow_up_date', { withTimezone: true }),
  attachmentUrl: text('attachment_url'),
  attachmentName: text('attachment_name'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const vendorContracts = pgTable('vendor_contracts', {
  id: uuid('id').primaryKey().defaultRandom(),
  vendorId: uuid('vendor_id')
    .notNull()
    .references(() => vendors.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  fileUrl: text('file_url'),
  fileName: text('file_name'),
  status: contractStatusEnum('status').notNull().default('pending'),
  signedDate: timestamp('signed_date', { withTimezone: true }),
  depositDueDate: timestamp('deposit_due_date', { withTimezone: true }),
  balanceDueDate: timestamp('balance_due_date', { withTimezone: true }),
  cancellationDeadline: timestamp('cancellation_deadline', { withTimezone: true }),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
})

export type VendorRecord = typeof vendors.$inferSelect
export type NewVendor = typeof vendors.$inferInsert
export type VendorCommunicationRecord = typeof vendorCommunications.$inferSelect
export type NewVendorCommunication = typeof vendorCommunications.$inferInsert
export type VendorContractRecord = typeof vendorContracts.$inferSelect
export type NewVendorContract = typeof vendorContracts.$inferInsert
