'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from '@clerk/nextjs'
import type {
  GuestWithTags,
  GuestStats,
  Household,
  GuestTag,
  RsvpStatus,
  GuestSide,
} from '@planfortwo/types'
import { api } from '@/lib/api'

export interface GuestFilterState {
  search?: string
  rsvpStatus?: RsvpStatus
  side?: GuestSide
  tagId?: string
  householdId?: string
  isChild?: boolean
  isVip?: boolean
  hasPlusOne?: boolean
  page?: number
  pageSize?: number
}

interface UseGuestsOptions {
  weddingId: string | null
  initialFilters?: GuestFilterState
}

export function useGuests({ weddingId, initialFilters }: UseGuestsOptions) {
  const { getToken } = useAuth()
  const [guests, setGuests] = useState<GuestWithTags[]>([])
  const [stats, setStats] = useState<GuestStats | null>(null)
  const [households, setHouseholds] = useState<Household[]>([])
  const [tags, setTags] = useState<GuestTag[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<GuestFilterState>({
    page: 1,
    pageSize: 50,
    ...initialFilters,
  })
  const [total, setTotal] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [])

  const loadGuests = useCallback(async () => {
    if (!weddingId) {
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const token = await getToken()
      if (!token) return

      const [guestsRes, statsRes, householdsRes, tagsRes] = await Promise.all([
        api.guests.list(weddingId, token, filters),
        api.guests.stats(weddingId, token),
        api.households.list(weddingId, token),
        api.guestTags.list(weddingId, token),
      ])

      setGuests(guestsRes.data)
      setTotal(guestsRes.total)
      setHasMore(guestsRes.hasMore)
      setStats(statsRes.data)
      setHouseholds(householdsRes.data)
      setTags(tagsRes.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load guest data')
    } finally {
      setLoading(false)
    }
  }, [weddingId, getToken, filters])

  useEffect(() => {
    void loadGuests()
  }, [loadGuests])

  const updateFilters = useCallback((newFilters: Partial<GuestFilterState>) => {
    setFilters((prev) => ({ ...prev, ...newFilters, page: 1 }))
  }, [])

  const setSearchDebounced = useCallback((search: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setFilters((prev) => ({ ...prev, search, page: 1 }))
    }, 300)
  }, [])

  const setPage = useCallback((page: number) => {
    setFilters((prev) => ({ ...prev, page }))
  }, [])

  const setPageSize = useCallback((pageSize: number) => {
    setFilters((prev) => ({ ...prev, pageSize, page: 1 }))
  }, [])

  return {
    guests,
    stats,
    households,
    tags,
    loading,
    error,
    filters,
    total,
    hasMore,
    updateFilters,
    setSearchDebounced,
    setPage,
    setPageSize,
    refetch: loadGuests,
  }
}
