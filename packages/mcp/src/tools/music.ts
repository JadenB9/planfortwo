import * as z from 'zod/v4'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { ApiClient } from '../client.js'

export function registerMusicTools(server: McpServer, client: ApiClient, mode: string): void {
  // ── Read-only tools (always registered) ──

  server.registerTool(
    'list_playlists',
    {
      description:
        'List all music playlists for the wedding. Returns playlist names, descriptions, ' +
        'and linked streaming service URLs (Spotify, Apple Music, YouTube Music).',
      inputSchema: z.object({}),
    },
    async () => {
      const result = await client.get('/playlists')
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] }
    },
  )

  server.registerTool(
    'get_playlist',
    {
      description:
        'Get a single playlist with its full list of songs. ' +
        'Each song includes title, artist, category, and sort order.',
      inputSchema: z.object({
        playlistId: z.string().uuid().describe('The UUID of the playlist to retrieve'),
      }),
    },
    async (input) => {
      const result = await client.get(`/playlists/${input.playlistId}`)
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] }
    },
  )

  server.registerTool(
    'list_song_requests',
    {
      description:
        'List all song requests submitted by wedding guests. ' +
        'Returns the guest name, requested song title, artist, notes, and approval status.',
      inputSchema: z.object({}),
    },
    async () => {
      const result = await client.get('/playlists/requests/all')
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] }
    },
  )

  // ── Admin-only tools ──

  if (mode !== 'admin') return

  server.registerTool(
    'create_playlist',
    {
      description:
        'Create a new music playlist for the wedding. Playlists organize songs by event ' +
        '(e.g., ceremony, cocktail hour, reception). Optionally link to streaming service URLs.',
      inputSchema: z.object({
        name: z.string().min(1).max(200).describe('Playlist name (required)'),
        description: z.string().max(2000).optional().describe('Description of the playlist'),
        spotifyUrl: z.string().optional().describe('Spotify playlist URL'),
        appleMusicUrl: z.string().optional().describe('Apple Music playlist URL'),
        youtubeMusicUrl: z.string().optional().describe('YouTube Music playlist URL'),
      }),
    },
    async (input) => {
      const body: Record<string, unknown> = {
        name: input.name,
      }
      if (input.description) body.description = input.description
      if (input.spotifyUrl) body.spotifyUrl = input.spotifyUrl
      if (input.appleMusicUrl) body.appleMusicUrl = input.appleMusicUrl
      if (input.youtubeMusicUrl) body.youtubeMusicUrl = input.youtubeMusicUrl

      const result = await client.post('/playlists', body)
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] }
    },
  )

  server.registerTool(
    'add_song',
    {
      description:
        'Add a song to a playlist. Requires the playlist ID, song title, and artist. ' +
        'Use list_playlists first to get valid playlist IDs.',
      inputSchema: z.object({
        playlistId: z
          .string()
          .uuid()
          .describe('The UUID of the playlist to add the song to (required)'),
        title: z.string().min(1).max(300).describe('Song title (required)'),
        artist: z.string().min(1).max(300).describe('Artist name (required)'),
        category: z
          .enum([
            'first_dance',
            'parent_dance',
            'cake_cutting',
            'bouquet_toss',
            'last_dance',
            'ceremony',
            'cocktail_hour',
            'reception',
            'other',
          ])
          .optional()
          .describe('Song category for the wedding event'),
        sortOrder: z
          .number()
          .int()
          .min(0)
          .optional()
          .describe('Position in the playlist (0-based)'),
      }),
    },
    async (input) => {
      const body: Record<string, unknown> = {
        playlistId: input.playlistId,
        title: input.title,
        artist: input.artist,
      }
      if (input.category) body.category = input.category
      if (input.sortOrder !== undefined) body.sortOrder = input.sortOrder

      const result = await client.post(`/playlists/${input.playlistId}/songs`, body)
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] }
    },
  )

  server.registerTool(
    'delete_song',
    {
      description:
        'Remove a song from a playlist. This action cannot be undone. ' +
        'Use get_playlist first to see the songs in a playlist.',
      inputSchema: z.object({
        songId: z.string().uuid().describe('The UUID of the song to remove'),
      }),
    },
    async (input) => {
      const result = await client.del(`/playlists/songs/${input.songId}`)
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] }
    },
  )

  server.registerTool(
    'approve_song_request',
    {
      description:
        'Approve a guest song request. Approved requests can then be added to a playlist. ' +
        'Use list_song_requests first to see pending requests.',
      inputSchema: z.object({
        requestId: z.string().uuid().describe('The UUID of the song request to approve'),
      }),
    },
    async (input) => {
      const result = await client.put(`/playlists/requests/${input.requestId}/approve`)
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] }
    },
  )
}
