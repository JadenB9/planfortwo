'use client'

import {
  createElement,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { useAuth } from '@clerk/nextjs'
import type { DashboardData, FeatureGates } from '@planfortwo/types'
import { api } from '@/lib/api'

const MAX_RETRIES = 5
const RETRY_DELAY_MS = 1000
const WEDDING_UPDATED_EVENT = 'planfortwo:wedding-updated'

interface WeddingSwitcherOption {
  id: string
  name: string
  date: string | null
  tier: string
  role: string
  onboardingCompleted: boolean
  joinedAt: string | null
}

interface WeddingState {
  data: DashboardData | null
  features: FeatureGates | null
  allWeddings: WeddingSwitcherOption[]
  websiteSubdomain: string | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

const WeddingContext = createContext<WeddingState | null>(null)

/** Dispatch this event from any component to trigger all useWedding instances to refetch */
export function notifyWeddingUpdated() {
  window.dispatchEvent(new Event(WEDDING_UPDATED_EVENT))
}

function useWeddingState(enabled: boolean): WeddingState {
  const { getToken, isLoaded, isSignedIn, userId } = useAuth()
  const [data, setData] = useState<DashboardData | null>(null)
  const [features, setFeatures] = useState<FeatureGates | null>(null)
  const [allWeddings, setAllWeddings] = useState<WeddingSwitcherOption[]>([])
  const [websiteSubdomain, setWebsiteSubdomain] = useState<string | null>(null)
  const [loading, setLoading] = useState(enabled)
  const [error, setError] = useState<string | null>(null)
  const retryCountRef = useRef(0)
  const mountedRef = useRef(true)
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)

  const resetState = useCallback(() => {
    retryCountRef.current = 0
    clearTimeout(timeoutRef.current)
    setData(null)
    setFeatures(null)
    setAllWeddings([])
    setWebsiteSubdomain(null)
    setError(null)
  }, [])

  const load = useCallback(async () => {
    if (!enabled || !isLoaded) return

    if (!isSignedIn || !userId) {
      if (!mountedRef.current) return
      resetState()
      setLoading(false)
      return
    }

    let scheduledRetry = false

    try {
      if (!mountedRef.current) return
      clearTimeout(timeoutRef.current)
      setLoading(true)
      setError(null)

      const token = await getToken()
      if (!mountedRef.current) return

      if (!token) {
        if (retryCountRef.current < MAX_RETRIES) {
          retryCountRef.current += 1
          scheduledRetry = true
          timeoutRef.current = setTimeout(() => {
            void load()
          }, RETRY_DELAY_MS)
          return
        }

        resetState()
        setError('Unable to authenticate. Please refresh the page.')
        return
      }

      const allWeddingsPromise = api.weddings.all(token).catch(() => null)
      const { data: dashData } = await api.weddings.mine(token)
      if (!mountedRef.current) return

      setData(dashData)
      retryCountRef.current = 0

      if (!dashData.wedding.id) {
        setFeatures(null)
        setWebsiteSubdomain(null)
        setAllWeddings((await allWeddingsPromise)?.data ?? [])
        return
      }

      const featuresPromise = api.features.get(dashData.wedding.id, token).catch(() => null)
      const websiteConfigPromise = dashData.wedding.websiteSlug
        ? Promise.resolve(null)
        : api.websiteConfig.get(dashData.wedding.id, token).catch(() => null)

      const [allWeddingsRes, featuresRes, websiteConfigRes] = await Promise.all([
        allWeddingsPromise,
        featuresPromise,
        websiteConfigPromise,
      ])

      if (!mountedRef.current) return

      setAllWeddings(allWeddingsRes?.data ?? [])
      setFeatures(featuresRes?.data ?? null)
      setWebsiteSubdomain(
        dashData.wedding.websiteSlug ?? websiteConfigRes?.data?.subdomain ?? null,
      )
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
        scheduledRetry = true
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
      if (!scheduledRetry) {
        setLoading(false)
      }
    }
  }, [enabled, getToken, isLoaded, isSignedIn, resetState, userId])

  useEffect(() => {
    mountedRef.current = true
    clearTimeout(timeoutRef.current)
    retryCountRef.current = 0

    if (!enabled) {
      resetState()
      setLoading(false)
      return () => {
        mountedRef.current = false
      }
    }

    if (!isLoaded) {
      setLoading(true)
      return () => {
        mountedRef.current = false
      }
    }

    if (!isSignedIn || !userId) {
      resetState()
      setLoading(false)
      return () => {
        mountedRef.current = false
      }
    }

    void load()

    return () => {
      mountedRef.current = false
      clearTimeout(timeoutRef.current)
    }
  }, [enabled, isLoaded, isSignedIn, load, resetState, userId])

  useEffect(() => {
    if (!enabled || !isLoaded || !isSignedIn || !userId) return

    const handler = () => void load()
    window.addEventListener(WEDDING_UPDATED_EVENT, handler)
    return () => window.removeEventListener(WEDDING_UPDATED_EVENT, handler)
  }, [enabled, isLoaded, isSignedIn, load, userId])

  return {
    data,
    features,
    allWeddings,
    websiteSubdomain,
    loading,
    error,
    refetch: load,
  }
}

export function WeddingProvider({ children }: { children: ReactNode }) {
  const state = useWeddingState(true)
  return createElement(WeddingContext.Provider, { value: state }, children)
}

export function useWedding() {
  const context = useContext(WeddingContext)
  const standalone = useWeddingState(context == null)
  return context ?? standalone
}
