'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@clerk/nextjs'
import type {
  WebsiteConfig,
  WebsiteSection,
  WebsitePhoto,
  GuestbookEntry,
  WebsiteAnalyticsSummary,
} from '@planfortwo/types'
import { api } from '@/lib/api'

interface UseWebsiteOptions {
  weddingId: string | null
}

export function useWebsite({ weddingId }: UseWebsiteOptions) {
  const { getToken } = useAuth()
  const [config, setConfig] = useState<WebsiteConfig | null>(null)
  const [sections, setSections] = useState<WebsiteSection[]>([])
  const [photos, setPhotos] = useState<WebsitePhoto[]>([])
  const [guestbookEntries, setGuestbookEntries] = useState<GuestbookEntry[]>([])
  const [analytics, setAnalytics] = useState<WebsiteAnalyticsSummary | null>(null)
  const [loading, setLoading] = useState(true)

  const loadData = useCallback(async () => {
    if (!weddingId) return
    setLoading(true)
    try {
      const token = await getToken()
      if (!token) return

      const [configRes, sectionsRes, guestbookRes] = await Promise.all([
        api.websiteConfig.get(weddingId, token),
        api.websiteSections.list(weddingId, token),
        api.guestbook.list(weddingId, token),
      ])

      setConfig(configRes.data)
      setSections(sectionsRes.data)
      setGuestbookEntries(guestbookRes.data)

      // Load photos and analytics in parallel (may fail silently for free tier or missing config)
      const optionalPromises: Promise<void>[] = []
      optionalPromises.push(
        api.websitePhotos
          .list(weddingId, token)
          .then(({ data }) => setPhotos(data))
          .catch(() => {
            /* photos not available */
          }),
      )
      optionalPromises.push(
        api.websiteAnalytics
          .getSummary(weddingId, token)
          .then(({ data }) => setAnalytics(data))
          .catch(() => {
            /* analytics not available on free tier */
          }),
      )
      await Promise.all(optionalPromises)
    } catch {
      /* silent */
    } finally {
      setLoading(false)
    }
  }, [weddingId, getToken])

  useEffect(() => {
    void loadData()
  }, [loadData])

  return {
    config,
    sections,
    photos,
    guestbookEntries,
    analytics,
    loading,
    refetch: loadData,
  }
}
