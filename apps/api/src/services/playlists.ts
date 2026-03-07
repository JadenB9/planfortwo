import { eq, and, asc } from 'drizzle-orm'
import { db, playlists, playlistSongs, songRequests } from '@planfortwo/db'
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

  async deleteSong(songId: string, weddingId: string) {
    const [song] = await db
      .select({ playlistId: playlistSongs.playlistId })
      .from(playlistSongs)
      .where(eq(playlistSongs.id, songId))
    if (!song) return null
    const [pl] = await db
      .select({ id: playlists.id })
      .from(playlists)
      .where(and(eq(playlists.id, song.playlistId), eq(playlists.weddingId, weddingId)))
    if (!pl) return null
    const [deleted] = await db.delete(playlistSongs).where(eq(playlistSongs.id, songId)).returning()
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
    const [req] = await db
      .select({ weddingId: songRequests.weddingId })
      .from(songRequests)
      .where(eq(songRequests.id, id))
    if (!req || req.weddingId !== weddingId) return null
    const [updated] = await db
      .update(songRequests)
      .set({ isApproved: true })
      .where(eq(songRequests.id, id))
      .returning()
    return updated ?? null
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
