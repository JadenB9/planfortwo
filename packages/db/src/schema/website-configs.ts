import { boolean, jsonb, pgEnum, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { weddings } from './weddings'

export const privacyModeEnum = pgEnum('privacy_mode', ['public', 'password', 'unlisted'])

export const websiteConfigs = pgTable('website_configs', {
  id: uuid('id').primaryKey().defaultRandom(),
  weddingId: uuid('wedding_id')
    .notNull()
    .unique()
    .references(() => weddings.id, { onDelete: 'cascade' }),
  templateId: text('template_id').notNull().default('classic'),
  customColors: jsonb('custom_colors').$type<{
    primary: string
    secondary: string
    accent: string
    background: string
    sectionBackground?: string
  }>(),
  savedPalettes: jsonb('saved_palettes').$type<
    {
      id: string
      name: string
      colors: {
        primary: string
        secondary: string
        accent: string
        background: string
        sectionBackground?: string
      }
      fontPair: string
    }[]
  >(),
  fontPair: text('font_pair').notNull().default('playfair-lato'),
  privacyMode: privacyModeEnum('privacy_mode').notNull().default('public'),
  passwordHash: text('password_hash'),
  subdomain: text('subdomain').unique(),
  accessToken: text('access_token').unique(),
  customDomain: text('custom_domain').unique(),
  domainVerified: boolean('domain_verified').notNull().default(false),
  metaTitle: text('meta_title'),
  metaDescription: text('meta_description'),
  ogImageUrl: text('og_image_url'),
  hashtag: text('hashtag'),
  publishedAt: timestamp('published_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
})

export type WebsiteConfigRecord = typeof websiteConfigs.$inferSelect
export type NewWebsiteConfig = typeof websiteConfigs.$inferInsert
