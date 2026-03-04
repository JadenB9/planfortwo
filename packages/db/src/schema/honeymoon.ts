import { integer, jsonb, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { weddings } from './weddings'

export const honeymoonPlans = pgTable('honeymoon_plans', {
  id: uuid('id').primaryKey().defaultRandom(),
  weddingId: uuid('wedding_id')
    .notNull()
    .references(() => weddings.id, { onDelete: 'cascade' }),
  destination: text('destination').notNull(),
  startDate: timestamp('start_date', { withTimezone: true }),
  endDate: timestamp('end_date', { withTimezone: true }),
  budget: integer('budget'),
  notes: text('notes'),
  documents: jsonb('documents').$type<Record<string, unknown>[]>().default([]),
  packingList: jsonb('packing_list').$type<string[]>().default([]),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
})

export const honeymoonActivities = pgTable('honeymoon_activities', {
  id: uuid('id').primaryKey().defaultRandom(),
  planId: uuid('plan_id')
    .notNull()
    .references(() => honeymoonPlans.id, { onDelete: 'cascade' }),
  dayNumber: integer('day_number').notNull(),
  title: text('title').notNull(),
  description: text('description'),
  location: text('location'),
  startTime: text('start_time'),
  endTime: text('end_time'),
  cost: integer('cost'),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})
