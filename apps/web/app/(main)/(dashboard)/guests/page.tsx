'use client'

import { useState, useCallback, Suspense } from 'react'
import { useAuth } from '@clerk/nextjs'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { ChevronLeft, ChevronRight, Send } from 'lucide-react'
import type { GuestWithTags, RsvpStatus } from '@planfortwo/types'
import { api } from '@/lib/api'
import { springSmooth } from '@/lib/animations'
import { useWedding } from '@/hooks/use-wedding'
import { useGuests } from '@/hooks/use-guests'
import { GuestStatsBar } from '@/components/guests/guest-stats'
import { GuestFilters } from '@/components/guests/guest-filters'
import { GuestTable } from '@/components/guests/guest-table'
import { GuestDetail } from '@/components/guests/guest-detail'
import { GuestForm } from '@/components/guests/guest-form'
import { DietarySummaryCard } from '@/components/guests/dietary-summary'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import type { GuestFormData } from '@/components/guests/guest-form'
import { useTabParam } from '@/hooks/use-tab-param'

type GuestsTab = 'guests' | 'allergies'
const VALID_GUESTS_TABS: GuestsTab[] = ['guests', 'allergies']

export default function GuestsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-20">
          <div className="border-wedding-200 border-t-wedding-600 h-8 w-8 animate-spin rounded-full border-4" />
        </div>
      }
    >
      <GuestsPageInner />
    </Suspense>
  )
}

