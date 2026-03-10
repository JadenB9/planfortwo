'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from '@clerk/nextjs'
import type {
  WebsiteConfig,
  WebsiteSection,
  WebsitePhoto,
  GuestbookEntry,
  WebsiteAnalyticsSummary,
} from '@planfortwo/types'
import { api } from '@/lib/api'

const CACHE_KEY = 'planfortwo:website-cache'

interface CachedWebsiteData {
  weddingId: string
  config: WebsiteConfig | null
  sections: WebsiteSection[]
}

function readCache(weddingId: string): CachedWebsiteData | null {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as CachedWebsiteData
    if (parsed.weddingId !== weddingId) return null
    return parsed
  } catch {
    return null
  }
}

function writeCache(weddingId: string, config: WebsiteConfig | null, sections: WebsiteSection[]) {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify({ weddingId, config, sections }))
  } catch {
    /* quota exceeded — ignore */
  }
}

interface UseWebsiteOptions {
  weddingId: string | null
}

export function useWebsite({ weddingId }: UseWebsiteOptions) {
  const { getToken } = useAuth()
  const [config, setConfig] = useState<WebsiteConfig | null>(() => {
    if (!weddingId) return null
    return readCache(weddingId)?.config ?? null
  })
  const [sections, setSections] = useState<WebsiteSection[]>(() => {
    if (!weddingId) return []
    return readCache(weddingId)?.sections ?? []
  })
  const [photos, setPhotos] = useState<WebsitePhoto[]>([])
  const [guestbookEntries, setGuestbookEntries] = useState<GuestbookEntry[]>([])
  const [analytics, setAnalytics] = useState<WebsiteAnalyticsSummary | null>(null)
  const [loading, setLoading] = useState(() => {
    if (!weddingId) return true
    return readCache(weddingId)?.config == null
  })
  const hasLoadedOnce = useRef(false)

  const loadData = useCallback(async () => {
    if (!weddingId) {
      setLoading(false)
      return
    }
    // Only show loading skeleton on first load when there's no cached data
    if (!hasLoadedOnce.current && !readCache(weddingId)?.config) setLoading(true)
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
      writeCache(weddingId, configRes.data, sectionsRes.data)

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
      hasLoadedOnce.current = true
      setLoading(false)
    }
  }, [weddingId, getToken])

  useEffect(() => {
    void loadData()
  }, [loadData])

  return {
    config,
    sections,
    setSections,
    photos,
    guestbookEntries,
    analytics,
    loading,
    refetch: loadData,
  }
}
