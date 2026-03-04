import { boolean, integer, pgEnum, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { weddings } from './weddings'

export const songCategoryEnum = pgEnum('song_category', [
  'first_dance', 'parent_dance', 'cake_cutting', 'bouquet_toss',
  'last_dance', 'ceremony', 'cocktail_hour', 'reception', 'other',
])

export const songStatusEnum = pgEnum('song_status', [
  'approved', 'pending', 'rejected',
])

export const playlists = pgTable('playlists', {
  id: uuid('id').primaryKey().defaultRandom(),
  weddingId: uuid('wedding_id')
    .notNull()
    .references(() => weddings.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  description: text('description'),
  spotifyUrl: text('spotify_url'),
  appleMusicUrl: text('apple_music_url'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
})

export const playlistSongs = pgTable('playlist_songs', {
  id: uuid('id').primaryKey().defaultRandom(),
  playlistId: uuid('playlist_id')
    .notNull()
    .references(() => playlists.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  artist: text('artist').notNull(),
  category: songCategoryEnum('category').default('other'),
  status: songStatusEnum('status').notNull().default('approved'),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const songRequests = pgTable('song_requests', {
  id: uuid('id').primaryKey().defaultRandom(),
  weddingId: uuid('wedding_id')
    .notNull()
    .references(() => weddings.id, { onDelete: 'cascade' }),
  guestName: text('guest_name').notNull(),
  title: text('title').notNull(),
  artist: text('artist').notNull(),
  notes: text('notes'),
  isApproved: boolean('is_approved').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})
