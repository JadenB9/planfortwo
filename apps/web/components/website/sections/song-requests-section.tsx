'use client'

import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import type { SongRequestsSectionContent } from '@planfortwo/types'
import {
  useTemplateStyles,
  useHeadingClass,
  useBodyClass,
  useHeadingFont,
  useBodyFont,
} from '../template-context'
import { Music, Search, X } from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

interface SpotifyTrack {
  spotifyTrackId: string
  title: string
  artist: string
  album: string
  albumArt: string | null
  durationMs: number
}

interface SongRequest {
  id: string
  guestName: string
  title: string
  artist: string
  notes: string | null
  isApproved: boolean
  createdAt: string
}

interface SongRequestsSectionProps {
  title: string
  content: SongRequestsSectionContent
  slug: string
}

export function SongRequestsSection({ title, content, slug }: SongRequestsSectionProps) {
  const { colors } = useTemplateStyles()
  const headingClass = useHeadingClass()
  const bodyClass = useBodyClass()
  const headingFont = useHeadingFont()
  const bodyFont = useBodyFont()
  const [guestName, setGuestName] = useState('')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [approvedSongs, setApprovedSongs] = useState<SongRequest[]>([])

  // Spotify search state
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SpotifyTrack[]>([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [selectedTrack, setSelectedTrack] = useState<SpotifyTrack | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const searchContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setShowResults(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (!content.showApproved) return
    const fetchApproved = async () => {
      try {
        const res = await fetch(`${API_URL}/website-public/${slug}/song-requests`)
        if (res.ok) {
          const json = (await res.json()) as { data: SongRequest[] }
          setApprovedSongs(json.data)
        }
      } catch {
        // Silently fail
      }
    }
    void fetchApproved()
  }, [slug, content.showApproved])

  async function searchSpotify(q: string) {
    if (q.length < 2) {
      setSearchResults([])
      return
    }
    setSearchLoading(true)
    try {
      const res = await fetch(`${API_URL}/rsvp/spotify-search?q=${encodeURIComponent(q)}`)
      const json = (await res.json()) as { data: SpotifyTrack[] }
      setSearchResults(json.data ?? [])
    } catch {
      setSearchResults([])
    } finally {
      setSearchLoading(false)
    }
  }

  function handleSearchInput(val: string) {
    setSearchQuery(val)
    setShowResults(true)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => void searchSpotify(val), 350)
  }

  function selectTrack(track: SpotifyTrack) {
    setSelectedTrack(track)
    setSearchQuery('')
    setSearchResults([])
    setShowResults(false)
  }

  function clearTrack() {
    setSelectedTrack(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!guestName.trim() || !selectedTrack) return
    setSubmitting(true)
    try {
      const res = await fetch(`${API_URL}/website-public/${slug}/song-requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guestName: guestName.trim(),
          title: selectedTrack.title,
          artist: selectedTrack.artist,
          notes: notes.trim() || null,
        }),
      })
      if (res.ok) {
        setGuestName('')
        setSelectedTrack(null)
        setNotes('')
        setSubmitted(true)
        setTimeout(() => setSubmitted(false), 4000)
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="py-16 sm:py-24" style={{ backgroundColor: colors.sectionBackground }}>
      <div className="mx-auto max-w-4xl px-4">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className={`mb-4 text-center text-3xl sm:text-4xl ${headingClass}`}
          style={{ ...headingFont, color: colors.primary }}
        >
          {title}
        </motion.h2>
        {content.message && (
          <p
            className={`mb-8 text-center ${bodyClass}`}
            style={{ ...bodyFont, color: `${colors.primary}BB` }}
          >
            {content.message}
          </p>
        )}

        <motion.form
          onSubmit={handleSubmit}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-10 rounded-2xl bg-white p-6 shadow-sm"
        >
          {/* Guest name */}
          <div className="mb-4">
            <input
              type="text"
              placeholder="Your name"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              maxLength={200}
              required
              className={`w-full rounded-lg border px-4 py-2 text-sm ${bodyClass}`}
              style={{ ...bodyFont, borderColor: colors.secondary, color: colors.primary }}
            />
          </div>

          {/* Spotify search */}
          <div className="mb-4">
            {selectedTrack ? (
              <div
                className="flex items-center gap-3 rounded-lg border px-3 py-2"
                style={{ borderColor: colors.secondary, backgroundColor: `${colors.primary}08` }}
              >
                {selectedTrack.albumArt ? (
                  <img
                    src={selectedTrack.albumArt}
                    alt={selectedTrack.album}
                    className="h-10 w-10 rounded-md object-cover"
                  />
                ) : (
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-md"
                    style={{ backgroundColor: `${colors.primary}15` }}
                  >
                    <Music className="h-5 w-5" style={{ color: `${colors.primary}66` }} />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p
                    className={`truncate text-sm font-medium ${bodyClass}`}
                    style={{ ...bodyFont, color: colors.primary }}
                  >
                    {selectedTrack.title}
                  </p>
                  <p
                    className={`truncate text-xs ${bodyClass}`}
                    style={{ ...bodyFont, color: `${colors.primary}99` }}
                  >
                    {selectedTrack.artist}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={clearTrack}
                  className="shrink-0 rounded-md p-1 transition-colors hover:opacity-70"
                  style={{ color: `${colors.primary}66` }}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div ref={searchContainerRef} className="relative">
                <div className="relative">
                  <Search
                    className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
                    style={{ color: `${colors.primary}66` }}
                  />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => handleSearchInput(e.target.value)}
                    onFocus={() => searchResults.length > 0 && setShowResults(true)}
                    placeholder="Search for a song on Spotify..."
                    className={`w-full rounded-lg border py-2 pl-9 pr-4 text-sm ${bodyClass}`}
                    style={{ ...bodyFont, borderColor: colors.secondary, color: colors.primary }}
                  />
                  {searchLoading && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <div
                        className="h-4 w-4 animate-spin rounded-full border-2"
                        style={{
                          borderColor: `${colors.primary}33`,
                          borderTopColor: colors.primary,
                        }}
                      />
                    </div>
                  )}
                </div>

                {showResults && searchResults.length > 0 && (
                  <div
                    className="absolute z-20 mt-1 w-full rounded-lg border bg-white shadow-lg"
                    style={{ borderColor: colors.secondary }}
                  >
                    {searchResults.map((track) => (
                      <button
                        key={track.spotifyTrackId}
                        type="button"
                        onClick={() => selectTrack(track)}
                        className="flex w-full items-center gap-3 px-3 py-2 text-left transition-colors first:rounded-t-lg last:rounded-b-lg hover:bg-gray-50"
                      >
                        {track.albumArt ? (
                          <img
                            src={track.albumArt}
                            alt={track.album}
                            className="h-10 w-10 shrink-0 rounded-md object-cover"
                          />
                        ) : (
                          <div
                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md"
                            style={{ backgroundColor: `${colors.primary}15` }}
                          >
                            <Music className="h-5 w-5" style={{ color: `${colors.primary}66` }} />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p
                            className={`truncate text-sm font-medium ${bodyClass}`}
                            style={{ ...bodyFont, color: colors.primary }}
                          >
                            {track.title}
                          </p>
                          <p
                            className={`truncate text-xs ${bodyClass}`}
                            style={{ ...bodyFont, color: `${colors.primary}99` }}
                          >
                            {track.artist}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {showResults &&
                  searchQuery.length >= 2 &&
                  !searchLoading &&
                  searchResults.length === 0 && (
                    <div
                      className="absolute z-20 mt-1 w-full rounded-lg border bg-white p-3 text-center shadow-lg"
                      style={{ borderColor: colors.secondary }}
                    >
                      <p
                        className={`text-sm ${bodyClass}`}
                        style={{ ...bodyFont, color: `${colors.primary}99` }}
                      >
                        No songs found
                      </p>
                    </div>
                  )}
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="mb-4">
            <textarea
              placeholder="Any notes? (optional)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              maxLength={500}
              rows={2}
              className={`w-full resize-none rounded-lg border px-4 py-2 text-sm ${bodyClass}`}
              style={{ ...bodyFont, borderColor: colors.secondary, color: colors.primary }}
            />
          </div>

          <button
            type="submit"
            disabled={submitting || !guestName.trim() || !selectedTrack}
            className="rounded-full px-6 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            style={{ backgroundColor: colors.primary }}
          >
            {submitting ? 'Submitting...' : 'Request Song'}
          </button>
          {submitted && (
            <p
              className={`mt-2 text-sm ${bodyClass}`}
              style={{ ...bodyFont, color: colors.accent }}
            >
              Thank you! Your song request has been submitted.
            </p>
          )}
        </motion.form>

        {content.showApproved && approvedSongs.length > 0 && (
          <div>
            <h3
              className={`mb-4 text-center text-xl ${headingClass}`}
              style={{ ...headingFont, color: colors.primary }}
            >
              Requested Songs
            </h3>
            <div className="space-y-3">
              {approvedSongs.map((song, i) => (
                <motion.div
                  key={song.id}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-sm"
                >
                  <Music className="h-5 w-5 shrink-0" style={{ color: colors.accent }} />
                  <div className="min-w-0 flex-1">
                    <p
                      className={`truncate text-sm font-medium ${bodyClass}`}
                      style={{ ...bodyFont, color: colors.primary }}
                    >
                      {song.title}
                    </p>
                    <p
                      className={`truncate text-xs ${bodyClass}`}
                      style={{ ...bodyFont, color: `${colors.primary}99` }}
                    >
                      {song.artist} &mdash; requested by {song.guestName}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
