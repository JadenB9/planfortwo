'use client'

import { useEffect, useState } from 'react'
import type { GuestbookEntry, WebsiteSectionType } from '@planfortwo/types'
import { TemplateProvider } from '@/components/website/template-context'
import { SectionRenderer } from '@/components/website/sections/section-renderer'
import { AnalyticsTracker } from '@/components/website/public/analytics-tracker'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

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

interface PublicWebsiteClientProps {
  slug: string
  config: {
    templateId: string
    customColors: { primary: string; secondary: string; accent: string; background: string } | null
    fontPair: string
  }
  sections: PublicSection[]
  photos: PublicPhoto[]
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
  weddingName,
  weddingDate,
  ceremonyDate,
  ceremonyStartTime,
}: PublicWebsiteClientProps) {
  const [guestbookEntries, setGuestbookEntries] = useState<GuestbookEntry[]>([])

  useEffect(() => {
    fetch(`${API_URL}/website-public/${encodeURIComponent(slug)}/guestbook`)
      .then((res) => (res.ok ? res.json() : { data: [] }))
      .then((json) => setGuestbookEntries(json.data ?? []))
      .catch(() => {})
  }, [slug])

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
      {sortedSections.map((section) => (
        <SectionRenderer
          key={section.id}
          section={section}
          photos={photos}
          guestbookEntries={guestbookEntries}
          weddingName={weddingName}
          weddingDate={parsedDate}
          slug={slug}
          onGuestbookSubmit={handleGuestbookSubmit}
        />
      ))}
    </TemplateProvider>
  )
}
