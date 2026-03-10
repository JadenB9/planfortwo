'use client'

import { useState, useRef, useEffect } from 'react'
import type { GuestWithTags, Household, GuestTag, GuestSide, RsvpStatus } from '@planfortwo/types'

interface GuestFormProps {
  guest?: GuestWithTags | null
  households: Household[]
  tags: GuestTag[]
  guests?: GuestWithTags[]
  onSubmit: (data: GuestFormData) => Promise<void>
  onClose: () => void
}

export interface GuestFormData {
  firstName: string
  lastName: string
  email?: string | null
  phone?: string | null
  householdId?: string | null
  side?: GuestSide | null
  isChild?: boolean
  isVip?: boolean
  hasPlusOne?: boolean
  plusOneName?: string | null
  dietary?: { notes?: string } | null
  tagIds?: string[]
  rsvpStatus?: RsvpStatus
}

export function GuestForm({
  guest,
  households,
  tags,
  guests = [],
  onSubmit,
  onClose,
}: GuestFormProps) {
  // Adult guests that can be selected as parents (exclude self and other children)
  const adultGuests = guests.filter((g) => !g.isChild && g.id !== guest?.id)
  const [formData, setFormData] = useState<GuestFormData>({
    firstName: guest?.firstName ?? '',
    lastName: guest?.lastName ?? '',
    email: guest?.email ?? '',
    phone: guest?.phone ?? '',
    householdId: guest?.householdId ?? '',
    side: guest?.side ?? null,
    isChild: guest?.isChild ?? false,
    isVip: guest?.isVip ?? false,
    hasPlusOne: guest?.hasPlusOne ?? false,
    plusOneName: guest?.plusOneName ?? '',
    dietary: guest?.dietary ?? null,
    tagIds: guest?.tags.map((t) => t.id) ?? [],
    rsvpStatus: guest?.rsvpStatus as RsvpStatus | undefined,
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Parent type-ahead search state
  const [parentSearch, setParentSearch] = useState(() => {
    if (guest?.isChild && guest?.householdId) {
      const parent = adultGuests.find((g) => g.householdId && g.householdId === guest.householdId)
      return parent ? `${parent.firstName} ${parent.lastName}` : ''
    }
    return ''
  })
  const [showParentDropdown, setShowParentDropdown] = useState(false)
  const [selectedParent, setSelectedParent] = useState<GuestWithTags | null>(() => {
    if (guest?.isChild && guest?.householdId) {
      return adultGuests.find((g) => g.householdId && g.householdId === guest.householdId) ?? null
    }
    return null
  })
  const parentSearchRef = useRef<HTMLDivElement>(null)

  // Close parent dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (parentSearchRef.current && !parentSearchRef.current.contains(e.target as Node)) {
        setShowParentDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  // Get children in a parent's household
  function getChildrenForParent(parent: GuestWithTags): GuestWithTags[] {
    if (!parent.householdId) return []
    return guests.filter(
      (g) => g.isChild && g.householdId === parent.householdId && g.id !== guest?.id,
    )
  }

  // Filter parents based on search
  const filteredParents = parentSearch.trim()
    ? adultGuests.filter((g) => {
        const name = `${g.firstName} ${g.lastName}`.toLowerCase()
        return name.includes(parentSearch.toLowerCase())
      })
    : adultGuests

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!formData.firstName.trim() || !formData.lastName.trim()) return
    setSubmitting(true)
    setError(null)
    try {
      await onSubmit(formData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save guest')
    } finally {
      setSubmitting(false)
    }
  }

  function update<K extends keyof GuestFormData>(key: K, value: GuestFormData[K]) {
    setFormData((prev) => ({ ...prev, [key]: value }))
  }

  function toggleTag(tagId: string) {
    setFormData((prev) => ({
      ...prev,
      tagIds: prev.tagIds?.includes(tagId)
        ? prev.tagIds.filter((id) => id !== tagId)
        : [...(prev.tagIds ?? []), tagId],
    }))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-2xl border border-gray-200 bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <h2 className="font-serif text-lg font-semibold text-gray-900">
            {guest ? 'Edit Guest' : 'Add Guest'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} className="max-h-[70vh] overflow-y-auto p-6">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">First Name *</label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => update('firstName', e.target.value)}
                  required
                  className="focus:border-wedding-600 focus:ring-wedding-600/20 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Last Name *</label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => update('lastName', e.target.value)}
                  required
                  className="focus:border-wedding-600 focus:ring-wedding-600/20 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Email</label>
                <input
                  type="email"
                  value={formData.email ?? ''}
                  onChange={(e) => update('email', e.target.value || null)}
                  className="focus:border-wedding-600 focus:ring-wedding-600/20 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Phone</label>
                <input
                  type="tel"
                  value={formData.phone ?? ''}
                  onChange={(e) => update('phone', e.target.value || null)}
                  className="focus:border-wedding-600 focus:ring-wedding-600/20 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Household</label>
                <select
                  value={formData.householdId ?? ''}
                  onChange={(e) => update('householdId', e.target.value || null)}
                  className="focus:border-wedding-600 focus:ring-wedding-600/20 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2"
                >
                  <option value="">None</option>
                  {households.map((h) => (
                    <option key={h.id} value={h.id}>
                      {h.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Side</label>
                <select
                  value={formData.side ?? ''}
                  onChange={(e) => update('side', (e.target.value as GuestSide) || null)}
                  className="focus:border-wedding-600 focus:ring-wedding-600/20 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2"
                >
                  <option value="">Not specified</option>
                  <option value="bride">Bride</option>
                  <option value="groom">Groom</option>
                  <option value="both">Both</option>
                </select>
              </div>
            </div>

            {guest && (
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  RSVP Status
                </label>
                <div className="flex flex-wrap gap-2">
                  {(['pending', 'accepted', 'maybe', 'declined'] as const).map((status) => {
                    const active = formData.rsvpStatus === status
                    const styles: Record<string, string> = {
                      accepted: active
                        ? 'bg-green-600 text-white'
                        : 'border-gray-300 text-gray-600 hover:border-green-400',
                      maybe: active
                        ? 'bg-amber-500 text-white'
                        : 'border-gray-300 text-gray-600 hover:border-amber-400',
                      declined: active
                        ? 'bg-red-600 text-white'
                        : 'border-gray-300 text-gray-600 hover:border-red-400',
                      pending: active
                        ? 'bg-gray-700 text-white'
                        : 'border-gray-300 text-gray-600 hover:border-gray-500',
                    }
                    return (
                      <button
                        key={status}
                        type="button"
                        onClick={() => update('rsvpStatus', status)}
                        className={`rounded-lg border px-3 py-1.5 text-xs font-medium capitalize transition-colors ${styles[status]}`}
                      >
                        {status}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={formData.isChild ?? false}
                  onChange={(e) => {
                    update('isChild', e.target.checked)
                    if (!e.target.checked) {
                      setSelectedParent(null)
                      setParentSearch('')
                      setShowParentDropdown(false)
                    }
                  }}
                  className="text-wedding-600 focus:ring-wedding-600 rounded border-gray-300"
                />
                Child
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={formData.isVip ?? false}
                  onChange={(e) => update('isVip', e.target.checked)}
                  className="text-wedding-600 focus:ring-wedding-600 rounded border-gray-300"
                />
                VIP
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={formData.hasPlusOne ?? false}
                  onChange={(e) => update('hasPlusOne', e.target.checked)}
                  className="text-wedding-600 focus:ring-wedding-600 rounded border-gray-300"
                />
                Has Plus-One
              </label>
            </div>

            {formData.isChild && adultGuests.length > 0 && (
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Parent</label>
                <p className="mb-1.5 text-xs text-gray-500">
                  Type a parent&apos;s name to assign this child to their family group.
                </p>
                <div ref={parentSearchRef} className="relative">
                  {selectedParent ? (
                    <div className="flex items-center gap-2 rounded-xl border border-gray-300 px-3 py-2">
                      <span className="flex-1 text-sm text-gray-900">
                        {selectedParent.firstName} {selectedParent.lastName}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedParent(null)
                          setParentSearch('')
                          // Don't clear householdId — user may want to keep the group
                        }}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        &times;
                      </button>
                    </div>
                  ) : (
                    <input
                      type="text"
                      value={parentSearch}
                      onChange={(e) => {
                        setParentSearch(e.target.value)
                        setShowParentDropdown(true)
                      }}
                      onFocus={() => setShowParentDropdown(true)}
                      placeholder="Search by parent name..."
                      className="focus:border-wedding-600 focus:ring-wedding-600/20 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2"
                    />
                  )}

                  {showParentDropdown && !selectedParent && (
                    <div className="absolute z-10 mt-1 max-h-48 w-full overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-lg">
                      {filteredParents.length === 0 ? (
                        <p className="px-3 py-2 text-xs text-gray-500">No matching parents found</p>
                      ) : (
                        filteredParents.slice(0, 15).map((g) => {
                          const children = getChildrenForParent(g)
                          const hasChildren = children.length > 0
                          const allCheckedIn =
                            hasChildren && children.every((c) => c.rsvpStatus === 'accepted')
                          const checkedInCount = children.filter(
                            (c) => c.rsvpStatus === 'accepted',
                          ).length
                          return (
                            <button
                              key={g.id}
                              type="button"
                              disabled={!g.householdId}
                              onClick={() => {
                                if (!g.householdId) return
                                setSelectedParent(g)
                                setParentSearch(`${g.firstName} ${g.lastName}`)
                                setShowParentDropdown(false)
                                update('householdId', g.householdId)
                              }}
                              className="flex w-full flex-col items-start px-3 py-2 text-left hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              <span className="text-sm font-medium text-gray-900">
                                {g.firstName} {g.lastName}
                                {!g.householdId && (
                                  <span className="ml-1 text-xs font-normal text-gray-400">
                                    (no family group)
                                  </span>
                                )}
                              </span>
                              {hasChildren && (
                                <span className="text-xs text-gray-500">
                                  {allCheckedIn
                                    ? `All ${children.length} children already registered`
                                    : checkedInCount > 0
                                      ? `${checkedInCount} of ${children.length} children registered`
                                      : `${children.length} ${children.length === 1 ? 'child' : 'children'} to register`}
                                </span>
                              )}
                            </button>
                          )
                        })
                      )}
                    </div>
                  )}
                </div>

                {/* Show children in this parent's household */}
                {selectedParent &&
                  (() => {
                    const children = getChildrenForParent(selectedParent)
                    if (children.length === 0) return null
                    const allRegistered = children.every((c) => c.rsvpStatus === 'accepted')
                    return (
                      <div className="mt-2 rounded-lg border border-gray-100 bg-gray-50 p-3">
                        <p className="mb-2 text-xs font-medium text-gray-700">
                          {allRegistered ? (
                            <span className="text-green-600">
                              All children in this family are already registered.
                            </span>
                          ) : (
                            <>Children in {selectedParent.firstName}&apos;s family:</>
                          )}
                        </p>
                        <div className="space-y-1">
                          {children.map((child) => {
                            const isRegistered = child.rsvpStatus === 'accepted'
                            return (
                              <div
                                key={child.id}
                                className="flex items-center justify-between text-xs"
                              >
                                <span className={isRegistered ? 'text-gray-500' : 'text-gray-900'}>
                                  {child.firstName} {child.lastName}
                                  {child.age != null && (
                                    <span className="ml-1 text-gray-400">(age {child.age})</span>
                                  )}
                                </span>
                                {isRegistered ? (
                                  <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700">
                                    Registered
                                  </span>
                                ) : (
                                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-700">
                                    Not registered
                                  </span>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })()}
              </div>
            )}

            {formData.hasPlusOne && (
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Plus-One Name
                </label>
                <input
                  type="text"
                  value={formData.plusOneName ?? ''}
                  onChange={(e) => update('plusOneName', e.target.value || null)}
                  className="focus:border-wedding-600 focus:ring-wedding-600/20 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2"
                />
              </div>
            )}

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Dietary Notes</label>
              <input
                type="text"
                value={formData.dietary?.notes ?? ''}
                onChange={(e) =>
                  update('dietary', e.target.value ? { notes: e.target.value } : null)
                }
                placeholder="Allergies, restrictions, etc."
                className="focus:border-wedding-600 focus:ring-wedding-600/20 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2"
              />
            </div>

            {tags.length > 0 && (
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">Tags</label>
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => {
                    const selected = formData.tagIds?.includes(tag.id)
                    return (
                      <button
                        key={tag.id}
                        type="button"
                        onClick={() => toggleTag(tag.id)}
                        className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                          selected ? 'ring-2 ring-offset-1' : 'opacity-60 hover:opacity-100'
                        }`}
                        style={{
                          backgroundColor: `${tag.color}20`,
                          color: tag.color,
                          ...(selected ? { ringColor: tag.color } : {}),
                        }}
                      >
                        {tag.name}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !formData.firstName.trim() || !formData.lastName.trim()}
              className="bg-wedding-600 hover:bg-wedding-700 rounded-xl px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? 'Saving...' : guest ? 'Update Guest' : 'Add Guest'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
