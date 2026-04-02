import { index, integer, pgTable, text, timestamp, unique, uuid } from 'drizzle-orm/pg-core'

export const rateLimitBuckets = pgTable(
  'rate_limit_buckets',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    key: text('key').notNull(),
    windowStartedAt: timestamp('window_started_at', { withTimezone: true }).notNull(),
    hits: integer('hits').notNull().default(1),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    unique('rate_limit_bucket_unique').on(t.key, t.windowStartedAt),
    index('rate_limit_bucket_expires_at_idx').on(t.expiresAt),
  ],
)

export type RateLimitBucketRecord = typeof rateLimitBuckets.$inferSelect
export type NewRateLimitBucket = typeof rateLimitBuckets.$inferInsert
