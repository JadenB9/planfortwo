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
    intervalRef.current = setInterval(() => {
      void fetchBadges()
    }, POLL_INTERVAL)
    return () => clearInterval(intervalRef.current)
  }, [fetchBadges])

  return badges
}
