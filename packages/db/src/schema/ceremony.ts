import { boolean, integer, pgEnum, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { weddings } from './weddings'

export const ceremonyMomentEnum = pgEnum('ceremony_moment', [
  'prelude', 'processional', 'welcome', 'reading', 'vows',
  'ring_exchange', 'unity_ceremony', 'pronouncement', 'recessional', 'other',
])

export const ceremonyOutlines = pgTable('ceremony_outlines', {
  id: uuid('id').primaryKey().defaultRandom(),
  weddingId: uuid('wedding_id')
    .notNull()
    .references(() => weddings.id, { onDelete: 'cascade' }),
  moment: ceremonyMomentEnum('moment').notNull(),
  title: text('title').notNull(),
  description: text('description'),
  duration: integer('duration'),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
})

export const vowWorkspaces = pgTable('vow_workspaces', {
  id: uuid('id').primaryKey().defaultRandom(),
  weddingId: uuid('wedding_id')
    .notNull()
    .references(() => weddings.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull(),
  content: text('content').notNull().default(''),
  isRevealed: boolean('is_revealed').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
})

export const processionalEntries = pgTable('processional_entries', {
  id: uuid('id').primaryKey().defaultRandom(),
  weddingId: uuid('wedding_id')
    .notNull()
    .references(() => weddings.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  role: text('role'),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})
