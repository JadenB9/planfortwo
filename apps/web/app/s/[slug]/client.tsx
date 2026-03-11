'use client'

import { useEffect, useState } from 'react'
import type { CustomColors, GuestbookEntry, Prayer, WebsiteSectionType } from '@planfortwo/types'
import { TemplateProvider } from '@/components/website/template-context'
import { SectionRenderer } from '@/components/website/sections/section-renderer'
import { AnalyticsTracker } from '@/components/website/public/analytics-tracker'
import { fontPairs } from '@/lib/fonts'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

// Build Google Fonts URL for all font pairs
const GOOGLE_FONTS_URL = (() => {
  const families = fontPairs
    .flatMap((fp) => [fp.heading, fp.body])
    .filter((v, i, a) => a.indexOf(v) === i)
    .map(
      (name) =>
        `family=${name.replace(/\s+/g, '+')}:ital,wght@0,300;0,400;0,600;0,700;1,300;1,400;1,600;1,700`,
    )
    .join('&')
  return `https://fonts.googleapis.com/css2?${families}&display=swap`
})()

/** Sections that use sectionBackground; all others use background */
const SECTION_BG_TYPES = new Set([
  'event_details',
  'registry',
  'prayers',
  'guestbook',
  'rsvp',
  'song_requests',
  'travel',
])

function getSectionBgVar(sectionType: string): string {
  return SECTION_BG_TYPES.has(sectionType)
    ? 'var(--template-section-background)'
    : 'var(--template-background)'
}

interface PublicSection {
  id: string
  sectionType: WebsiteSectionType
  title: string
  content: Record<string, unknown>
  isVisible: boolean
  sortOrder: number
  createdAt: Date
  updatedAt: Date
}

interface PublicPhoto {
  id: string
  sectionId: string | null
  r2Key: string
  url: string
  fileName: string
  mimeType: string
  fileSize: number
  width: number | null
  height: number | null
  altText: string | null
  sortOrder: number
  createdAt: Date
}

interface PublicGuestPhoto {
  id: string
  url: string
  caption: string | null
  uploaderName: string | null
  createdAt: Date | string
}

interface PublicWebsiteClientProps {
  slug: string
  config: {
    templateId: string
    customColors: CustomColors | null
    fontPair: string
  }
  sections: PublicSection[]
  photos: PublicPhoto[]
  guestPhotos?: PublicGuestPhoto[]
  weddingName: string
  weddingDate: string | null
  ceremonyDate: string | null
  ceremonyStartTime: string | null
}

function parseCeremonyDateTime(dateStr: string, startTime: string | null): Date {
  const date = new Date(dateStr)
  if (startTime) {
    // Handle "2:00 PM" or "14:00" style time strings
    const twelveHour = startTime.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i)
    if (twelveHour) {
      let hours = parseInt(twelveHour[1]!, 10)
      const minutes = parseInt(twelveHour[2]!, 10)
      const period = twelveHour[3]!.toUpperCase()
      if (period === 'PM' && hours !== 12) hours += 12
      if (period === 'AM' && hours === 12) hours = 0
      date.setHours(hours, minutes, 0, 0)
    } else {
      const twentyFourHour = startTime.match(/^(\d{1,2}):(\d{2})$/)
      if (twentyFourHour) {
        date.setHours(parseInt(twentyFourHour[1]!, 10), parseInt(twentyFourHour[2]!, 10), 0, 0)
      }
    }
  }
  return date
}

export function PublicWebsiteClient({
  slug,
  config,
  sections,
  photos,
  guestPhotos,
  weddingName,
  weddingDate,
  ceremonyDate,
  ceremonyStartTime,
}: PublicWebsiteClientProps) {
  const [guestbookEntries, setGuestbookEntries] = useState<GuestbookEntry[]>([])
  const [prayerEntries, setPrayerEntries] = useState<Prayer[]>([])

  // Load Google Fonts for all font pairs
  useEffect(() => {
    if (typeof document === 'undefined') return
    if (document.getElementById('public-gfonts')) return
    const link = document.createElement('link')
    link.id = 'public-gfonts'
    link.rel = 'stylesheet'
    link.href = GOOGLE_FONTS_URL
    document.head.appendChild(link)
  }, [])

  useEffect(() => {
    fetch(`${API_URL}/website-public/${encodeURIComponent(slug)}/guestbook`)
      .then((res) => (res.ok ? res.json() : { data: [] }))
      .then((json) => setGuestbookEntries(json.data ?? []))
      .catch(() => {})
    fetch(`${API_URL}/website-public/${encodeURIComponent(slug)}/prayers`)
      .then((res) => (res.ok ? res.json() : { data: [] }))
      .then((json) => setPrayerEntries(json.data ?? []))
      .catch(() => {})
  }, [slug])

  const handlePrayerSubmit = async (authorName: string, prayerText: string, website?: string) => {
    const res = await fetch(`${API_URL}/website-public/${encodeURIComponent(slug)}/prayers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ authorName, prayerText, ...(website ? { website } : {}) }),
    })
    if (res.ok) {
      const refreshRes = await fetch(
        `${API_URL}/website-public/${encodeURIComponent(slug)}/prayers`,
      )
      if (refreshRes.ok) {
        const json = await refreshRes.json()
        setPrayerEntries(json.data ?? [])
      }
    }
  }

  const handleGuestbookSubmit = async (authorName: string, message: string, website?: string) => {
    const res = await fetch(`${API_URL}/website-public/${encodeURIComponent(slug)}/guestbook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ authorName, message, ...(website ? { website } : {}) }),
    })
    if (res.ok) {
      const refreshRes = await fetch(
        `${API_URL}/website-public/${encodeURIComponent(slug)}/guestbook`,
      )
      if (refreshRes.ok) {
        const json = await refreshRes.json()
        setGuestbookEntries(json.data ?? [])
      }
    }
  }

  const sortedSections = [...sections]
    .filter((s) => s.isVisible)
    .sort((a, b) => a.sortOrder - b.sortOrder)

  const parsedDate = ceremonyDate
    ? parseCeremonyDateTime(ceremonyDate, ceremonyStartTime)
    : weddingDate
      ? new Date(weddingDate)
      : null

  return (
    <TemplateProvider
      templateId={config.templateId}
      customColors={config.customColors}
      fontPairId={config.fontPair}
    >
      <AnalyticsTracker slug={slug} />
      {sortedSections.map((section, index) => {
        const prevSection = index > 0 ? sortedSections[index - 1] : null
        const prevBg = prevSection ? getSectionBgVar(prevSection.sectionType) : null
        const currentBg = getSectionBgVar(section.sectionType)
        const needsBlend = prevBg !== null && prevBg !== currentBg

        return (
          <div key={section.id} className="relative">
            {needsBlend && (
              <div
                className="pointer-events-none absolute inset-x-0 top-0 z-10 h-16"
                style={{
                  background: `linear-gradient(to bottom, ${prevBg}, transparent)`,
                }}
              />
            )}
            <SectionRenderer
              section={section}
              photos={photos}
              guestPhotos={guestPhotos}
              guestbookEntries={guestbookEntries}
              prayerEntries={prayerEntries}
              weddingName={weddingName}
              weddingDate={parsedDate}
              slug={slug}
              onGuestbookSubmit={handleGuestbookSubmit}
              onPrayerSubmit={handlePrayerSubmit}
            />
          </div>
        )
      })}
    </TemplateProvider>
  )
}
