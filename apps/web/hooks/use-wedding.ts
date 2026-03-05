'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@clerk/nextjs'
import type { DashboardData, FeatureGates } from '@planfortwo/types'
import { api } from '@/lib/api'

export function useWedding() {
  const { getToken } = useAuth()
  const [data, setData] = useState<DashboardData | null>(null)
  const [features, setFeatures] = useState<FeatureGates | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      setError(null)
      const token = await getToken()
      if (!token) {
        setError('Unable to authenticate. Please sign in again.')
        return
      }
      const { data: dashData } = await api.weddings.mine(token)
      setData(dashData)
      if (dashData.wedding.id) {
        const { data: feats } = await api.features.get(dashData.wedding.id, token)
        setFeatures(feats)
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load wedding data'
      console.error('useWedding error:', err)
      if (message.includes('fetch') || message.includes('network') || message.includes('ECONNREFUSED')) {
        setError('Unable to connect to the API. Please check that the server is running.')
      } else {
        setError(message)
      }
    } finally {
      setLoading(false)
    }
  }, [getToken])

  useEffect(() => {
    void load()
  }, [load])

  return { data, features, loading, error, refetch: load }
}
