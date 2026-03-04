import { boolean, integer, numeric, pgEnum, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'

export const weddingStyleEnum = pgEnum('wedding_style', [
  'classic',
  'modern',
  'rustic',
  'romantic',
  'minimalist',
  'bohemian',
  'garden',
  'beach',
  'elegant',
  'whimsical',
])

export const timelineTemplateEnum = pgEnum('timeline_template', [
  '6-month',
  '12-month',
  '18-month',
  'elopement',
])

export const pricingTierEnum = pgEnum('pricing_tier', ['free', 'full'])

export const weddings = pgTable('weddings', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  date: timestamp('date', { withTimezone: true }),
  venue: text('venue'),
  city: text('city'),
  state: text('state'),
  country: text('country').notNull().default('US'),
  guestCountEstimate: integer('guest_count_estimate'),
  budgetTotal: numeric('budget_total', { precision: 12, scale: 2 }),
  style: weddingStyleEnum('style'),
  timelineTemplate: timelineTemplateEnum('timeline_template').notNull().default('12-month'),
  websiteSlug: text('website_slug').unique(),
  websitePublished: boolean('website_published').notNull().default(false),
  tier: pricingTierEnum('tier').notNull().default('free'),
  onboardingCompleted: boolean('onboarding_completed').notNull().default(false),
  stripeCustomerId: text('stripe_customer_id'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
})

export type WeddingRecord = typeof weddings.$inferSelect
export type NewWedding = typeof weddings.$inferInsert
