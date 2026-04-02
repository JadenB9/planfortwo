'use client'

import { useState } from 'react'
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
  newHouseholdName?: string
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
  const [creatingNewHousehold, setCreatingNewHousehold] = useState(false)
  const [newHouseholdName, setNewHouseholdName] = useState('')

  function getHouseholdMembers(householdId: string): GuestWithTags[] {
    return guests.filter((g) => g.householdId === householdId && g.id !== guest?.id)
  }

  function getHouseholdDisplay(h: Household): string {
    const adults = guests.filter((g) => g.householdId === h.id && !g.isChild && g.id !== guest?.id)
    if (adults.length > 0) {
      const names = adults.map((g) => `${g.firstName} ${g.lastName}`).join(' & ')
      return `${h.name} (${names})`
    }
    return h.name
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!formData.firstName.trim() || !formData.lastName.trim()) return
    setSubmitting(true)
    setError(null)
    try {
      const submitData = { ...formData }
      if (creatingNewHousehold && newHouseholdName.trim()) {
        submitData.newHouseholdName = newHouseholdName.trim()
        submitData.householdId = null
      }
      await onSubmit(submitData)
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

  const inputClass =
    'focus:border-wedding-600 focus:ring-wedding-600/20 w-full rounded-xl border border-border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="border-border bg-background w-full max-w-lg rounded-2xl border shadow-xl">
        <div className="border-border flex items-center justify-between border-b px-6 py-4">
          <h2 className="text-foreground font-serif text-lg font-semibold">
            {guest ? 'Edit Guest' : 'Add Guest'}
          </h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-muted-foreground">
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} className="max-h-[70vh] overflow-y-auto p-6">
          <div className="space-y-4">
            {/* Name */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-foreground mb-1 block text-sm font-medium">
                  First Name *
                </label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => update('firstName', e.target.value)}
                  required
                  className={inputClass}
                />
              </div>
              <div>
                <label className="text-foreground mb-1 block text-sm font-medium">
                  Last Name *
                </label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => update('lastName', e.target.value)}
                  required
                  className={inputClass}
                />
              </div>
            </div>

            {/* Email / Phone */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-foreground mb-1 block text-sm font-medium">Email</label>
                <input
                  type="email"
                  value={formData.email ?? ''}
                  onChange={(e) => update('email', e.target.value || null)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="text-foreground mb-1 block text-sm font-medium">Phone</label>
                <input
                  type="tel"
                  value={formData.phone ?? ''}
                  onChange={(e) => update('phone', e.target.value || null)}
                  className={inputClass}
                />
              </div>
            </div>

            {/* Household (adults) + Side */}
            <div className="grid grid-cols-2 gap-4">
              {!formData.isChild ? (
                <div>
                  <label className="text-foreground mb-1 block text-sm font-medium">
                    Household
                  </label>
                  {creatingNewHousehold ? (
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={newHouseholdName}
                        onChange={(e) => setNewHouseholdName(e.target.value)}
                        placeholder="Family name (e.g., McDermott)"
                        className={inputClass}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setCreatingNewHousehold(false)
                          setNewHouseholdName('')
                        }}
                        className="text-muted-foreground hover:text-foreground text-xs"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <select
                        value={formData.householdId ?? ''}
                        onChange={(e) => {
                          if (e.target.value === '__new__') {
                            setCreatingNewHousehold(true)
                            setNewHouseholdName(formData.lastName || '')
                            update('householdId', null)
                          } else {
                            update('householdId', e.target.value || null)
                          }
                        }}
                        className={inputClass}
                      >
                        <option value="">None</option>
                        {households.map((h) => (
                          <option key={h.id} value={h.id}>
                            {getHouseholdDisplay(h)}
                          </option>
                        ))}
                        <option value="__new__">+ Create New Family</option>
                      </select>
                      {formData.householdId &&
                        (() => {
                          const members = getHouseholdMembers(formData.householdId)
                          if (members.length === 0) return null
                          return (
                            <p className="text-muted-foreground text-xs">
                              Members:{' '}
                              {members.map((g) => `${g.firstName} ${g.lastName}`).join(', ')}
                            </p>
                          )
                        })()}
                    </div>
                  )}
                </div>
              ) : (
                <div />
              )}
              <div>
                <label className="text-foreground mb-1 block text-sm font-medium">Side</label>
                <select
                  value={formData.side ?? ''}
                  onChange={(e) => update('side', (e.target.value as GuestSide) || null)}
                  className={inputClass}
                >
                  <option value="">Not specified</option>
                  <option value="bride">Bride</option>
                  <option value="groom">Groom</option>
                  <option value="both">Both</option>
                </select>
              </div>
            </div>

            {/* RSVP Status (edit only) */}
            {guest && (
              <div>
                <label className="text-foreground mb-1 block text-sm font-medium">
                  RSVP Status
                </label>
                <div className="flex flex-wrap gap-2">
                  {(['pending', 'accepted', 'maybe', 'declined'] as const).map((status) => {
                    const active = formData.rsvpStatus === status
                    const styles: Record<string, string> = {
                      accepted: active
                        ? 'bg-green-600 text-white'
                        : 'border-border text-muted-foreground hover:border-green-400',
                      maybe: active
                        ? 'bg-amber-500 text-white'
                        : 'border-border text-muted-foreground hover:border-amber-400',
                      declined: active
                        ? 'bg-red-600 text-white'
                        : 'border-border text-muted-foreground hover:border-red-400',
                      pending: active
                        ? 'bg-gray-700 text-white'
                        : 'border-border text-muted-foreground hover:border-border',
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

            {/* Checkboxes */}
            <div className="flex flex-wrap gap-4">
              <label className="text-foreground flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={formData.isChild ?? false}
                  onChange={(e) => {
                    update('isChild', e.target.checked)
                    if (e.target.checked) {
                      setCreatingNewHousehold(false)
                      setNewHouseholdName('')
                    }
                  }}
                  className="text-wedding-600 focus:ring-wedding-600 border-border rounded"
                />
                Child
              </label>
              <label className="text-foreground flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={formData.isVip ?? false}
                  onChange={(e) => update('isVip', e.target.checked)}
                  className="text-wedding-600 focus:ring-wedding-600 border-border rounded"
                />
                VIP
              </label>
              <label className="text-foreground flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={formData.hasPlusOne ?? false}
                  onChange={(e) => update('hasPlusOne', e.target.checked)}
                  className="text-wedding-600 focus:ring-wedding-600 border-border rounded"
                />
                Has Plus-One
              </label>
            </div>

            {/* Family selector (children only) */}
            {formData.isChild && (
              <div>
                <label className="text-foreground mb-1 block text-sm font-medium">Family</label>
                <p className="text-muted-foreground mb-1.5 text-xs">
                  Select the household this child belongs to.
                </p>
                {households.length === 0 ? (
                  <p className="rounded-lg border border-amber-100 bg-amber-50 px-3 py-2 text-xs text-amber-700">
                    No families created yet. Add the parents first and assign them to a household.
                  </p>
                ) : (
                  <select
                    value={formData.householdId ?? ''}
                    onChange={(e) => update('householdId', e.target.value || null)}
                    className={inputClass}
                  >
                    <option value="">Select a family...</option>
                    {households.map((h) => {
                      const adults = guests.filter(
                        (g) => g.householdId === h.id && !g.isChild && g.id !== guest?.id,
                      )
                      const adultNames = adults
                        .map((g) => `${g.firstName} ${g.lastName}`)
                        .join(' & ')
                      return (
                        <option key={h.id} value={h.id}>
                          {adultNames ? `${adultNames} — ${h.name}` : h.name}
                        </option>
                      )
                    })}
                  </select>
                )}
                {formData.householdId &&
                  (() => {
                    const members = getHouseholdMembers(formData.householdId)
                    if (members.length === 0) return null
                    return (
                      <div className="border-border bg-muted mt-2 rounded-lg border p-3">
                        <p className="text-foreground mb-2 text-xs font-medium">Family members:</p>
                        <div className="space-y-1">
                          {members.map((m) => (
                            <div key={m.id} className="flex items-center justify-between text-xs">
                              <span className="text-foreground">
                                {m.firstName} {m.lastName}
                                {m.isChild && m.age != null && (
                                  <span className="text-muted-foreground ml-1">(age {m.age})</span>
                                )}
                              </span>
                              <span
                                className={`rounded-full px-2 py-0.5 text-xs ${
                                  m.isChild
                                    ? 'bg-blue-100 text-blue-700'
                                    : 'bg-muted text-muted-foreground'
                                }`}
                              >
                                {m.isChild ? 'Child' : 'Adult'}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })()}
              </div>
            )}

            {/* Plus-One Name */}
            {formData.hasPlusOne && (
              <div>
                <label className="text-foreground mb-1 block text-sm font-medium">
                  Plus-One Name
                </label>
                <input
                  type="text"
                  value={formData.plusOneName ?? ''}
                  onChange={(e) => update('plusOneName', e.target.value || null)}
                  className={inputClass}
                />
              </div>
            )}

            {/* Dietary Notes */}
            <div>
              <label className="text-foreground mb-1 block text-sm font-medium">
                Dietary Notes
              </label>
              <input
                type="text"
                value={formData.dietary?.notes ?? ''}
                onChange={(e) =>
                  update('dietary', e.target.value ? { notes: e.target.value } : null)
                }
                placeholder="Allergies, restrictions, etc."
                className={inputClass}
              />
            </div>

            {/* Tags */}
            {tags.length > 0 && (
              <div>
                <label className="text-foreground mb-2 block text-sm font-medium">Tags</label>
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
              className="border-border text-foreground hover:bg-muted rounded-xl border px-4 py-2 text-sm font-medium"
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
