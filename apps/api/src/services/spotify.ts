import { eq } from 'drizzle-orm'
import { db, spotifyConnections } from '@planfortwo/db'

interface SpotifyToken {
  access_token: string
  expires_at: number
}

interface SpotifyTrackData {
  spotifyTrackId: string
  title: string
  artist: string
  album: string
  albumArt: string | null
  durationMs: number
}

interface SpotifyParsedUrl {
  type: 'playlist' | 'track' | 'album'
  id: string
}

interface SpotifyUserPlaylist {
  id: string
  name: string
  description: string | null
  trackCount: number
  imageUrl: string | null
  externalUrl: string
}

let cachedToken: SpotifyToken | null = null

export const spotifyService = {
  parseSpotifyUrl(url: string): SpotifyParsedUrl | null {
    // Handle open.spotify.com URLs
    // e.g. https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M?si=abc
    const webMatch = url.match(/open\.spotify\.com\/(playlist|track|album)\/([a-zA-Z0-9]+)/)
    if (webMatch && webMatch[1] && webMatch[2]) {
      return { type: webMatch[1] as SpotifyParsedUrl['type'], id: webMatch[2] }
    }

    // Handle spotify: URIs
    // e.g. spotify:playlist:37i9dQZF1DXcBWIGoYBM5M
    const uriMatch = url.match(/spotify:(playlist|track|album):([a-zA-Z0-9]+)/)
    if (uriMatch && uriMatch[1] && uriMatch[2]) {
      return { type: uriMatch[1] as SpotifyParsedUrl['type'], id: uriMatch[2] }
    }

    return null
  },

  async getAccessToken(): Promise<string> {
    const clientId = process.env.SPOTIFY_CLIENT_ID
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET
    if (!clientId || !clientSecret) {
      throw new Error('Spotify credentials not configured')
    }

    // Return cached token if still valid (with 60s buffer)
    if (cachedToken && cachedToken.expires_at > Date.now() + 60_000) {
      return cachedToken.access_token
    }

    const resp = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
      },
      body: 'grant_type=client_credentials',
    })

    if (!resp.ok) {
      throw new Error(`Spotify auth failed: ${resp.status}`)
    }

    const data = (await resp.json()) as { access_token: string; expires_in: number }
    cachedToken = {
      access_token: data.access_token,
      expires_at: Date.now() + data.expires_in * 1000,
    }

    return cachedToken.access_token
  },

  async getPlaylistTracks(playlistId: string): Promise<SpotifyTrackData[]> {
    const token = await this.getAccessToken()
    const tracks: SpotifyTrackData[] = []
    let url: string | null =
      `https://api.spotify.com/v1/playlists/${playlistId}/tracks?fields=items(track(id,name,artists,album,duration_ms)),next&limit=100`

    while (url) {
      const resp = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!resp.ok) {
        if (resp.status === 404) throw new Error('Spotify playlist not found')
        throw new Error(`Spotify API error: ${resp.status}`)
      }

      const data = (await resp.json()) as {
        items: Array<{
          track: {
            id: string
            name: string
            artists: Array<{ name: string }>
            album: { name: string; images: Array<{ url: string; width: number }> }
            duration_ms: number
          } | null
        }>
        next: string | null
      }

      for (const item of data.items) {
        if (!item.track) continue
        const t = item.track
        // Pick the smallest image >= 64px, or the last one
        const art =
          t.album.images.find((img) => img.width <= 300)?.url ??
          t.album.images[t.album.images.length - 1]?.url ??
          null

        tracks.push({
          spotifyTrackId: t.id,
          title: t.name,
          artist: t.artists.map((a) => a.name).join(', '),
          album: t.album.name,
          albumArt: art,
          durationMs: t.duration_ms,
        })
      }

      url = data.next
    }

    return tracks
  },

  async searchTracks(query: string, limit = 5): Promise<SpotifyTrackData[]> {
    const token = await this.getAccessToken()
    const resp = await fetch(
      `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=${limit}`,
      { headers: { Authorization: `Bearer ${token}` } },
    )

    if (!resp.ok) {
      throw new Error(`Spotify search failed: ${resp.status}`)
    }

    const data = (await resp.json()) as {
      tracks: {
        items: Array<{
          id: string
          name: string
          artists: Array<{ name: string }>
          album: { name: string; images: Array<{ url: string; width: number }> }
          duration_ms: number
        }>
      }
    }

    return data.tracks.items.map((t) => {
      const art =
        t.album.images.find((img) => img.width <= 300)?.url ??
        t.album.images[t.album.images.length - 1]?.url ??
        null
      return {
        spotifyTrackId: t.id,
        title: t.name,
        artist: t.artists.map((a) => a.name).join(', '),
        album: t.album.name,
        albumArt: art,
        durationMs: t.duration_ms,
      }
    })
  },

  async getTrack(trackId: string): Promise<SpotifyTrackData> {
    const token = await this.getAccessToken()
    const resp = await fetch(`https://api.spotify.com/v1/tracks/${trackId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })

    if (!resp.ok) {
      if (resp.status === 404) throw new Error('Spotify track not found')
      throw new Error(`Spotify API error: ${resp.status}`)
    }

    const t = (await resp.json()) as {
      id: string
      name: string
      artists: Array<{ name: string }>
      album: { name: string; images: Array<{ url: string; width: number }> }
      duration_ms: number
    }

    const art =
      t.album.images.find((img) => img.width <= 300)?.url ??
      t.album.images[t.album.images.length - 1]?.url ??
      null

    return {
      spotifyTrackId: t.id,
      title: t.name,
      artist: t.artists.map((a) => a.name).join(', '),
      album: t.album.name,
      albumArt: art,
      durationMs: t.duration_ms,
    }
  },

  // ── User OAuth Methods ──

  getAuthUrl(): string {
    const clientId = process.env.SPOTIFY_CLIENT_ID
    const redirectUri = process.env.SPOTIFY_REDIRECT_URI
    if (!clientId || !redirectUri) {
      throw new Error(
        'Spotify OAuth not configured (missing SPOTIFY_CLIENT_ID or SPOTIFY_REDIRECT_URI)',
      )
    }

    const scopes = [
      'playlist-modify-public',
      'playlist-modify-private',
      'playlist-read-private',
      'playlist-read-collaborative',
    ].join(' ')

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: clientId,
      scope: scopes,
      redirect_uri: redirectUri,
      show_dialog: 'true',
    })

    return `https://accounts.spotify.com/authorize?${params.toString()}`
  },

  async exchangeCode(code: string): Promise<{
    accessToken: string
    refreshToken: string
    expiresIn: number
    spotifyUserId: string
    spotifyDisplayName: string | null
  }> {
    const clientId = process.env.SPOTIFY_CLIENT_ID
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET
    const redirectUri = process.env.SPOTIFY_REDIRECT_URI
    if (!clientId || !clientSecret || !redirectUri) {
      throw new Error('Spotify OAuth not configured')
    }

    const resp = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
      }).toString(),
    })

    if (!resp.ok) {
      const text = await resp.text()
      console.error('Spotify token exchange failed:', { status: resp.status, body: text })
      throw new Error('Spotify authentication failed')
    }

    const tokenData = (await resp.json()) as {
      access_token: string
      refresh_token: string
      expires_in: number
    }

    // Fetch user profile
    const profileResp = await fetch('https://api.spotify.com/v1/me', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    })
    let spotifyUserId = 'unknown'
    let spotifyDisplayName: string | null = null
    if (profileResp.ok) {
      const profile = (await profileResp.json()) as { id: string; display_name: string | null }
      spotifyUserId = profile.id
      spotifyDisplayName = profile.display_name
    }

    return {
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      expiresIn: tokenData.expires_in,
      spotifyUserId,
      spotifyDisplayName,
    }
  },

  async refreshUserToken(refreshToken: string): Promise<{
    accessToken: string
    refreshToken: string
    expiresIn: number
  }> {
    const clientId = process.env.SPOTIFY_CLIENT_ID
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET
    if (!clientId || !clientSecret) {
      throw new Error('Spotify credentials not configured')
    }

    const resp = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      }).toString(),
    })

    if (!resp.ok) {
      throw new Error(`Spotify token refresh failed: ${resp.status}`)
    }

    const data = (await resp.json()) as {
      access_token: string
      refresh_token?: string
      expires_in: number
    }

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token ?? refreshToken,
      expiresIn: data.expires_in,
    }
  },

  async getUserAccessToken(userId: string): Promise<string> {
    const [conn] = await db
      .select()
      .from(spotifyConnections)
      .where(eq(spotifyConnections.userId, userId))

    if (!conn) {
      throw new Error('Spotify not connected')
    }

    // Check if token is still valid (with 60s buffer)
    if (conn.expiresAt.getTime() > Date.now() + 60_000) {
      return conn.accessToken
    }

    // Refresh the token
    const refreshed = await this.refreshUserToken(conn.refreshToken)

    await db
      .update(spotifyConnections)
      .set({
        accessToken: refreshed.accessToken,
        refreshToken: refreshed.refreshToken,
        expiresAt: new Date(Date.now() + refreshed.expiresIn * 1000),
      })
      .where(eq(spotifyConnections.userId, userId))

    return refreshed.accessToken
  },

  async saveConnection(
    userId: string,
    data: {
      accessToken: string
      refreshToken: string
      expiresIn: number
      spotifyUserId: string
      spotifyDisplayName: string | null
    },
  ) {
    const expiresAt = new Date(Date.now() + data.expiresIn * 1000)

    // Upsert — delete existing and insert new
    await db.delete(spotifyConnections).where(eq(spotifyConnections.userId, userId))
    await db.insert(spotifyConnections).values({
      userId,
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
      expiresAt,
      spotifyUserId: data.spotifyUserId,
      spotifyDisplayName: data.spotifyDisplayName,
    })
  },

  async getConnection(userId: string) {
    const [conn] = await db
      .select({
        id: spotifyConnections.id,
        spotifyUserId: spotifyConnections.spotifyUserId,
        spotifyDisplayName: spotifyConnections.spotifyDisplayName,
      })
      .from(spotifyConnections)
      .where(eq(spotifyConnections.userId, userId))
    return conn ?? null
  },

  async deleteConnection(userId: string) {
    const [deleted] = await db
      .delete(spotifyConnections)
      .where(eq(spotifyConnections.userId, userId))
      .returning()
    return deleted ?? null
  },

  async getUserPlaylists(userId: string): Promise<SpotifyUserPlaylist[]> {
    const token = await this.getUserAccessToken(userId)
    const playlists: SpotifyUserPlaylist[] = []
    let url: string | null = 'https://api.spotify.com/v1/me/playlists?limit=50'

    while (url) {
      const resp = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!resp.ok) {
        throw new Error(`Failed to fetch Spotify playlists: ${resp.status}`)
      }

      const data = (await resp.json()) as {
        items: Array<{
          id: string
          name: string
          description: string | null
          tracks: { total: number }
          images: Array<{ url: string }> | null
          external_urls: { spotify: string }
        }>
        next: string | null
      }

      for (const p of data.items) {
        playlists.push({
          id: p.id,
          name: p.name,
          description: p.description,
          trackCount: p.tracks.total,
          imageUrl: p.images?.[0]?.url ?? null,
          externalUrl: p.external_urls.spotify,
        })
      }

      url = data.next
    }

    return playlists
  },

  async addTracksToSpotifyPlaylist(
    userId: string,
    spotifyPlaylistId: string,
    trackIds: string[],
  ): Promise<{ added: number }> {
    if (trackIds.length === 0) return { added: 0 }

    const token = await this.getUserAccessToken(userId)
    const uris = trackIds.map((id) => `spotify:track:${id}`)

    // Spotify allows max 100 tracks per request
    let totalAdded = 0
    for (let i = 0; i < uris.length; i += 100) {
      const batch = uris.slice(i, i + 100)
      const resp = await fetch(`https://api.spotify.com/v1/playlists/${spotifyPlaylistId}/tracks`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ uris: batch }),
      })

      if (!resp.ok) {
        const text = await resp.text()
        console.error('Failed to add tracks to Spotify:', { status: resp.status, body: text })
        throw new Error('Failed to add tracks to Spotify playlist')
      }

      totalAdded += batch.length
    }

    return { added: totalAdded }
  },
}
