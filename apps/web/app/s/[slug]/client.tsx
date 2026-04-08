'use client'

import { useEffect, useState } from 'react'
import type { CustomColors, GuestbookEntry, Prayer, WebsiteSectionType } from '@planfortwo/types'
import { TemplateProvider } from '@/components/website/template-context'
import { SectionRenderer } from '@/components/website/sections/section-renderer'
import { AnalyticsTracker } from '@/components/website/public/analytics-tracker'
import { getGoogleFontsUrl } from '@/lib/fonts'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

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
  initialGuestbookEntries?: GuestbookEntry[]
  initialPrayerEntries?: Prayer[]
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
  initialGuestbookEntries = [],
  initialPrayerEntries = [],
  weddingName,
  weddingDate,
  ceremonyDate,
  ceremonyStartTime,
}: PublicWebsiteClientProps) {
  const [guestbookEntries, setGuestbookEntries] =
    useState<GuestbookEntry[]>(initialGuestbookEntries)
  const [prayerEntries, setPrayerEntries] = useState<Prayer[]>(initialPrayerEntries)

  // Load only the selected Google font pair
  useEffect(() => {
    if (typeof document === 'undefined') return
    const href = getGoogleFontsUrl(config.fontPair)
    const existing = document.getElementById('public-gfonts') as HTMLLinkElement | null
    if (existing?.href === href) return

    if (existing) {
      existing.href = href
      return
    }

    const link = document.createElement('link')
    link.id = 'public-gfonts'
    link.rel = 'stylesheet'
    link.href = href
    document.head.appendChild(link)
  }, [config.fontPair])

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
