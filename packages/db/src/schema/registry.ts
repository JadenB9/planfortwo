import { boolean, integer, numeric, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { weddings } from './weddings'

export const registryLinks = pgTable('registry_links', {
  id: uuid('id').primaryKey().defaultRandom(),
  weddingId: uuid('wedding_id')
    .notNull()
    .references(() => weddings.id, { onDelete: 'cascade' }),
  storeName: text('store_name').notNull(),
  url: text('url').notNull(),
  logoUrl: text('logo_url'),
  clickCount: integer('click_count').notNull().default(0),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const cashFunds = pgTable('cash_funds', {
  id: uuid('id').primaryKey().defaultRandom(),
  weddingId: uuid('wedding_id')
    .notNull()
    .references(() => weddings.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  description: text('description'),
  goalAmount: numeric('goal_amount', { precision: 12, scale: 2 }).notNull().default('0'),
  currentAmount: numeric('current_amount', { precision: 12, scale: 2 }).notNull().default('0'),
  isActive: boolean('is_active').notNull().default(true),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
})

export const cashFundContributions = pgTable('cash_fund_contributions', {
  id: uuid('id').primaryKey().defaultRandom(),
  fundId: uuid('fund_id')
    .notNull()
    .references(() => cashFunds.id, { onDelete: 'cascade' }),
  guestName: text('guest_name').notNull(),
  guestEmail: text('guest_email'),
  amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
  message: text('message'),
  stripePaymentId: text('stripe_payment_id'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const gifts = pgTable('gifts', {
  id: uuid('id').primaryKey().defaultRandom(),
  weddingId: uuid('wedding_id')
    .notNull()
    .references(() => weddings.id, { onDelete: 'cascade' }),
  guestName: text('guest_name'),
  description: text('description').notNull(),
  estimatedValue: numeric('estimated_value', { precision: 12, scale: 2 }),
  thankYouStatus: text('thank_you_status').notNull().default('not_started'),
  receivedAt: timestamp('received_at', { withTimezone: true }),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
})

export const moodBoards = pgTable('mood_boards', {
  id: uuid('id').primaryKey().defaultRandom(),
  weddingId: uuid('wedding_id')
    .notNull()
    .references(() => weddings.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  description: text('description'),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const moodBoardItems = pgTable('mood_board_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  boardId: uuid('board_id')
    .notNull()
    .references(() => moodBoards.id, { onDelete: 'cascade' }),
  imageUrl: text('image_url').notNull(),
  r2Key: text('r2_key'),
  caption: text('caption'),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export type RegistryLinkRecord = typeof registryLinks.$inferSelect
export type NewRegistryLink = typeof registryLinks.$inferInsert
export type CashFundRecord = typeof cashFunds.$inferSelect
export type NewCashFund = typeof cashFunds.$inferInsert
export type CashFundContributionRecord = typeof cashFundContributions.$inferSelect
export type NewCashFundContribution = typeof cashFundContributions.$inferInsert
export type GiftRecord = typeof gifts.$inferSelect
export type NewGift = typeof gifts.$inferInsert
export type MoodBoardRecord = typeof moodBoards.$inferSelect
export type NewMoodBoard = typeof moodBoards.$inferInsert
export type MoodBoardItemRecord = typeof moodBoardItems.$inferSelect
export type NewMoodBoardItem = typeof moodBoardItems.$inferInsert
