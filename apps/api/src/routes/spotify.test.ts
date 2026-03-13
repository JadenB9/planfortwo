import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Hono } from 'hono'

vi.mock('@clerk/backend', () => ({
  verifyToken: vi.fn().mockResolvedValue({ sub: 'clerk_user_123' }),
}))

vi.mock('../services/users.js', () => ({
  userService: {
    findByClerkId: vi.fn().mockResolvedValue({
      id: 'db-user-id',
      email: 'test@example.com',
      firstName: 'Jane',
      lastName: 'Doe',
    }),
    findById: vi.fn().mockResolvedValue({
      id: 'db-user-id',
      email: 'test@example.com',
      firstName: 'Jane',
      lastName: 'Doe',
    }),
  },
}))

vi.mock('../services/weddings.js', () => ({
  weddingService: {
    verifyMembership: vi.fn().mockResolvedValue({
      id: 'member-1',
      weddingId: 'a0000000-0000-0000-0000-000000000001',
      userId: 'db-user-id',
      role: 'owner',
      joinedAt: new Date(),
    }),
    findByUserId: vi.fn(),
  },
}))

vi.mock('../services/spotify.js', () => ({
  spotifyService: {
    getAuthUrl: vi.fn(),
    exchangeCode: vi.fn(),
    saveConnection: vi.fn(),
    getConnection: vi.fn(),
    deleteConnection: vi.fn(),
    getUserPlaylists: vi.fn(),
    addTracksToSpotifyPlaylist: vi.fn(),
  },
}))

vi.mock('../services/features.js', () => ({
  featureService: {
    getFeatures: vi.fn().mockResolvedValue({
      tier: 'full',
      canAddTasks: true,
      canEditChecklist: true,
      canDeleteTasks: true,
      canReorderTasks: true,
      canCustomizeCategories: true,
      canAddNotes: true,
      canAddAttachments: true,
      maxGuests: null,
      canEditGuests: true,
      canDeleteGuests: true,
      canBulkImport: true,
      canRsvp: true,
      canSeatingChart: true,
      canVendorManagement: true,
      canCustomDomain: true,
      canDataExport: true,
      canBudgetCategories: true,
      canBudgetExpenses: true,
      canBudgetAnalytics: true,
      canBudgetExport: true,
      canPaymentSchedule: true,
      canWebsiteBuilder: true,
      canWebsiteAnalytics: true,
      canWebsiteCustomSections: true,
      canInbox: true,
      canMusicIntegration: true,
      canPhotoGallery: true,
    }),
  },
}))

import { spotifyRoute } from './spotify.js'
import { spotifyService } from '../services/spotify.js'

const mockedService = vi.mocked(spotifyService)

function createApp() {
  const app = new Hono()
  app.route('/spotify', spotifyRoute)
  return app
}

function authHeaders(): Record<string, string> {
  return { Authorization: 'Bearer test-valid-token', 'Content-Type': 'application/json' }
}

