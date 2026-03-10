import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import {
  createPlaylistSchema,
  updatePlaylistSchema,
  createPlaylistSongSchema,
  createSongRequestSchema,
  spotifyUrlSchema,
} from '@planfortwo/validators'
import { authMiddleware } from '../middleware/auth.js'
import { resolveUserMiddleware } from '../middleware/resolve-user.js'
import { resolveWeddingMiddleware } from '../middleware/resolve-wedding.js'
import { requireFeature } from '../middleware/require-feature.js'
import { playlistService } from '../services/playlists.js'
import { spotifyService } from '../services/spotify.js'

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

playlistsRoute.get(
  '/',
  resolveWeddingMiddleware,
  requireFeature('canMusicIntegration'),
  async (c) => {
    const weddingId = c.get('weddingId')
    const lists = await playlistService.listPlaylists(weddingId)
    return c.json({ data: lists })
  },
)

playlistsRoute.get(
  '/:id',
  resolveWeddingMiddleware,
  requireFeature('canMusicIntegration'),
  async (c) => {
    const id = c.req.param('id')
    const weddingId = c.get('weddingId')
    const playlist = await playlistService.getPlaylist(id, weddingId)
    if (!playlist) return c.json({ error: 'Not found', code: 'NOT_FOUND', statusCode: 404 }, 404)
    return c.json({ data: playlist })
  },
)

playlistsRoute.post(
  '/',
  resolveWeddingMiddleware,
  requireFeature('canMusicIntegration'),
  zValidator('json', createPlaylistSchema, (result, c) => {
    if (!result.success)
      return c.json({ error: 'Validation failed', code: 'VALIDATION_ERROR', statusCode: 400 }, 400)
  }),
  async (c) => {
    const data = c.req.valid('json')
    const weddingId = c.get('weddingId')
    const playlist = await playlistService.createPlaylist({ ...data, weddingId })
    return c.json({ data: playlist }, 201)
  },
)