function GuestsPageInner() {
  const { getToken } = useAuth()
  const { data: weddingData, features, loading: weddingLoading, error: weddingError } = useWedding()
  const weddingId = weddingData?.wedding.id ?? null
  const {
    guests,
    stats,
    households,
    tags,
    loading,
    filters,
    total,
    updateFilters,
    setSearchDebounced,
    setPage,
    setPageSize,
    refetch,
  } = useGuests({ weddingId })

  const [selectedGuest, setSelectedGuest] = useState<GuestWithTags | null>(null)
  const [editingGuest, setEditingGuest] = useState<GuestWithTags | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [sendingInviteId, setSendingInviteId] = useState<string | null>(null)
  const [deletingGuestId, setDeletingGuestId] = useState<string | null>(null)
  const [sendingBulk, setSendingBulk] = useState(false)
  const [showBulkInviteConfirm, setShowBulkInviteConfirm] = useState(false)
  const [activeTab, setActiveTab] = useTabParam<GuestsTab>('tab', 'guests', VALID_GUESTS_TABS)

  const handleCreateGuest = useCallback(
    async (data: GuestFormData) => {
      if (!weddingId) return
      const token = await getToken()
      if (!token) return

      let householdId = data.householdId || null

      if (data.newHouseholdName) {
        const { data: newHousehold } = await api.households.create(
          { weddingId, name: data.newHouseholdName },
          token,
        )
        householdId = newHousehold.id
      }

      await api.guests.create(
        {
          weddingId,
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email || null,
          phone: data.phone || null,
          householdId,
          side: data.side || null,
          isChild: data.isChild ?? false,
          isVip: data.isVip ?? false,
          hasPlusOne: data.hasPlusOne ?? false,
          plusOneName: data.plusOneName || null,
          dietary: data.dietary,
          tagIds: data.tagIds,
        },
        token,
      )
      setShowAddForm(false)
      toast.success('Guest added')
      await refetch()
    },
    [weddingId, getToken, refetch],
  )

  const doUpdateGuest = useCallback(
    async (guestId: string, data: GuestFormData) => {
      if (!weddingId) return
      const token = await getToken()
      if (!token) return

      let householdId = data.householdId || null

      if (data.newHouseholdName) {
        const { data: newHousehold } = await api.households.create(
          { weddingId, name: data.newHouseholdName },
          token,
        )
        householdId = newHousehold.id
      }

      await api.guests.update(
        guestId,
        {
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email || null,
          phone: data.phone || null,
          householdId,
          side: data.side || null,
          isChild: data.isChild ?? false,
          isVip: data.isVip ?? false,
          hasPlusOne: data.hasPlusOne ?? false,
          plusOneName: data.plusOneName || null,
          dietary: data.dietary,
          tagIds: data.tagIds,
          ...(data.rsvpStatus ? { rsvpStatus: data.rsvpStatus } : {}),
        },
        weddingId,
        token,
      )
      toast.success('Guest updated')
      await refetch()
    },
    [weddingId, getToken, refetch],
  )

  const handleUpdateGuest = useCallback(
    async (data: GuestFormData) => {
      if (!selectedGuest) return
      await doUpdateGuest(selectedGuest.id, data)
      setSelectedGuest(null)
    },
    [selectedGuest, doUpdateGuest],
  )

  const handleEditGuest = useCallback(
    async (data: GuestFormData) => {
      if (!editingGuest) return
      await doUpdateGuest(editingGuest.id, data)
      setEditingGuest(null)
    },
    [editingGuest, doUpdateGuest],
  )

  const handleDeleteGuest = useCallback(async () => {
    if (!weddingId || !selectedGuest) return
    const token = await getToken()
    if (!token) return
    await api.guests.delete(selectedGuest.id, weddingId, token)
    setSelectedGuest(null)
    toast.success('Guest removed')
    await refetch()
  }, [weddingId, selectedGuest, getToken, refetch])

  const handleRsvpChange = useCallback(
    async (status: RsvpStatus) => {
      if (!weddingId || !selectedGuest) return
      const token = await getToken()
      if (!token) return
      await api.guests.update(selectedGuest.id, { rsvpStatus: status }, weddingId, token)
      toast.success(`RSVP updated to ${status}`)
      await refetch()
    },
    [weddingId, selectedGuest, getToken, refetch],
  )

  const handleDeleteGuestInline = useCallback(
    async (guest: GuestWithTags) => {
      if (!weddingId) return
      setDeletingGuestId(guest.id)
      try {
        const token = await getToken()
        if (!token) return
        await api.guests.delete(guest.id, weddingId, token)
        toast.success(`${guest.firstName} ${guest.lastName} removed`)
        await refetch()
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed to remove guest')
      } finally {
        setDeletingGuestId(null)
      }
    },
    [weddingId, getToken, refetch],
  )

  const handleSendInvite = useCallback(
    async (guest: GuestWithTags) => {
      if (!weddingId) return
      setSendingInviteId(guest.id)
      try {
        const token = await getToken()
        if (!token) return
        await api.guests.sendInvite(guest.id, weddingId, token)
        toast.success(`Invitation sent to ${guest.firstName} ${guest.lastName}`)
        await refetch()
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed to send invitation')
      } finally {
        setSendingInviteId(null)
      }
    },
    [weddingId, getToken, refetch],
  )

  const handleSendAllInvites = useCallback(async () => {
    if (!weddingId) return
    setSendingBulk(true)
    try {
      const token = await getToken()
      if (!token) return
      const { data } = await api.guests.sendInvites(weddingId, token)
      if (data.sent === 0 && data.total === 0) {
        toast.info('No uninvited guests with email addresses found')
      } else {
        toast.success(
          `Sent ${data.sent} invitation${data.sent !== 1 ? 's' : ''}${data.failed > 0 ? ` (${data.failed} failed)` : ''}`,
        )
      }
      await refetch()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to send invitations')
    } finally {
      setSendingBulk(false)
    }
  }, [weddingId, getToken, refetch])

  const apiError = weddingError

  if (apiError) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="rounded-2xl border border-red-200 bg-red-50 px-8 py-6">
          <h2 className="font-serif text-xl font-semibold text-red-800">
            Unable to load guest list
          </h2>
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

  if (weddingLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="border-wedding-200 border-t-wedding-600 h-8 w-8 animate-spin rounded-full border-4" />
      </div>
    )
  }

  const atGuestCap =
    features?.maxGuests !== null &&
    features?.maxGuests !== undefined &&
    stats !== null &&
    stats.totalGuests >= features.maxGuests

  const uninvitedWithEmail = guests.filter((g) => g.email && !g.inviteSentAt)

  const currentPage = filters.page ?? 1
  const currentPageSize = filters.pageSize ?? 10
  const totalPages = Math.max(1, Math.ceil(total / currentPageSize))
  const showingFrom = total === 0 ? 0 : (currentPage - 1) * currentPageSize + 1
  const showingTo = Math.min(currentPage * currentPageSize, total)

  const paginationControls = (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="text-muted-foreground flex items-center gap-2 text-sm">
        <span>Show</span>
        <select
          value={currentPageSize}
          onChange={(e) => setPageSize(Number(e.target.value))}
          className="focus:border-wedding-600 focus:ring-wedding-600/20 border-border rounded-lg border px-2 py-1 text-sm focus:outline-none focus:ring-2"
        >
          <option value={10}>10</option>
          <option value={25}>25</option>
          <option value={50}>50</option>
          <option value={100}>100</option>
          <option value={200}>200</option>
        </select>
        <span>per page</span>
        {total > 0 && (
          <span className="text-muted-foreground ml-2">
            {showingFrom}–{showingTo} of {total}
          </span>
        )}
      </div>
      {totalPages > 1 && (
        <div className="flex items-center gap-1">
          <button
            onClick={() => setPage(currentPage - 1)}
            disabled={currentPage <= 1}
            className="border-border text-muted-foreground hover:bg-muted rounded-lg border p-1.5 transition-colors disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
            .reduce<(number | 'ellipsis')[]>((acc, p, idx, arr) => {
              if (idx > 0 && p - (arr[idx - 1] ?? 0) > 1) acc.push('ellipsis')
              acc.push(p)
              return acc
            }, [])
            .map((item, idx) =>
              item === 'ellipsis' ? (
                <span key={`e-${idx}`} className="text-muted-foreground px-1 text-sm">
                  ...
                </span>
              ) : (
                <button
                  key={item}
                  onClick={() => setPage(item)}
                  className={`min-w-[2rem] rounded-lg px-2 py-1 text-sm font-medium transition-colors ${
                    item === currentPage
                      ? 'bg-wedding-600 text-white'
                      : 'border-border text-foreground hover:bg-muted border'
                  }`}
                >
                  {item}
                </button>
              ),
            )}
          <button
            onClick={() => setPage(currentPage + 1)}
            disabled={currentPage >= totalPages}
            className="border-border text-muted-foreground hover:bg-muted rounded-lg border p-1.5 transition-colors disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  )

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
          <h1 className="text-foreground font-serif text-3xl font-bold">Guest List</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Manage your guests, households, and RSVPs.
          </p>
        </div>
        <div className="flex gap-3">
          {uninvitedWithEmail.length > 0 && (
            <button
              onClick={() => setShowBulkInviteConfirm(true)}
              disabled={sendingBulk}
              className="border-border text-foreground hover:bg-muted flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
              {sendingBulk ? 'Sending...' : `Send All Invites (${uninvitedWithEmail.length})`}
            </button>
          )}
          {features?.canBulkImport && (
            <Link
              href="/guests/import"
              className="border-border text-foreground hover:bg-muted rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors"
            >
              Import CSV
            </Link>
          )}
          <button
            onClick={() => setShowAddForm(true)}
            disabled={atGuestCap}
            className="bg-wedding-600 hover:bg-wedding-700 rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50"
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

        {/* Tabs */}
        <div className="border-border flex gap-1 border-b">
          <button
            onClick={() => setActiveTab('guests')}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === 'guests'
                ? 'border-wedding-600 text-wedding-700 border-b-2'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Guests
          </button>
          <button
            onClick={() => setActiveTab('allergies')}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === 'allergies'
                ? 'border-wedding-600 text-wedding-700 border-b-2'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Allergies
          </button>
        </div>

        {activeTab === 'guests' && (
          <>
            {/* Filters */}
            <GuestFilters
              filters={filters}
              tags={tags}
              onFilterChange={updateFilters}
              onSearchChange={setSearchDebounced}
            />

            {/* Pagination (top) */}
            {!loading && total > 0 && paginationControls}

            {/* Table */}
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="border-wedding-200 border-t-wedding-600 h-8 w-8 animate-spin rounded-full border-4" />
              </div>
            ) : (
              <GuestTable
                guests={guests}
                onSelectGuest={setSelectedGuest}
                onEditGuest={setEditingGuest}
                onDeleteGuest={handleDeleteGuestInline}
                onSendInvite={handleSendInvite}
                sendingInviteId={sendingInviteId}
                deletingGuestId={deletingGuestId}
              />
            )}

            {/* Pagination (bottom) */}
            {!loading && total > 0 && paginationControls}

            {/* Dietary Summary */}
            {stats && stats.totalGuests > 0 && (
              <DietarySummaryCard summary={stats.dietarySummary} />
            )}
          </>
        )}

        {activeTab === 'allergies' && (
          <div className="border-border bg-background rounded-2xl border shadow-sm">
            <div className="border-border border-b px-5 py-3">
              <h3 className="text-foreground font-serif text-sm font-semibold">Guest Allergies</h3>
              <p className="text-muted-foreground mt-0.5 text-xs">
                Guests with reported allergies or dietary notes
              </p>
            </div>
            {(() => {
              const guestsWithAllergies = guests.filter((g) => {
                const d = g.dietary as Record<string, unknown> | null
                if (!d) return false
                const hasNotes = typeof d.notes === 'string' && d.notes.trim().length > 0
                const hasAllergies = Array.isArray(d.allergies) && d.allergies.length > 0
                return hasNotes || hasAllergies
              })

              if (loading) {
                return (
                  <div className="flex items-center justify-center py-12">
                    <div className="border-wedding-200 border-t-wedding-600 h-8 w-8 animate-spin rounded-full border-4" />
                  </div>
                )
              }

              if (guestsWithAllergies.length === 0) {
                return (
                  <div className="px-5 py-8 text-center">
                    <p className="text-muted-foreground text-sm">No allergies reported yet.</p>
                  </div>
                )
              }

              return (
                <div className="divide-border divide-y">
                  {guestsWithAllergies.map((g) => {
                    const d = g.dietary as Record<string, unknown>
                    const notes =
                      typeof d.notes === 'string' && d.notes.trim() ? d.notes.trim() : null
                    const allergies =
                      Array.isArray(d.allergies) && d.allergies.length > 0
                        ? (d.allergies as string[]).join(', ')
                        : null
                    return (
                      <div key={g.id} className="flex items-center justify-between px-5 py-3">
                        <span className="text-foreground text-sm font-medium">
                          {g.firstName} {g.lastName}
                        </span>
                        <span className="text-muted-foreground max-w-[60%] text-right text-sm">
                          {notes ?? allergies}
                        </span>
                      </div>
                    )
                  })}
                </div>
              )
            })()}
          </div>
        )}
      </div>

      {/* Guest Detail Slide-over */}
      {selectedGuest && (
        <GuestDetail
          guest={selectedGuest}
          households={households}
          tags={tags}
          guests={guests}
          onUpdate={handleUpdateGuest}
          onRsvpChange={handleRsvpChange}
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
          guests={guests}
          onSubmit={handleCreateGuest}
          onClose={() => setShowAddForm(false)}
        />
      )}

      {/* Edit Guest Modal */}
      {editingGuest && (
        <GuestForm
          guest={editingGuest}
          households={households}
          tags={tags}
          guests={guests}
          onSubmit={handleEditGuest}
          onClose={() => setEditingGuest(null)}
        />
      )}

      {/* Bulk invite confirmation */}
      <ConfirmDialog
        open={showBulkInviteConfirm}
        onOpenChange={setShowBulkInviteConfirm}
        title="Send RSVP Invitations"
        description={`Send RSVP invitations to ${uninvitedWithEmail.length} guest${uninvitedWithEmail.length !== 1 ? 's' : ''}? This will email each guest a personalized RSVP link.`}
        confirmLabel="Send Invitations"
        variant="default"
        onConfirm={() => void handleSendAllInvites()}
      />
    </motion.div>
  )
}
