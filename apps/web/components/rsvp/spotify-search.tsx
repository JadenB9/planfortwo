'use client'

import { useState, useRef, useEffect } from 'react'
import { Music, X, Search } from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

interface SpotifyTrack {
  spotifyTrackId: string
  title: string
  artist: string
  album: string
  albumArt: string | null
  durationMs: number
}

interface SpotifySearchProps {
  value: string
  onChange: (value: string) => void
}

export function SpotifySearch({ value, onChange }: SpotifySearchProps) {
  const [query, setQuery] = useState(value)
  const [results, setResults] = useState<SpotifyTrack[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<SpotifyTrack | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  async function search(q: string) {
    if (q.length < 2) {
      setResults([])
      return
    }
    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/rsvp/spotify-search?q=${encodeURIComponent(q)}`)
      const json = (await res.json()) as { data: SpotifyTrack[] }
      setResults(json.data ?? [])
    } catch {
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  function handleInput(val: string) {
    setQuery(val)
    setOpen(true)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => void search(val), 350)
  }

  function selectTrack(track: SpotifyTrack) {
    setSelected(track)
    onChange(`${track.title} - ${track.artist}`)
    setQuery('')
    setResults([])
    setOpen(false)
  }

  function clearSelection() {
    setSelected(null)
    onChange('')
  }

  if (selected) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2">
        {selected.albumArt ? (
          <img
            src={selected.albumArt}
            alt={selected.album}
            className="h-10 w-10 rounded-md object-cover"
          />
        ) : (
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-gray-200">
            <Music className="h-5 w-5 text-gray-400" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-gray-900">{selected.title}</p>
          <p className="truncate text-xs text-gray-500">{selected.artist}</p>
        </div>
        <button
          type="button"
          onClick={clearSelection}
          className="shrink-0 rounded-md p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-600"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    )
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => handleInput(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder="Search for a song on Spotify..."
          className="focus:border-wedding-600 focus:ring-wedding-600/20 w-full rounded-xl border border-gray-300 py-2.5 pl-9 pr-4 text-sm text-gray-900 shadow-sm transition-colors focus:outline-none focus:ring-2"
        />
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
          </div>
        )}
      </div>

      {open && results.length > 0 && (
        <div className="absolute z-20 mt-1 w-full rounded-xl border border-gray-200 bg-white shadow-lg">
          {results.map((track) => (
            <button
              key={track.spotifyTrackId}
              type="button"
              onClick={() => selectTrack(track)}
              className="flex w-full items-center gap-3 px-3 py-2 text-left transition-colors first:rounded-t-xl last:rounded-b-xl hover:bg-gray-50"
            >
              {track.albumArt ? (
                <img
                  src={track.albumArt}
                  alt={track.album}
                  className="h-10 w-10 shrink-0 rounded-md object-cover"
                />
              ) : (
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-gray-100">
                  <Music className="h-5 w-5 text-gray-400" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-gray-900">{track.title}</p>
                <p className="truncate text-xs text-gray-500">{track.artist}</p>
              </div>
            </button>
          ))}
        </div>
      )}

      {open && query.length >= 2 && !loading && results.length === 0 && (
        <div className="absolute z-20 mt-1 w-full rounded-xl border border-gray-200 bg-white p-3 text-center shadow-lg">
          <p className="text-sm text-gray-500">No songs found</p>
        </div>
      )}
    </div>
  )
}
