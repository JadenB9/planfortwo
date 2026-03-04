import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import {
  createPlaylistSchema,
  updatePlaylistSchema,
  createPlaylistSongSchema,
  createSongRequestSchema,
} from '@planfortwo/validators'
import { authMiddleware } from '../middleware/auth.js'
import { resolveUserMiddleware } from '../middleware/resolve-user.js'
import { resolveWeddingMiddleware } from '../middleware/resolve-wedding.js'
import { playlistService } from '../services/playlists.js'

type Env = {
  Variables: {
    clerkUserId: string
    dbUserId: string
    dbUser: { id: string; email: string; firstName: string; lastName: string }
    weddingId: string
    membershipRole: string
  }
}

export const playlistsRoute = new Hono<Env>()

playlistsRoute.use('*', authMiddleware, resolveUserMiddleware)

playlistsRoute.get('/', resolveWeddingMiddleware, async (c) => {
  const weddingId = c.get('weddingId')
  const lists = await playlistService.listPlaylists(weddingId)
  return c.json({ data: lists })
})

playlistsRoute.get('/:id', resolveWeddingMiddleware, async (c) => {
  const id = c.req.param('id')
  const weddingId = c.get('weddingId')
  const playlist = await playlistService.getPlaylist(id, weddingId)
  if (!playlist) return c.json({ error: 'Not found', code: 'NOT_FOUND', statusCode: 404 }, 404)
  return c.json({ data: playlist })
})

playlistsRoute.post(
  '/',
  resolveWeddingMiddleware,
  zValidator('json', createPlaylistSchema, (result, c) => {
    if (!result.success) return c.json({ error: 'Validation failed', code: 'VALIDATION_ERROR', statusCode: 400 }, 400)
  }),
  async (c) => {
    const data = c.req.valid('json')
    const playlist = await playlistService.createPlaylist(data)
    return c.json({ data: playlist }, 201)
  },
)

playlistsRoute.put(
  '/:id',
  resolveWeddingMiddleware,
  zValidator('json', updatePlaylistSchema, (result, c) => {
    if (!result.success) return c.json({ error: 'Validation failed', code: 'VALIDATION_ERROR', statusCode: 400 }, 400)
  }),
  async (c) => {
    const id = c.req.param('id')
    const weddingId = c.get('weddingId')
    const data = c.req.valid('json')
    const updated = await playlistService.updatePlaylist(id, weddingId, data)
    if (!updated) return c.json({ error: 'Not found', code: 'NOT_FOUND', statusCode: 404 }, 404)
    return c.json({ data: updated })
  },
)

playlistsRoute.delete('/:id', resolveWeddingMiddleware, async (c) => {
  const id = c.req.param('id')
  const weddingId = c.get('weddingId')
  const deleted = await playlistService.deletePlaylist(id, weddingId)
  if (!deleted) return c.json({ error: 'Not found', code: 'NOT_FOUND', statusCode: 404 }, 404)
  return c.json({ data: { success: true } })
})

playlistsRoute.post(
  '/:id/songs',
  resolveWeddingMiddleware,
  zValidator('json', createPlaylistSongSchema, (result, c) => {
    if (!result.success) return c.json({ error: 'Validation failed', code: 'VALIDATION_ERROR', statusCode: 400 }, 400)
  }),
  async (c) => {
    const data = c.req.valid('json')
    const song = await playlistService.addSong(data)
    return c.json({ data: song }, 201)
  },
)

playlistsRoute.delete('/songs/:songId', resolveWeddingMiddleware, async (c) => {
  const songId = c.req.param('songId')
  const deleted = await playlistService.deleteSong(songId)
  if (!deleted) return c.json({ error: 'Not found', code: 'NOT_FOUND', statusCode: 404 }, 404)
  return c.json({ data: { success: true } })
})

// ── Song Requests ──
playlistsRoute.get('/requests/all', resolveWeddingMiddleware, async (c) => {
  const weddingId = c.get('weddingId')
  const requests = await playlistService.listSongRequests(weddingId)
  return c.json({ data: requests })
})

playlistsRoute.post(
  '/requests',
  resolveWeddingMiddleware,
  zValidator('json', createSongRequestSchema, (result, c) => {
    if (!result.success) return c.json({ error: 'Validation failed', code: 'VALIDATION_ERROR', statusCode: 400 }, 400)
  }),
  async (c) => {
    const data = c.req.valid('json')
    const request = await playlistService.createSongRequest(data)
    return c.json({ data: request }, 201)
  },
)

playlistsRoute.put('/requests/:id/approve', resolveWeddingMiddleware, async (c) => {
  const id = c.req.param('id')
  const approved = await playlistService.approveSongRequest(id)
  if (!approved) return c.json({ error: 'Not found', code: 'NOT_FOUND', statusCode: 404 }, 404)
  return c.json({ data: approved })
})

playlistsRoute.delete('/requests/:id', resolveWeddingMiddleware, async (c) => {
  const id = c.req.param('id')
  const deleted = await playlistService.deleteSongRequest(id)
  if (!deleted) return c.json({ error: 'Not found', code: 'NOT_FOUND', statusCode: 404 }, 404)
  return c.json({ data: { success: true } })
})
