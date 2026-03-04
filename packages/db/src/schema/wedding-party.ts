import { boolean, integer, jsonb, pgEnum, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { weddings } from './weddings'

export const partyRoleEnum = pgEnum('party_role', [
  'maid_of_honor', 'best_man', 'bridesmaid', 'groomsman',
  'flower_girl', 'ring_bearer', 'usher', 'reader',
  'officiant', 'musician', 'mc', 'custom',
])

export const partySideEnum = pgEnum('party_side', ['bride', 'groom'])

export const weddingParty = pgTable('wedding_party', {
  id: uuid('id').primaryKey().defaultRandom(),
  weddingId: uuid('wedding_id')
    .notNull()
    .references(() => weddings.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  role: partyRoleEnum('role').notNull(),
  customRole: text('custom_role'),
  side: partySideEnum('side').notNull(),
  email: text('email'),
  phone: text('phone'),
  photoUrl: text('photo_url'),
  description: text('description'),
  outfitDetails: jsonb('outfit_details').$type<Record<string, unknown>>(),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
})

export const partyTasks = pgTable('party_tasks', {
  id: uuid('id').primaryKey().defaultRandom(),
  memberId: uuid('member_id')
    .notNull()
    .references(() => weddingParty.id, { onDelete: 'cascade' }),
  weddingId: uuid('wedding_id')
    .notNull()
    .references(() => weddings.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  description: text('description'),
  dueDate: timestamp('due_date', { withTimezone: true }),
  isCompleted: boolean('is_completed').notNull().default(false),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const partyGifts = pgTable('party_gifts', {
  id: uuid('id').primaryKey().defaultRandom(),
  memberId: uuid('member_id')
    .notNull()
    .references(() => weddingParty.id, { onDelete: 'cascade' }),
  weddingId: uuid('wedding_id')
    .notNull()
    .references(() => weddings.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  description: text('description'),
  budget: integer('budget'),
  isPurchased: boolean('is_purchased').notNull().default(false),
  purchasedAt: timestamp('purchased_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export type WeddingPartyRecord = typeof weddingParty.$inferSelect
export type NewWeddingPartyMember = typeof weddingParty.$inferInsert
export type PartyTaskRecord = typeof partyTasks.$inferSelect
export type NewPartyTask = typeof partyTasks.$inferInsert
export type PartyGiftRecord = typeof partyGifts.$inferSelect
export type NewPartyGift = typeof partyGifts.$inferInsert
