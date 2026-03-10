'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import type { SongRequestsSectionContent } from '@planfortwo/types'
import { useTemplateStyles } from '../template-context'
import { Music } from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

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
  const { colors, fontPair } = useTemplateStyles()
  const [guestName, setGuestName] = useState('')
  const [songTitle, setSongTitle] = useState('')
  const [artist, setArtist] = useState('')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [approvedSongs, setApprovedSongs] = useState<SongRequest[]>([])

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
        // Silently fail — approved songs are optional display
      }
    }
    void fetchApproved()
  }, [slug, content.showApproved])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!guestName.trim() || !songTitle.trim() || !artist.trim()) return
    setSubmitting(true)
    try {
      const res = await fetch(`${API_URL}/website-public/${slug}/song-requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guestName: guestName.trim(),
          title: songTitle.trim(),
          artist: artist.trim(),
          notes: notes.trim() || null,
        }),
      })
      if (res.ok) {
        setGuestName('')
        setSongTitle('')
        setArtist('')
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
          className={`mb-4 text-center text-3xl sm:text-4xl ${fontPair.headingClass}`}
          style={{ color: colors.primary }}
        >
          {title}
        </motion.h2>
        {content.message && (
          <p
            className={`mb-8 text-center ${fontPair.bodyClass}`}
            style={{ color: `${colors.primary}BB` }}
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
          <div className="mb-4">
            <input
              type="text"
              placeholder="Your name"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              maxLength={200}
              required
              className={`w-full rounded-lg border px-4 py-2 text-sm ${fontPair.bodyClass}`}
              style={{ borderColor: colors.secondary, color: colors.primary }}
            />
          </div>
          <div className="mb-4 grid gap-4 sm:grid-cols-2">
            <input
              type="text"
              placeholder="Song title"
              value={songTitle}
              onChange={(e) => setSongTitle(e.target.value)}
              maxLength={300}
              required
              className={`w-full rounded-lg border px-4 py-2 text-sm ${fontPair.bodyClass}`}
              style={{ borderColor: colors.secondary, color: colors.primary }}
            />
            <input
              type="text"
              placeholder="Artist"
              value={artist}
              onChange={(e) => setArtist(e.target.value)}
              maxLength={300}
              required
              className={`w-full rounded-lg border px-4 py-2 text-sm ${fontPair.bodyClass}`}
              style={{ borderColor: colors.secondary, color: colors.primary }}
            />
          </div>
          <div className="mb-4">
            <textarea
              placeholder="Any notes? (optional)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              maxLength={500}
              rows={2}
              className={`w-full resize-none rounded-lg border px-4 py-2 text-sm ${fontPair.bodyClass}`}
              style={{ borderColor: colors.secondary, color: colors.primary }}
            />
          </div>
          <button
            type="submit"
            disabled={submitting || !guestName.trim() || !songTitle.trim() || !artist.trim()}
            className="rounded-full px-6 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            style={{ backgroundColor: colors.primary }}
          >
            {submitting ? 'Submitting...' : 'Request Song'}
          </button>
          {submitted && (
            <p className={`mt-2 text-sm ${fontPair.bodyClass}`} style={{ color: colors.accent }}>
              Thank you! Your song request has been submitted.
            </p>
          )}
        </motion.form>

        {content.showApproved && approvedSongs.length > 0 && (
          <div>
            <h3
              className={`mb-4 text-center text-xl ${fontPair.headingClass}`}
              style={{ color: colors.primary }}
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
                      className={`truncate text-sm font-medium ${fontPair.bodyClass}`}
                      style={{ color: colors.primary }}
                    >
                      {song.title}
                    </p>
                    <p
                      className={`truncate text-xs ${fontPair.bodyClass}`}
                      style={{ color: `${colors.primary}99` }}
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
