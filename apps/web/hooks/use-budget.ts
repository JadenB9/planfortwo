'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@clerk/nextjs'
import type {
  BudgetCategory,
  BudgetItemWithCategory,
  BudgetAnalytics,
  PaymentScheduleWithItem,
  TipSuggestion,
  SplitCostSummary,
} from '@planfortwo/types'
import type { BudgetItemFiltersInput } from '@planfortwo/validators'
import { api } from '@/lib/api'

interface BudgetFilterState {
  categoryId?: string
  paymentStatus?: string
  payer?: string
  search?: string
  sortBy?: string
  page?: number
  pageSize?: number
}

interface UseBudgetOptions {
  weddingId: string | null
  initialFilters?: BudgetFilterState
}

export function useBudget({ weddingId, initialFilters }: UseBudgetOptions) {
  const { getToken } = useAuth()
  const [categories, setCategories] = useState<BudgetCategory[]>([])
  const [items, setItems] = useState<BudgetItemWithCategory[]>([])
  const [itemsTotal, setItemsTotal] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [analytics, setAnalytics] = useState<BudgetAnalytics | null>(null)
  const [payments, setPayments] = useState<PaymentScheduleWithItem[]>([])
  const [tips, setTips] = useState<TipSuggestion[]>([])
  const [splits, setSplits] = useState<SplitCostSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<BudgetFilterState>(initialFilters ?? {})

  const loadData = useCallback(async () => {
    if (!weddingId) {
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const token = await getToken()
      if (!token) return

      const itemFilters: BudgetItemFiltersInput = {
        weddingId,
        categoryId: filters.categoryId,
        paymentStatus: filters.paymentStatus as BudgetItemFiltersInput['paymentStatus'],
        payer: filters.payer as BudgetItemFiltersInput['payer'],
        search: filters.search,
        sortBy: (filters.sortBy as BudgetItemFiltersInput['sortBy']) ?? 'sortOrder',
        page: filters.page ?? 1,
        pageSize: filters.pageSize ?? 20,
      }

      const [categoriesRes, itemsRes, paymentsRes] = await Promise.all([
        api.budgetCategories.list(weddingId, token),
        api.budgetItems.list(itemFilters, token),
        api.paymentSchedule.list(weddingId, token),
      ])

      setCategories(categoriesRes.data)
      setItems(itemsRes.data)
      setItemsTotal(itemsRes.total)
      setHasMore(itemsRes.hasMore)
      setPayments(paymentsRes.data)

      // Load analytics in parallel (feature-gated, may fail for free tier)
      const analyticsPromises: Promise<void>[] = []
      analyticsPromises.push(
        api.budgetAnalytics
          .getAnalytics(weddingId, token)
          .then(({ data }) => setAnalytics(data))
          .catch(() => {
            /* analytics not available on free tier */
          }),
      )
      analyticsPromises.push(
        api.budgetAnalytics
          .getTips(weddingId, token)
          .then(({ data }) => setTips(data))
          .catch(() => {
            /* tips not available on free tier */
          }),
      )
      analyticsPromises.push(
        api.budgetAnalytics
          .getSplits(weddingId, token)
          .then(({ data }) => setSplits(data))
          .catch(() => {
            /* splits not available on free tier */
          }),
      )
      await Promise.all(analyticsPromises)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load budget data')
    } finally {
      setLoading(false)
    }
  }, [weddingId, getToken, filters])

  useEffect(() => {
    void loadData()
  }, [loadData])

  const updateFilters = useCallback((newFilters: Partial<BudgetFilterState>) => {
    setFilters((prev) => ({ ...prev, ...newFilters, page: newFilters.page ?? 1 }))
  }, [])

  return {
    categories,
    items,
    itemsTotal,
    hasMore,
    analytics,
    payments,
    tips,
    splits,
    loading,
    error,
    filters,
    updateFilters,
    refetch: loadData,
  }
}
