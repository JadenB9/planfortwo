import { z } from 'zod'

export const songCategoryZodEnum = z.enum([
  'first_dance', 'parent_dance', 'cake_cutting', 'bouquet_toss',
  'last_dance', 'ceremony', 'cocktail_hour', 'reception', 'other',
])

export const songStatusZodEnum = z.enum([
  'approved', 'pending', 'rejected',
])

export const createPlaylistSchema = z.object({
  weddingId: z.string().uuid(),
  name: z.string().min(1).max(200),
  description: z.string().max(2000).nullable().optional(),
  spotifyUrl: z.string().url().nullable().optional(),
  appleMusicUrl: z.string().url().nullable().optional(),
})

export type CreatePlaylistInput = z.infer<typeof createPlaylistSchema>

export const updatePlaylistSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).nullable().optional(),
  spotifyUrl: z.string().url().nullable().optional(),
  appleMusicUrl: z.string().url().nullable().optional(),
})

export type UpdatePlaylistInput = z.infer<typeof updatePlaylistSchema>

export const createPlaylistSongSchema = z.object({
  playlistId: z.string().uuid(),
  title: z.string().min(1).max(300),
  artist: z.string().min(1).max(300),
  category: songCategoryZodEnum.optional(),
  sortOrder: z.number().int().min(0).optional(),
})

export type CreatePlaylistSongInput = z.infer<typeof createPlaylistSongSchema>

export const createSongRequestSchema = z.object({
  weddingId: z.string().uuid(),
  guestName: z.string().min(1).max(200),
  title: z.string().min(1).max(300),
  artist: z.string().min(1).max(300),
  notes: z.string().max(500).nullable().optional(),
})

export type CreateSongRequestInput = z.infer<typeof createSongRequestSchema>
