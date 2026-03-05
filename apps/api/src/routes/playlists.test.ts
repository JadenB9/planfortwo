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

vi.mock('../services/playlists.js', () => ({
  playlistService: {
    listPlaylists: vi.fn(),
    getPlaylist: vi.fn(),
    createPlaylist: vi.fn(),
    updatePlaylist: vi.fn(),
    deletePlaylist: vi.fn(),
    addSong: vi.fn(),
    deleteSong: vi.fn(),
    listSongRequests: vi.fn(),
    createSongRequest: vi.fn(),
    approveSongRequest: vi.fn(),
    deleteSongRequest: vi.fn(),
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
    }),
  },
}))

import { playlistsRoute } from './playlists.js'
import { playlistService } from '../services/playlists.js'

const mockedService = vi.mocked(playlistService)

const WEDDING_ID = 'a0000000-0000-0000-0000-000000000001'
const PLAYLIST_ID = 'b0000000-0000-0000-0000-000000000002'
const SONG_ID = 'c0000000-0000-0000-0000-000000000001'

function createApp() {
  const app = new Hono()
  app.route('/playlists', playlistsRoute)
  return app
}

function authHeaders(): Record<string, string> {
  return { Authorization: 'Bearer test-valid-token', 'Content-Type': 'application/json' }
}

describe('Playlist Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv('CLERK_SECRET_KEY', 'sk_test_fake')
  })

  describe('GET /playlists', () => {
    it('should list playlists', async () => {
      mockedService.listPlaylists.mockResolvedValue([
        {
          id: PLAYLIST_ID,
          weddingId: WEDDING_ID,
          name: 'Reception',
          description: null,
          spotifyUrl: null,
          appleMusicUrl: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ] as never)

      const app = createApp()
      const res = await app.request(`/playlists?weddingId=${WEDDING_ID}`, {
        method: 'GET',
        headers: authHeaders(),
      })
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.data).toHaveLength(1)
      expect(body.data[0].name).toBe('Reception')
    })
  })

  describe('POST /playlists', () => {
    it('should create a playlist', async () => {
      mockedService.createPlaylist.mockResolvedValue({
        id: PLAYLIST_ID,
        weddingId: WEDDING_ID,
        name: 'Cocktail Hour',
        description: null,
        spotifyUrl: null,
        appleMusicUrl: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as never)

      const app = createApp()
      const res = await app.request(`/playlists?weddingId=${WEDDING_ID}`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ weddingId: WEDDING_ID, name: 'Cocktail Hour' }),
      })
      expect(res.status).toBe(201)
      const body = await res.json()
      expect(body.data.name).toBe('Cocktail Hour')
    })
  })

  describe('GET /playlists/:id', () => {
    it('should get playlist with songs', async () => {
      mockedService.getPlaylist.mockResolvedValue({
        id: PLAYLIST_ID,
        weddingId: WEDDING_ID,
        name: 'Reception',
        description: null,
        spotifyUrl: null,
        appleMusicUrl: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        songs: [
          {
            id: SONG_ID,
            playlistId: PLAYLIST_ID,
            title: 'At Last',
            artist: 'Etta James',
            category: 'first_dance',
            status: 'approved',
            sortOrder: 0,
            createdAt: new Date(),
          },
        ],
      } as never)

      const app = createApp()
      const res = await app.request(`/playlists/${PLAYLIST_ID}?weddingId=${WEDDING_ID}`, {
        method: 'GET',
        headers: authHeaders(),
      })
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.data.songs).toHaveLength(1)
    })

    it('should return 404 if not found', async () => {
      mockedService.getPlaylist.mockResolvedValue(null)
      const app = createApp()
      const res = await app.request(`/playlists/${PLAYLIST_ID}?weddingId=${WEDDING_ID}`, {
        method: 'GET',
        headers: authHeaders(),
      })
      expect(res.status).toBe(404)
    })
  })

  describe('PUT /playlists/:id', () => {
    it('should update a playlist', async () => {
      mockedService.updatePlaylist.mockResolvedValue({
        id: PLAYLIST_ID,
        weddingId: WEDDING_ID,
        name: 'Updated',
        description: null,
        spotifyUrl: null,
        appleMusicUrl: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as never)

      const app = createApp()
      const res = await app.request(`/playlists/${PLAYLIST_ID}?weddingId=${WEDDING_ID}`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({ name: 'Updated' }),
      })
      expect(res.status).toBe(200)
    })
  })

  describe('DELETE /playlists/:id', () => {
    it('should delete a playlist', async () => {
      mockedService.deletePlaylist.mockResolvedValue({ id: PLAYLIST_ID } as never)
      const app = createApp()
      const res = await app.request(`/playlists/${PLAYLIST_ID}?weddingId=${WEDDING_ID}`, {
        method: 'DELETE',
        headers: authHeaders(),
      })
      expect(res.status).toBe(200)
    })
  })

  describe('POST /playlists/:id/songs', () => {
    it('should add a song to playlist', async () => {
      mockedService.addSong.mockResolvedValue({
        id: SONG_ID,
        playlistId: PLAYLIST_ID,
        title: 'Perfect',
        artist: 'Ed Sheeran',
        category: 'first_dance',
        status: 'approved',
        sortOrder: 0,
        createdAt: new Date(),
      } as never)

      const app = createApp()
      const res = await app.request(`/playlists/${PLAYLIST_ID}/songs?weddingId=${WEDDING_ID}`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          playlistId: PLAYLIST_ID,
          title: 'Perfect',
          artist: 'Ed Sheeran',
          category: 'first_dance',
        }),
      })
      expect(res.status).toBe(201)
    })
  })

  describe('Song Requests', () => {
    it('should list song requests', async () => {
      mockedService.listSongRequests.mockResolvedValue([
        {
          id: 'da000000-0000-0000-0000-000000000001',
          weddingId: WEDDING_ID,
          guestName: 'John',
          title: 'Sweet Caroline',
          artist: 'Neil Diamond',
          notes: null,
          isApproved: false,
          createdAt: new Date(),
        },
      ] as never)

      const app = createApp()
      const res = await app.request(`/playlists/requests/all?weddingId=${WEDDING_ID}`, {
        method: 'GET',
        headers: authHeaders(),
      })
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.data).toHaveLength(1)
    })

    it('should create a song request', async () => {
      mockedService.createSongRequest.mockResolvedValue({
        id: 'da000000-0000-0000-0000-000000000001',
        weddingId: WEDDING_ID,
        guestName: 'Jane',
        title: 'Uptown Funk',
        artist: 'Bruno Mars',
        notes: null,
        isApproved: false,
        createdAt: new Date(),
      } as never)

      const app = createApp()
      const res = await app.request(`/playlists/requests?weddingId=${WEDDING_ID}`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          weddingId: WEDDING_ID,
          guestName: 'Jane',
          title: 'Uptown Funk',
          artist: 'Bruno Mars',
        }),
      })
      expect(res.status).toBe(201)
    })

    it('should approve a song request', async () => {
      mockedService.approveSongRequest.mockResolvedValue({
        id: 'da000000-0000-0000-0000-000000000001',
        isApproved: true,
      } as never)

      const app = createApp()
      const res = await app.request(
        `/playlists/requests/da000000-0000-0000-0000-000000000001/approve?weddingId=${WEDDING_ID}`,
        {
          method: 'PUT',
          headers: authHeaders(),
        },
      )
      expect(res.status).toBe(200)
    })
  })
})
