import { boolean, jsonb, pgEnum, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { users } from './users'

export const emailDirectionEnum = pgEnum('email_direction', ['inbound', 'outbound'])

export const emailAddresses = pgTable('email_addresses', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  address: text('address').notNull().unique(),
  displayName: text('display_name').notNull(),
  isAdmin: boolean('is_admin').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export type EmailAddressRecord = typeof emailAddresses.$inferSelect
export type NewEmailAddress = typeof emailAddresses.$inferInsert

export interface EmailAttachment {
  id: string
  filename: string
  contentType: string
  size: number
  r2Key?: string
  url?: string
}

export const emails = pgTable('emails', {
  id: uuid('id').primaryKey().defaultRandom(),
  emailAddressId: uuid('email_address_id')
    .notNull()
    .references(() => emailAddresses.id, { onDelete: 'cascade' }),
  direction: emailDirectionEnum('direction').notNull(),
  resendEmailId: text('resend_email_id'),
  fromAddress: text('from_address').notNull(),
  fromName: text('from_name'),
  toAddress: text('to_address').notNull(),
  ccAddresses: text('cc_addresses'),
  subject: text('subject').notNull().default('(No Subject)'),
  textBody: text('text_body'),
  htmlBody: text('html_body'),
  isRead: boolean('is_read').notNull().default(false),
  isStarred: boolean('is_starred').notNull().default(false),
  messageId: text('message_id'),
  inReplyToMessageId: text('in_reply_to_message_id'),
  replyTo: text('reply_to'),
  attachments: jsonb('attachments').$type<EmailAttachment[]>().default([]),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export type EmailRecord = typeof emails.$inferSelect
export type NewEmail = typeof emails.$inferInsert
