import { eq, and, asc, sql } from 'drizzle-orm'
import { db, playlists, playlistSongs, songRequests } from '@planfortwo/db'
import { spotifyService } from './spotify.js'
import type {
  CreatePlaylistInput,
  UpdatePlaylistInput,
  CreatePlaylistSongInput,
  CreateSongRequestInput,
} from '@planfortwo/validators'

export const playlistService = {
  async listPlaylists(weddingId: string) {
    return db
      .select()
      .from(playlists)
      .where(eq(playlists.weddingId, weddingId))
      .orderBy(asc(playlists.createdAt))
  },

  async getPlaylist(id: string, weddingId: string) {
    const [playlist] = await db
      .select()
      .from(playlists)
      .where(and(eq(playlists.id, id), eq(playlists.weddingId, weddingId)))
    if (!playlist) return null
    const songs = await db
      .select()
      .from(playlistSongs)
      .where(eq(playlistSongs.playlistId, id))
      .orderBy(asc(playlistSongs.sortOrder))
    return { ...playlist, songs }
  },

  async createPlaylist(data: CreatePlaylistInput) {
    const [playlist] = await db.insert(playlists).values(data).returning()
    return playlist
  },

  async updatePlaylist(id: string, weddingId: string, data: UpdatePlaylistInput) {
    const [updated] = await db
      .update(playlists)
      .set(data)
      .where(and(eq(playlists.id, id), eq(playlists.weddingId, weddingId)))
      .returning()
    return updated ?? null
  },

  async deletePlaylist(id: string, weddingId: string) {
    const [deleted] = await db
      .delete(playlists)
      .where(and(eq(playlists.id, id), eq(playlists.weddingId, weddingId)))
      .returning()
    return deleted ?? null
  },

  async addSong(data: CreatePlaylistSongInput) {
    const [song] = await db.insert(playlistSongs).values(data).returning()
    return song
  },

  async bulkAddSongs(
    playlistId: string,
    songs: Array<{
      title: string
      artist: string
      album?: string | null
      albumArt?: string | null
      durationMs?: number | null
      spotifyTrackId?: string | null
      sortOrder?: number
    }>,
  ) {
    if (songs.length === 0) return []
    const values = songs.map((s, i) => ({
      playlistId,
      title: s.title,
      artist: s.artist,
      album: s.album ?? null,
      albumArt: s.albumArt ?? null,
      durationMs: s.durationMs ?? null,
      spotifyTrackId: s.spotifyTrackId ?? null,
      sortOrder: s.sortOrder ?? i,
    }))
    return db.insert(playlistSongs).values(values).returning()
  },

  async clearPlaylistSongs(playlistId: string, weddingId: string) {
    // Verify ownership first
    const [pl] = await db
      .select({ id: playlists.id, isAcceptedSongs: playlists.isAcceptedSongs })
      .from(playlists)
      .where(and(eq(playlists.id, playlistId), eq(playlists.weddingId, weddingId)))
    if (!pl) return false

    // If clearing the Accepted Songs playlist, reset all approved requests to pending
    if (pl.isAcceptedSongs) {
      await db
        .update(songRequests)
        .set({ isApproved: false })
        .where(and(eq(songRequests.weddingId, weddingId), eq(songRequests.isApproved, true)))
    }

    await db.delete(playlistSongs).where(eq(playlistSongs.playlistId, playlistId))
    return true
  },

  async deleteSong(songId: string, weddingId: string) {
    const [song] = await db
      .select({
        playlistId: playlistSongs.playlistId,
        title: playlistSongs.title,
        artist: playlistSongs.artist,
      })
      .from(playlistSongs)
      .where(eq(playlistSongs.id, songId))
    if (!song) return null
    const [pl] = await db
      .select({ id: playlists.id, isAcceptedSongs: playlists.isAcceptedSongs })
      .from(playlists)
      .where(and(eq(playlists.id, song.playlistId), eq(playlists.weddingId, weddingId)))
    if (!pl) return null
    const [deleted] = await db.delete(playlistSongs).where(eq(playlistSongs.id, songId)).returning()

    // If removed from the Accepted Songs playlist, reset matching request to pending
    if (pl.isAcceptedSongs && deleted) {
      await db
        .update(songRequests)
        .set({ isApproved: false })
        .where(
          and(
            eq(songRequests.weddingId, weddingId),
            eq(songRequests.title, song.title),
            eq(songRequests.artist, song.artist),
            eq(songRequests.isApproved, true),
          ),
        )
    }

    return deleted ?? null
  },

  async listSongRequests(weddingId: string) {
    return db
      .select()
      .from(songRequests)
      .where(eq(songRequests.weddingId, weddingId))
      .orderBy(asc(songRequests.createdAt))
  },

  async createSongRequest(data: CreateSongRequestInput) {
    const [request] = await db.insert(songRequests).values(data).returning()
    return request
  },

  async approveSongRequest(id: string, weddingId: string) {
    const [req] = await db.select().from(songRequests).where(eq(songRequests.id, id))
    if (!req || req.weddingId !== weddingId) return null
    const [updated] = await db
      .update(songRequests)
      .set({ isApproved: true })
      .where(eq(songRequests.id, id))
      .returning()
    if (!updated) return null

    // Add approved song to the "Accepted Songs" default playlist
    let [acceptedPlaylist] = await db
      .select()
      .from(playlists)
      .where(and(eq(playlists.weddingId, weddingId), eq(playlists.isAcceptedSongs, true)))

    if (!acceptedPlaylist) {
      const [created] = await db
        .insert(playlists)
        .values({ weddingId, name: 'Accepted Songs', isAcceptedSongs: true })
        .returning()
      acceptedPlaylist = created!
    }

    const [countResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(playlistSongs)
      .where(eq(playlistSongs.playlistId, acceptedPlaylist.id))
    const sortOrder = countResult?.count ?? 0

    // Try to enrich with Spotify metadata
    let spotifyData: {
      spotifyTrackId?: string
      album?: string
      albumArt?: string | null
      durationMs?: number
    } = {}
    try {
      const results = await spotifyService.searchTracks(`${req.title} ${req.artist}`, 1)
      if (results.length > 0) {
        const match = results[0]!
        spotifyData = {
          spotifyTrackId: match.spotifyTrackId,
          album: match.album,
          albumArt: match.albumArt,
          durationMs: match.durationMs,
        }
      }
    } catch {
      // Spotify lookup failed — proceed with basic data
    }

    await db.insert(playlistSongs).values({
      playlistId: acceptedPlaylist.id,
      title: req.title,
      artist: req.artist,
      album: spotifyData.album ?? null,
      albumArt: spotifyData.albumArt ?? null,
      durationMs: spotifyData.durationMs ?? null,
      spotifyTrackId: spotifyData.spotifyTrackId ?? null,
      sortOrder,
    })

    return updated
  },

  async deleteSongRequest(id: string, weddingId: string) {
    const [req] = await db
      .select({ weddingId: songRequests.weddingId })
      .from(songRequests)
      .where(eq(songRequests.id, id))
    if (!req || req.weddingId !== weddingId) return null
    const [deleted] = await db.delete(songRequests).where(eq(songRequests.id, id)).returning()
    return deleted ?? null
  },
}
