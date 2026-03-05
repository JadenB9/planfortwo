'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@clerk/nextjs'
import type { FeatureGates } from '@planfortwo/types'
import { api } from '@/lib/api'

export function useFeatures(weddingId: string | null) {
  const { getToken } = useAuth()
  const [features, setFeatures] = useState<FeatureGates | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadFeatures = useCallback(async () => {
    if (!weddingId) return
    try {
      setError(null)
      const token = await getToken()
      if (!token) {
        setError('Unable to authenticate. Please sign in again.')
        return
      }
      const { data } = await api.features.get(weddingId, token)
      setFeatures(data)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load features'
      console.error('useFeatures error:', err)
      if (message.includes('fetch') || message.includes('network') || message.includes('ECONNREFUSED')) {
        setError('Unable to connect to the API. Please check that the server is running.')
      } else {
        setError(message)
      }
    } finally {
      setLoading(false)
    }
  }, [weddingId, getToken])

  useEffect(() => {
    void loadFeatures()
  }, [loadFeatures])

  return { features, loading, error, refetch: loadFeatures }
}
