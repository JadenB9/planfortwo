import { boolean, integer, jsonb, pgEnum, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { weddings } from './weddings'

export const emailTemplateTypeEnum = pgEnum('email_template_type', [
  'save_the_date', 'invitation', 'update', 'reminder', 'thank_you', 'custom',
])

export const campaignStatusEnum = pgEnum('campaign_status', [
  'draft', 'scheduled', 'sending', 'sent', 'failed',
])

export const emailCampaigns = pgTable('email_campaigns', {
  id: uuid('id').primaryKey().defaultRandom(),
  weddingId: uuid('wedding_id')
    .notNull()
    .references(() => weddings.id, { onDelete: 'cascade' }),
  subject: text('subject').notNull(),
  body: text('body').notNull(),
  templateType: emailTemplateTypeEnum('template_type').notNull().default('custom'),
  status: campaignStatusEnum('status').notNull().default('draft'),
  scheduledAt: timestamp('scheduled_at', { withTimezone: true }),
  sentAt: timestamp('sent_at', { withTimezone: true }),
  recipientFilter: jsonb('recipient_filter').$type<Record<string, unknown>>(),
  recipientCount: integer('recipient_count').notNull().default(0),
  openCount: integer('open_count').notNull().default(0),
  clickCount: integer('click_count').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
})

export const emailRecipients = pgTable('email_recipients', {
  id: uuid('id').primaryKey().defaultRandom(),
  campaignId: uuid('campaign_id')
    .notNull()
    .references(() => emailCampaigns.id, { onDelete: 'cascade' }),
  guestId: uuid('guest_id'),
  email: text('email').notNull(),
  name: text('name').notNull(),
  sentAt: timestamp('sent_at', { withTimezone: true }),
  openedAt: timestamp('opened_at', { withTimezone: true }),
  clickedAt: timestamp('clicked_at', { withTimezone: true }),
  bounced: boolean('bounced').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const announcements = pgTable('announcements', {
  id: uuid('id').primaryKey().defaultRandom(),
  weddingId: uuid('wedding_id')
    .notNull()
    .references(() => weddings.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  content: text('content').notNull(),
  isPublished: boolean('is_published').notNull().default(false),
  publishedAt: timestamp('published_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
})

export type EmailCampaignRecord = typeof emailCampaigns.$inferSelect
export type NewEmailCampaign = typeof emailCampaigns.$inferInsert
export type EmailRecipientRecord = typeof emailRecipients.$inferSelect
export type NewEmailRecipient = typeof emailRecipients.$inferInsert
export type AnnouncementRecord = typeof announcements.$inferSelect
export type NewAnnouncement = typeof announcements.$inferInsert
