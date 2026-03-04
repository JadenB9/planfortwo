'use client'

import { useState } from 'react'
import type { GuestWithTags, Household, GuestTag, GuestSide } from '@planfortwo/types'

interface GuestFormProps {
  guest?: GuestWithTags | null
  households: Household[]
  tags: GuestTag[]
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
  mealChoice?: string | null
  dietary?: { notes?: string } | null
  tagIds?: string[]
}

export function GuestForm({ guest, households, tags, onSubmit, onClose }: GuestFormProps) {
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
    mealChoice: guest?.mealChoice ?? '',
    dietary: guest?.dietary ?? null,
    tagIds: guest?.tags.map((t) => t.id) ?? [],
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">&times;</button>
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
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-wedding-600 focus:outline-none focus:ring-2 focus:ring-wedding-600/20"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Last Name *</label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => update('lastName', e.target.value)}
                  required
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-wedding-600 focus:outline-none focus:ring-2 focus:ring-wedding-600/20"
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
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-wedding-600 focus:outline-none focus:ring-2 focus:ring-wedding-600/20"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Phone</label>
                <input
                  type="tel"
                  value={formData.phone ?? ''}
                  onChange={(e) => update('phone', e.target.value || null)}
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-wedding-600 focus:outline-none focus:ring-2 focus:ring-wedding-600/20"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Household</label>
                <select
                  value={formData.householdId ?? ''}
                  onChange={(e) => update('householdId', e.target.value || null)}
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-wedding-600 focus:outline-none focus:ring-2 focus:ring-wedding-600/20"
                >
                  <option value="">None</option>
                  {households.map((h) => (
                    <option key={h.id} value={h.id}>{h.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Side</label>
                <select
                  value={formData.side ?? ''}
                  onChange={(e) => update('side', (e.target.value as GuestSide) || null)}
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-wedding-600 focus:outline-none focus:ring-2 focus:ring-wedding-600/20"
                >
                  <option value="">Not specified</option>
                  <option value="bride">Bride</option>
                  <option value="groom">Groom</option>
                  <option value="both">Both</option>
                </select>
              </div>
            </div>

            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={formData.isChild ?? false}
                  onChange={(e) => update('isChild', e.target.checked)}
                  className="rounded border-gray-300 text-wedding-600 focus:ring-wedding-600"
                />
                Child
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={formData.isVip ?? false}
                  onChange={(e) => update('isVip', e.target.checked)}
                  className="rounded border-gray-300 text-wedding-600 focus:ring-wedding-600"
                />
                VIP
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={formData.hasPlusOne ?? false}
                  onChange={(e) => update('hasPlusOne', e.target.checked)}
                  className="rounded border-gray-300 text-wedding-600 focus:ring-wedding-600"
                />
                Has Plus-One
              </label>
            </div>

            {formData.hasPlusOne && (
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Plus-One Name</label>
                <input
                  type="text"
                  value={formData.plusOneName ?? ''}
                  onChange={(e) => update('plusOneName', e.target.value || null)}
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-wedding-600 focus:outline-none focus:ring-2 focus:ring-wedding-600/20"
                />
              </div>
            )}

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Meal Choice</label>
              <input
                type="text"
                value={formData.mealChoice ?? ''}
                onChange={(e) => update('mealChoice', e.target.value || null)}
                placeholder="e.g. Chicken, Fish, Vegetarian"
                className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-wedding-600 focus:outline-none focus:ring-2 focus:ring-wedding-600/20"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Dietary Notes</label>
              <input
                type="text"
                value={formData.dietary?.notes ?? ''}
                onChange={(e) => update('dietary', e.target.value ? { notes: e.target.value } : null)}
                placeholder="Allergies, restrictions, etc."
                className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-wedding-600 focus:outline-none focus:ring-2 focus:ring-wedding-600/20"
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
                          selected
                            ? 'ring-2 ring-offset-1'
                            : 'opacity-60 hover:opacity-100'
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
              className="rounded-xl bg-wedding-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-wedding-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? 'Saving...' : guest ? 'Update Guest' : 'Add Guest'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
