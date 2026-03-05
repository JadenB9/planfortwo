'use client'

import { useState, useCallback } from 'react'
import { useAuth } from '@clerk/nextjs'
import Link from 'next/link'
import { motion } from 'framer-motion'
import type { GuestWithTags } from '@planfortwo/types'
import { api } from '@/lib/api'
import { springSmooth } from '@/lib/animations'
import { useWedding } from '@/hooks/use-wedding'
import { useFeatures } from '@/hooks/use-features'
import { useGuests } from '@/hooks/use-guests'
import { GuestStatsBar } from '@/components/guests/guest-stats'
import { GuestFilters } from '@/components/guests/guest-filters'
import { GuestTable } from '@/components/guests/guest-table'
import { GuestDetail } from '@/components/guests/guest-detail'
import { GuestForm } from '@/components/guests/guest-form'
import { DietarySummaryCard } from '@/components/guests/dietary-summary'
import type { GuestFormData } from '@/components/guests/guest-form'

export default function GuestsPage() {
  const { getToken } = useAuth()
  const { data: weddingData, loading: weddingLoading, error: weddingError } = useWedding()
  const weddingId = weddingData?.wedding.id ?? null
  const { features, loading: featuresLoading, error: featuresError } = useFeatures(weddingId)
  const { guests, stats, households, tags, loading, filters, updateFilters, setSearchDebounced, refetch } = useGuests({ weddingId })

  const [selectedGuest, setSelectedGuest] = useState<GuestWithTags | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)

  const handleCreateGuest = useCallback(async (data: GuestFormData) => {
    if (!weddingId) return
    const token = await getToken()
    if (!token) return
    await api.guests.create(
      { weddingId, firstName: data.firstName, lastName: data.lastName, email: data.email, phone: data.phone, householdId: data.householdId, side: data.side, isChild: data.isChild ?? false, isVip: data.isVip ?? false, hasPlusOne: data.hasPlusOne ?? false, plusOneName: data.plusOneName, mealChoice: data.mealChoice, dietary: data.dietary, tagIds: data.tagIds },
      token,
    )
    setShowAddForm(false)
    await refetch()
  }, [weddingId, getToken, refetch])

  const handleUpdateGuest = useCallback(async (data: GuestFormData) => {
    if (!weddingId || !selectedGuest) return
    const token = await getToken()
    if (!token) return
    await api.guests.update(selectedGuest.id, data, weddingId, token)
    setSelectedGuest(null)
    await refetch()
  }, [weddingId, selectedGuest, getToken, refetch])

  const handleDeleteGuest = useCallback(async () => {
    if (!weddingId || !selectedGuest) return
    const token = await getToken()
    if (!token) return
    await api.guests.delete(selectedGuest.id, weddingId, token)
    setSelectedGuest(null)
    await refetch()
  }, [weddingId, selectedGuest, getToken, refetch])

  const apiError = weddingError || featuresError

  if (apiError) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="rounded-2xl border border-red-200 bg-red-50 px-8 py-6">
          <h2 className="font-serif text-xl font-semibold text-red-800">Unable to load guest list</h2>
          <p className="mt-2 text-sm text-red-600">{apiError}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 rounded-xl bg-red-600 px-5 py-2 text-sm font-semibold text-white hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (weddingLoading || featuresLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-wedding-200 border-t-wedding-600" />
      </div>
    )
  }

  const atGuestCap = features?.maxGuests !== null && features?.maxGuests !== undefined && stats !== null && stats.totalGuests >= features.maxGuests

  return (
    <motion.div
      className="mx-auto max-w-5xl"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ...springSmooth }}
    >
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold text-gray-900">Guest List</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage your guests, households, and RSVPs.
          </p>
        </div>
        <div className="flex gap-3">
          {features?.canBulkImport && (
            <Link
              href="/guests/import"
              className="rounded-xl border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              Import CSV
            </Link>
          )}
          <button
            onClick={() => setShowAddForm(true)}
            disabled={atGuestCap}
            className="rounded-xl bg-wedding-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-wedding-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Add Guest
          </button>
        </div>
      </div>

      {/* Free tier cap warning */}
      {atGuestCap && (
        <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm font-medium text-amber-800">
            You&apos;ve reached the free tier limit of {features?.maxGuests} guests.
          </p>
          <p className="mt-1 text-sm text-amber-700">
            Upgrade to the full plan to add unlimited guests, bulk import, and more.
          </p>
        </div>
      )}

      <div className="space-y-6">
        {/* Stats */}
        <GuestStatsBar stats={stats} />

        {/* Filters */}
        <GuestFilters
          filters={filters}
          tags={tags}
          onFilterChange={updateFilters}
          onSearchChange={setSearchDebounced}
        />

        {/* Table */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-wedding-200 border-t-wedding-600" />
          </div>
        ) : (
          <GuestTable guests={guests} onSelectGuest={setSelectedGuest} />
        )}

        {/* Dietary Summary */}
        {stats && stats.totalGuests > 0 && (
          <DietarySummaryCard summary={stats.dietarySummary} />
        )}
      </div>

      {/* Guest Detail Slide-over */}
      {selectedGuest && (
        <GuestDetail
          guest={selectedGuest}
          households={households}
          tags={tags}
          onUpdate={handleUpdateGuest}
          onDelete={handleDeleteGuest}
          onClose={() => setSelectedGuest(null)}
          canEdit={features?.canEditGuests ?? false}
          canDelete={features?.canDeleteGuests ?? false}
        />
      )}

      {/* Add Guest Modal */}
      {showAddForm && (
        <GuestForm
          households={households}
          tags={tags}
          onSubmit={handleCreateGuest}
          onClose={() => setShowAddForm(false)}
        />
      )}
    </motion.div>
  )
}
