'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from '@clerk/nextjs'
import type { DashboardData, FeatureGates } from '@planfortwo/types'
import { api } from '@/lib/api'

const MAX_RETRIES = 5
const RETRY_DELAY_MS = 1000
const WEDDING_UPDATED_EVENT = 'planfortwo:wedding-updated'

/** Dispatch this event from any component to trigger all useWedding instances to refetch */
export function notifyWeddingUpdated() {
  window.dispatchEvent(new Event(WEDDING_UPDATED_EVENT))
}

export function useWedding() {
  const { getToken } = useAuth()
  const [data, setData] = useState<DashboardData | null>(null)
  const [features, setFeatures] = useState<FeatureGates | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const retryCountRef = useRef(0)
  const mountedRef = useRef(true)
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)

  const load = useCallback(async () => {
    try {
      if (!mountedRef.current) return
      setError(null)
      const token = await getToken()
      if (!mountedRef.current) return
      if (!token) {
        setError('Unable to authenticate. Please sign in again.')
        setLoading(false)
        return
      }
      const { data: dashData } = await api.weddings.mine(token)
      if (!mountedRef.current) return
      setData(dashData)
      retryCountRef.current = 0
      if (dashData.wedding.id) {
        const { data: feats } = await api.features.get(dashData.wedding.id, token)
        if (!mountedRef.current) return
        setFeatures(feats)
      }
    } catch (err) {
      if (!mountedRef.current) return
      const message = err instanceof Error ? err.message : 'Failed to load wedding data'
      console.error('useWedding error:', err)

      const isSetupPending =
        message.includes('not found') ||
        message.includes('Not Found') ||
        message.includes('USER_NOT_FOUND') ||
        message.includes('no wedding')

      if (isSetupPending && retryCountRef.current < MAX_RETRIES) {
        retryCountRef.current += 1
        console.log(`useWedding: retrying (${retryCountRef.current}/${MAX_RETRIES})...`)
        timeoutRef.current = setTimeout(() => {
          void load()
        }, RETRY_DELAY_MS)
        return
      }

      if (
        message.includes('fetch') ||
        message.includes('network') ||
        message.includes('ECONNREFUSED')
      ) {
        setError('Unable to connect to the API. Please check that the server is running.')
      } else if (isSetupPending) {
        setError('Setting up your account. Please refresh the page in a moment.')
      } else {
        setError(message)
      }
    } finally {
      if (!mountedRef.current) return
      if (retryCountRef.current === 0 || retryCountRef.current >= MAX_RETRIES) {
        setLoading(false)
      }
    }
  }, [getToken])

  useEffect(() => {
    mountedRef.current = true
    void load()
    return () => {
      mountedRef.current = false
      clearTimeout(timeoutRef.current)
    }
  }, [load])

  // Listen for global wedding-updated events (e.g. after payment/promo)
  useEffect(() => {
    const handler = () => void load()
    window.addEventListener(WEDDING_UPDATED_EVENT, handler)
    return () => window.removeEventListener(WEDDING_UPDATED_EVENT, handler)
  }, [load])

  return { data, features, loading, error, refetch: load }
}
