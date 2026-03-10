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
}