describe('Spotify Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv('CLERK_SECRET_KEY', 'sk_test_fake')
  })

  describe('GET /spotify/auth-url', () => {
    it('should return Spotify authorization URL', async () => {
      const mockUrl = 'https://accounts.spotify.com/authorize?response_type=code&client_id=abc'
      mockedService.getAuthUrl.mockReturnValue(mockUrl)

      const app = createApp()
      const res = await app.request('/spotify/auth-url', {
        method: 'GET',
        headers: authHeaders(),
      })
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.data.url).toBe(mockUrl)
    })

    it('should return 500 if Spotify is not configured', async () => {
      mockedService.getAuthUrl.mockImplementation(() => {
        throw new Error('Spotify OAuth not configured')
      })

      const app = createApp()
      const res = await app.request('/spotify/auth-url', {
        method: 'GET',
        headers: authHeaders(),
      })
      expect(res.status).toBe(500)
      const body = await res.json()
      expect(body.code).toBe('SPOTIFY_ERROR')
    })

    it('should require authentication', async () => {
      const app = createApp()
      const res = await app.request('/spotify/auth-url', {
        method: 'GET',
      })
      expect(res.status).toBe(401)
    })
  })

  describe('POST /spotify/exchange', () => {
    it('should exchange code for tokens and save connection', async () => {
      const tokenData = {
        accessToken: 'access-token-123',
        refreshToken: 'refresh-token-456',
        expiresIn: 3600,
        spotifyUserId: 'spotify-user-1',
        spotifyDisplayName: 'Test User',
      }
      mockedService.exchangeCode.mockResolvedValue(tokenData as never)
      mockedService.saveConnection.mockResolvedValue(undefined as never)

      const app = createApp()
      const res = await app.request('/spotify/exchange', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ code: 'auth-code-abc' }),
      })
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.data.connected).toBe(true)
      expect(body.data.spotifyDisplayName).toBe('Test User')
      expect(mockedService.exchangeCode).toHaveBeenCalledWith('auth-code-abc')
      expect(mockedService.saveConnection).toHaveBeenCalledWith('db-user-id', tokenData)
    })

    it('should return 502 if exchange fails', async () => {
      mockedService.exchangeCode.mockRejectedValue(
        new Error('Spotify authentication failed') as never,
      )

      const app = createApp()
      const res = await app.request('/spotify/exchange', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ code: 'bad-code' }),
      })
      expect(res.status).toBe(502)
      const body = await res.json()
      expect(body.code).toBe('SPOTIFY_ERROR')
    })

    it('should reject empty code', async () => {
      const app = createApp()
      const res = await app.request('/spotify/exchange', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ code: '' }),
      })
      expect(res.status).toBe(400)
    })

    it('should reject missing code', async () => {
      const app = createApp()
      const res = await app.request('/spotify/exchange', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({}),
      })
      expect(res.status).toBe(400)
    })
  })

  describe('GET /spotify/status', () => {
    it('should return connected status when connected', async () => {
      mockedService.getConnection.mockResolvedValue({
        id: 'c0000000-0000-0000-0000-000000000001',
        spotifyUserId: 'spotify-user-1',
        spotifyDisplayName: 'Test User',
      } as never)

      const app = createApp()
      const res = await app.request('/spotify/status', {
        method: 'GET',
        headers: authHeaders(),
      })
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.data.connected).toBe(true)
      expect(body.data.spotifyDisplayName).toBe('Test User')
    })

    it('should return disconnected status when not connected', async () => {
      mockedService.getConnection.mockResolvedValue(null as never)

      const app = createApp()
      const res = await app.request('/spotify/status', {
        method: 'GET',
        headers: authHeaders(),
      })
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.data.connected).toBe(false)
      expect(body.data.spotifyDisplayName).toBeNull()
    })
  })

  describe('DELETE /spotify/disconnect', () => {
    it('should disconnect Spotify', async () => {
      mockedService.deleteConnection.mockResolvedValue(undefined as never)

      const app = createApp()
      const res = await app.request('/spotify/disconnect', {
        method: 'DELETE',
        headers: authHeaders(),
      })
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.data.success).toBe(true)
      expect(mockedService.deleteConnection).toHaveBeenCalledWith('db-user-id')
    })
  })

  describe('GET /spotify/user-playlists', () => {
    it('should return user playlists', async () => {
      const mockPlaylists = [
        {
          id: 'playlist-1',
          name: 'Wedding Songs',
          description: 'Our special songs',
          trackCount: 25,
          imageUrl: 'https://i.scdn.co/image/abc',
          externalUrl: 'https://open.spotify.com/playlist/playlist-1',
        },
      ]
      mockedService.getUserPlaylists.mockResolvedValue(mockPlaylists as never)

      const app = createApp()
      const res = await app.request('/spotify/user-playlists', {
        method: 'GET',
        headers: authHeaders(),
      })
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.data).toHaveLength(1)
      expect(body.data[0].name).toBe('Wedding Songs')
    })

    it('should return 401 if Spotify not connected', async () => {
      mockedService.getUserPlaylists.mockRejectedValue(new Error('Spotify not connected') as never)

      const app = createApp()
      const res = await app.request('/spotify/user-playlists', {
        method: 'GET',
        headers: authHeaders(),
      })
      expect(res.status).toBe(401)
      const body = await res.json()
      expect(body.code).toBe('NOT_CONNECTED')
    })

    it('should return 502 for other Spotify errors', async () => {
      mockedService.getUserPlaylists.mockRejectedValue(
        new Error('Failed to fetch playlists') as never,
      )

      const app = createApp()
      const res = await app.request('/spotify/user-playlists', {
        method: 'GET',
        headers: authHeaders(),
      })
      expect(res.status).toBe(502)
      const body = await res.json()
      expect(body.code).toBe('SPOTIFY_ERROR')
    })
  })

  describe('POST /spotify/add-to-playlist', () => {
    it('should add tracks to a Spotify playlist', async () => {
      mockedService.addTracksToSpotifyPlaylist.mockResolvedValue({ added: 3 } as never)

      const app = createApp()
      const res = await app.request('/spotify/add-to-playlist', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          spotifyPlaylistId: 'playlist-1',
          trackIds: ['track-1', 'track-2', 'track-3'],
        }),
      })
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.data.added).toBe(3)
      expect(mockedService.addTracksToSpotifyPlaylist).toHaveBeenCalledWith(
        'db-user-id',
        'playlist-1',
        ['track-1', 'track-2', 'track-3'],
      )
    })

    it('should return 401 if Spotify not connected', async () => {
      mockedService.addTracksToSpotifyPlaylist.mockRejectedValue(
        new Error('Spotify not connected') as never,
      )

      const app = createApp()
      const res = await app.request('/spotify/add-to-playlist', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          spotifyPlaylistId: 'playlist-1',
          trackIds: ['track-1'],
        }),
      })
      expect(res.status).toBe(401)
      const body = await res.json()
      expect(body.code).toBe('NOT_CONNECTED')
    })

    it('should return 502 for other Spotify errors', async () => {
      mockedService.addTracksToSpotifyPlaylist.mockRejectedValue(
        new Error('Spotify API error') as never,
      )

      const app = createApp()
      const res = await app.request('/spotify/add-to-playlist', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          spotifyPlaylistId: 'playlist-1',
          trackIds: ['track-1'],
        }),
      })
      expect(res.status).toBe(502)
      const body = await res.json()
      expect(body.code).toBe('SPOTIFY_ERROR')
    })

    it('should reject empty trackIds array', async () => {
      const app = createApp()
      const res = await app.request('/spotify/add-to-playlist', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          spotifyPlaylistId: 'playlist-1',
          trackIds: [],
        }),
      })
      expect(res.status).toBe(400)
    })

    it('should reject missing spotifyPlaylistId', async () => {
      const app = createApp()
      const res = await app.request('/spotify/add-to-playlist', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          trackIds: ['track-1'],
        }),
      })
      expect(res.status).toBe(400)
    })

    it('should reject empty spotifyPlaylistId', async () => {
      const app = createApp()
      const res = await app.request('/spotify/add-to-playlist', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          spotifyPlaylistId: '',
          trackIds: ['track-1'],
        }),
      })
      expect(res.status).toBe(400)
    })
  })
})
