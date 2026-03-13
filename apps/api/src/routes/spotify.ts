import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { authMiddleware } from '../middleware/auth.js'
import { resolveUserMiddleware } from '../middleware/resolve-user.js'
import { spotifyService } from '../services/spotify.js'

type Env = {
  Variables: {
    clerkUserId: string
    dbUserId: string
    dbUser: { id: string; email: string; firstName: string; lastName: string }
  }
}

export const spotifyRoute = new Hono<Env>()

spotifyRoute.use('*', authMiddleware, resolveUserMiddleware)

// Get Spotify authorization URL
spotifyRoute.get('/auth-url', async (c) => {
  try {
    const url = spotifyService.getAuthUrl()
    return c.json({ data: { url } })
  } catch (err) {
    console.error('Spotify auth URL error:', err)
    return c.json(
      { error: 'Failed to generate Spotify auth URL', code: 'SPOTIFY_ERROR', statusCode: 500 },
      500,
    )
  }
})

// Exchange authorization code for tokens
spotifyRoute.post(
  '/exchange',
  zValidator('json', z.object({ code: z.string().min(1) }), (result, c) => {
    if (!result.success)
      return c.json({ error: 'Validation failed', code: 'VALIDATION_ERROR', statusCode: 400 }, 400)
  }),
  async (c) => {
    const userId = c.get('dbUserId')
    const { code } = c.req.valid('json')

    try {
      const tokenData = await spotifyService.exchangeCode(code)
      await spotifyService.saveConnection(userId, tokenData)
      return c.json({
        data: {
          connected: true,
          spotifyDisplayName: tokenData.spotifyDisplayName,
        },
      })
    } catch (err) {
      console.error('Spotify exchange error:', err)
      return c.json(
        { error: 'Spotify authentication failed', code: 'SPOTIFY_ERROR', statusCode: 502 },
        502,
      )
    }
  },
)

// Check Spotify connection status
spotifyRoute.get('/status', async (c) => {
  const userId = c.get('dbUserId')
  const conn = await spotifyService.getConnection(userId)
  return c.json({
    data: {
      connected: !!conn,
      spotifyDisplayName: conn?.spotifyDisplayName ?? null,
    },
  })
})

// Disconnect Spotify
spotifyRoute.delete('/disconnect', async (c) => {
  const userId = c.get('dbUserId')
  await spotifyService.deleteConnection(userId)
  return c.json({ data: { success: true } })
})

// List user's Spotify playlists
spotifyRoute.get('/user-playlists', async (c) => {
  const userId = c.get('dbUserId')

  try {
    const playlists = await spotifyService.getUserPlaylists(userId)
    return c.json({ data: playlists })
  } catch (err) {
    const message = err instanceof Error ? err.message : ''
    if (message === 'Spotify not connected') {
      return c.json({ error: 'Spotify not connected', code: 'NOT_CONNECTED', statusCode: 401 }, 401)
    }
    console.error('Spotify playlists error:', err)
    return c.json(
      { error: 'Failed to fetch Spotify playlists', code: 'SPOTIFY_ERROR', statusCode: 502 },
      502,
    )
  }
})

// Add tracks to a Spotify playlist
spotifyRoute.post(
  '/add-to-playlist',
  zValidator(
    'json',
    z.object({
      spotifyPlaylistId: z.string().min(1),
      trackIds: z.array(z.string().min(1)).min(1).max(100),
    }),
    (result, c) => {
      if (!result.success)
        return c.json(
          { error: 'Validation failed', code: 'VALIDATION_ERROR', statusCode: 400 },
          400,
        )
    },
  ),
  async (c) => {
    const userId = c.get('dbUserId')
    const { spotifyPlaylistId, trackIds } = c.req.valid('json')

    try {
      const result = await spotifyService.addTracksToSpotifyPlaylist(
        userId,
        spotifyPlaylistId,
        trackIds,
      )
      return c.json({ data: result })
    } catch (err) {
      const message = err instanceof Error ? err.message : ''
      if (message === 'Spotify not connected') {
        return c.json(
          { error: 'Spotify not connected', code: 'NOT_CONNECTED', statusCode: 401 },
          401,
        )
      }
      console.error('Spotify add tracks error:', err)
      return c.json(
        {
          error: 'Failed to add tracks to Spotify playlist',
          code: 'SPOTIFY_ERROR',
          statusCode: 502,
        },
        502,
      )
    }
  },
)