playlistsRoute.put(
  '/:id',
  resolveWeddingMiddleware,
  requireFeature('canMusicIntegration'),
  zValidator('json', updatePlaylistSchema, (result, c) => {
    if (!result.success)
      return c.json({ error: 'Validation failed', code: 'VALIDATION_ERROR', statusCode: 400 }, 400)
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

playlistsRoute.delete(
  '/:id',
  resolveWeddingMiddleware,
  requireFeature('canMusicIntegration'),
  async (c) => {
    const id = c.req.param('id')
    const weddingId = c.get('weddingId')
    const deleted = await playlistService.deletePlaylist(id, weddingId)
    if (!deleted) return c.json({ error: 'Not found', code: 'NOT_FOUND', statusCode: 404 }, 404)
    return c.json({ data: { success: true } })
  },
)

playlistsRoute.post(
  '/:id/songs',
  resolveWeddingMiddleware,
  requireFeature('canMusicIntegration'),
  zValidator('json', createPlaylistSongSchema, (result, c) => {
    if (!result.success)
      return c.json({ error: 'Validation failed', code: 'VALIDATION_ERROR', statusCode: 400 }, 400)
  }),
  async (c) => {
    const playlistId = c.req.param('id')
    const weddingId = c.get('weddingId')
    const playlist = await playlistService.getPlaylist(playlistId, weddingId)
    if (!playlist)
      return c.json({ error: 'Playlist not found', code: 'NOT_FOUND', statusCode: 404 }, 404)
    const data = c.req.valid('json')
    const song = await playlistService.addSong({ ...data, playlistId })
    return c.json({ data: song }, 201)
  },
)

playlistsRoute.delete(
  '/songs/:songId',
  resolveWeddingMiddleware,
  requireFeature('canMusicIntegration'),
  async (c) => {
    const songId = c.req.param('songId')
    const weddingId = c.get('weddingId')
    const deleted = await playlistService.deleteSong(songId, weddingId)
    if (!deleted) return c.json({ error: 'Not found', code: 'NOT_FOUND', statusCode: 404 }, 404)
    return c.json({ data: { success: true } })
  },
)

// ── Spotify Import ──
playlistsRoute.post(
  '/:id/import-spotify',
  resolveWeddingMiddleware,
  requireFeature('canMusicIntegration'),
  zValidator('json', spotifyUrlSchema, (result, c) => {
    if (!result.success)
      return c.json({ error: 'Validation failed', code: 'VALIDATION_ERROR', statusCode: 400 }, 400)
  }),
  async (c) => {
    const playlistId = c.req.param('id')
    const weddingId = c.get('weddingId')

    // Verify playlist exists and belongs to wedding
    const playlist = await playlistService.getPlaylist(playlistId, weddingId)
    if (!playlist)
      return c.json({ error: 'Playlist not found', code: 'NOT_FOUND', statusCode: 404 }, 404)

    const { spotifyUrl } = c.req.valid('json')
    const parsed = spotifyService.parseSpotifyUrl(spotifyUrl)
    if (!parsed || parsed.type !== 'playlist') {
      return c.json(
        { error: 'Invalid Spotify playlist URL', code: 'VALIDATION_ERROR', statusCode: 400 },
        400,
      )
    }

    try {
      const tracks = await spotifyService.getPlaylistTracks(parsed.id)

      // Clear existing songs and re-import
      await playlistService.clearPlaylistSongs(playlistId, weddingId)
      const songs = await playlistService.bulkAddSongs(playlistId, tracks)

      // Store the Spotify URL on the playlist
      await playlistService.updatePlaylist(playlistId, weddingId, { spotifyUrl })

      return c.json({ data: { imported: songs.length, songs } })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to import from Spotify'
      return c.json({ error: message, code: 'SPOTIFY_ERROR', statusCode: 502 }, 502)
    }
  },
)

playlistsRoute.post(
  '/:id/add-spotify-track',
  resolveWeddingMiddleware,
  requireFeature('canMusicIntegration'),
  zValidator('json', spotifyUrlSchema, (result, c) => {
    if (!result.success)
      return c.json({ error: 'Validation failed', code: 'VALIDATION_ERROR', statusCode: 400 }, 400)
  }),
  async (c) => {
    const playlistId = c.req.param('id')
    const weddingId = c.get('weddingId')

    const playlist = await playlistService.getPlaylist(playlistId, weddingId)
    if (!playlist)
      return c.json({ error: 'Playlist not found', code: 'NOT_FOUND', statusCode: 404 }, 404)

    const { spotifyUrl } = c.req.valid('json')
    const parsed = spotifyService.parseSpotifyUrl(spotifyUrl)
    if (!parsed || parsed.type !== 'track') {
      return c.json(
        { error: 'Invalid Spotify track URL', code: 'VALIDATION_ERROR', statusCode: 400 },
        400,
      )
    }

    try {
      const trackData = await spotifyService.getTrack(parsed.id)
      const currentSongs = playlist.songs ?? []
      const song = await playlistService.addSong({
        playlistId,
        title: trackData.title,
        artist: trackData.artist,
        album: trackData.album,
        albumArt: trackData.albumArt,
        durationMs: trackData.durationMs,
        spotifyTrackId: trackData.spotifyTrackId,
        sortOrder: currentSongs.length,
      })
      return c.json({ data: song }, 201)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch track from Spotify'
      return c.json({ error: message, code: 'SPOTIFY_ERROR', statusCode: 502 }, 502)
    }
  },
)

playlistsRoute.post(
  '/:id/refresh-spotify',
  resolveWeddingMiddleware,
  requireFeature('canMusicIntegration'),
  async (c) => {
    const playlistId = c.req.param('id')
    const weddingId = c.get('weddingId')

    const playlist = await playlistService.getPlaylist(playlistId, weddingId)
    if (!playlist)
      return c.json({ error: 'Playlist not found', code: 'NOT_FOUND', statusCode: 404 }, 404)

    if (!playlist.spotifyUrl) {
      return c.json(
        {
          error: 'No Spotify URL linked to this playlist',
          code: 'VALIDATION_ERROR',
          statusCode: 400,
        },
        400,
      )
    }

    const parsed = spotifyService.parseSpotifyUrl(playlist.spotifyUrl)
    if (!parsed || parsed.type !== 'playlist') {
      return c.json(
        { error: 'Invalid stored Spotify URL', code: 'VALIDATION_ERROR', statusCode: 400 },
        400,
      )
    }

    try {
      const tracks = await spotifyService.getPlaylistTracks(parsed.id)
      await playlistService.clearPlaylistSongs(playlistId, weddingId)
      const songs = await playlistService.bulkAddSongs(playlistId, tracks)
      return c.json({ data: { imported: songs.length, songs } })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to refresh from Spotify'
      return c.json({ error: message, code: 'SPOTIFY_ERROR', statusCode: 502 }, 502)
    }
  },
)

// ── Song Requests ──
playlistsRoute.get(
  '/requests/all',
  resolveWeddingMiddleware,
  requireFeature('canMusicIntegration'),
  async (c) => {
    const weddingId = c.get('weddingId')
    const requests = await playlistService.listSongRequests(weddingId)
    return c.json({ data: requests })
  },
)

playlistsRoute.post(
  '/requests',
  resolveWeddingMiddleware,
  requireFeature('canMusicIntegration'),
  zValidator('json', createSongRequestSchema, (result, c) => {
    if (!result.success)
      return c.json({ error: 'Validation failed', code: 'VALIDATION_ERROR', statusCode: 400 }, 400)
  }),
  async (c) => {
    const data = c.req.valid('json')
    const weddingId = c.get('weddingId')
    const request = await playlistService.createSongRequest({ ...data, weddingId })
    return c.json({ data: request }, 201)
  },
)

playlistsRoute.put(
  '/requests/:id/approve',
  resolveWeddingMiddleware,
  requireFeature('canMusicIntegration'),
  async (c) => {
    const id = c.req.param('id')
    const weddingId = c.get('weddingId')
    const approved = await playlistService.approveSongRequest(id, weddingId)
    if (!approved) return c.json({ error: 'Not found', code: 'NOT_FOUND', statusCode: 404 }, 404)
    return c.json({ data: approved })
  },
)

playlistsRoute.delete(
  '/requests/:id',
  resolveWeddingMiddleware,
  requireFeature('canMusicIntegration'),
  async (c) => {
    const id = c.req.param('id')
    const weddingId = c.get('weddingId')
    const deleted = await playlistService.deleteSongRequest(id, weddingId)
    if (!deleted) return c.json({ error: 'Not found', code: 'NOT_FOUND', statusCode: 404 }, 404)
    return c.json({ data: { success: true } })
  },
)
