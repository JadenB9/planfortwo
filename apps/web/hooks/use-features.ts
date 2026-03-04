'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@clerk/nextjs'
import type { FeatureGates } from '@planfortwo/types'
import { api } from '@/lib/api'

export function useFeatures(weddingId: string | null) {
  const { getToken } = useAuth()
  const [features, setFeatures] = useState<FeatureGates | null>(null)
  const [loading, setLoading] = useState(true)

  const loadFeatures = useCallback(async () => {
    if (!weddingId) return
    try {
      const token = await getToken()
      if (!token) return
      const { data } = await api.features.get(weddingId, token)
      setFeatures(data)
    } catch {
      /* silent */
    } finally {
      setLoading(false)
    }
  }, [weddingId, getToken])

  useEffect(() => {
    void loadFeatures()
  }, [loadFeatures])

  return { features, loading, refetch: loadFeatures }
}
