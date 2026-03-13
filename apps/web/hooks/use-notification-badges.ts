'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from '@clerk/nextjs'
import { useWedding } from './use-wedding'
import { api } from '@/lib/api'

interface BadgeCounts {
  inbox: number
  music: number
  photos: number
  messages: number
  prayers: number
}

const POLL_INTERVAL = 60_000
const BADGE_REFRESH_EVENT = 'badges:refresh'

/** Dispatch this from any page after an approval/rejection action to update sidebar badges immediately */
export function refreshBadges() {
  window.dispatchEvent(new Event(BADGE_REFRESH_EVENT))
}

export function useNotificationBadges() {
  const { getToken } = useAuth()
  const { data: weddingData } = useWedding()
  const weddingId = weddingData?.wedding.id ?? null
  const [badges, setBadges] = useState<BadgeCounts>({
    inbox: 0,
    music: 0,
    photos: 0,
    messages: 0,
    prayers: 0,
  })
  const intervalRef = useRef<NodeJS.Timeout | undefined>(undefined)

  const fetchBadges = useCallback(async () => {
    if (!weddingId) return
    try {
      const token = await getToken()
      if (!token) return
      const { data } = await api.notifications.badges(weddingId, token)
      setBadges(data)
    } catch {
      // silent — non-critical
    }
  }, [weddingId, getToken])

  useEffect(() => {
    void fetchBadges()
    const id = setInterval(() => {
      void fetchBadges()
    }, POLL_INTERVAL)
    intervalRef.current = id
    return () => clearInterval(id)
  }, [fetchBadges])

  // Listen for manual refresh events from approval pages
  useEffect(() => {
    const handler = () => void fetchBadges()
    window.addEventListener(BADGE_REFRESH_EVENT, handler)
    return () => window.removeEventListener(BADGE_REFRESH_EVENT, handler)
  }, [fetchBadges])

  return badges
}
