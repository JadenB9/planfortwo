'use client'

import { useState } from 'react'
import type {
  RsvpLookupResult,
  RsvpStatus,
  Guest,
  DietaryInfo,
  RsvpSubmission,
} from '@planfortwo/types'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

interface GuestFormState {
  guestId: string
  rsvpStatus: RsvpStatus
  mealChoice: string
  dietary: DietaryInfo
  songRequest: string
  rsvpNotes: string
  plusOneName: string
  plusOneConfirmed: boolean
  plusOneMealChoice: string
  plusOneDietary: DietaryInfo
}

function createGuestFormState(guest: Guest): GuestFormState {
  return {
    guestId: guest.id,
    rsvpStatus: guest.rsvpStatus ?? 'pending',
    mealChoice: guest.mealChoice ?? '',
    dietary: {
      vegetarian: guest.dietary?.vegetarian ?? false,
      vegan: guest.dietary?.vegan ?? false,
      glutenFree: guest.dietary?.glutenFree ?? false,
      kosher: guest.dietary?.kosher ?? false,
      halal: guest.dietary?.halal ?? false,
      allergies: guest.dietary?.allergies ?? [],
      notes: guest.dietary?.notes ?? '',
    },
    songRequest: guest.songRequest ?? '',
    rsvpNotes: guest.rsvpNotes ?? '',
    plusOneName: guest.plusOneName ?? '',
    plusOneConfirmed: guest.plusOneConfirmed ?? false,
    plusOneMealChoice: guest.plusOneMealChoice ?? '',
    plusOneDietary: {
      vegetarian: (guest.plusOneDietary as DietaryInfo)?.vegetarian ?? false,
      vegan: (guest.plusOneDietary as DietaryInfo)?.vegan ?? false,
      glutenFree: (guest.plusOneDietary as DietaryInfo)?.glutenFree ?? false,
      kosher: (guest.plusOneDietary as DietaryInfo)?.kosher ?? false,
      halal: (guest.plusOneDietary as DietaryInfo)?.halal ?? false,
      allergies: (guest.plusOneDietary as DietaryInfo)?.allergies ?? [],
      notes: (guest.plusOneDietary as DietaryInfo)?.notes ?? '',
    },
  }
}

function buildSubmission(state: GuestFormState): RsvpSubmission {
  return {
    guestId: state.guestId,
    rsvpStatus: state.rsvpStatus,
    mealChoice: state.mealChoice || null,
    dietary: state.dietary,
    songRequest: state.songRequest || null,
    rsvpNotes: state.rsvpNotes || null,
    plusOneName: state.plusOneName || null,
    plusOneConfirmed: state.plusOneConfirmed,
    plusOneMealChoice: state.plusOneMealChoice || null,
    plusOneDietary: state.plusOneDietary,
  }
}

const RSVP_OPTIONS: { value: RsvpStatus; label: string; icon: string }[] = [
  { value: 'accepted', label: 'Joyfully Accept', icon: '\u2714' },
  { value: 'declined', label: 'Respectfully Decline', icon: '\u2718' },
  { value: 'maybe', label: 'Not Sure Yet', icon: '?' },
]

const MEAL_OPTIONS = ['Chicken', 'Beef', 'Fish', 'Vegetarian', 'Vegan', 'Kids Meal']

interface RsvpFormProps {
  lookupResult: RsvpLookupResult
  onSuccess: () => void
}

export function RsvpForm({ lookupResult, onSuccess }: RsvpFormProps) {
  const isBatch = lookupResult.householdGuests.length > 1
  const guestsToRsvp = isBatch ? lookupResult.householdGuests : [lookupResult.guest]

  const [forms, setForms] = useState<GuestFormState[]>(guestsToRsvp.map(createGuestFormState))
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function updateForm(index: number, updates: Partial<GuestFormState>) {
    setForms((prev) => prev.map((f, i) => (i === index ? { ...f, ...updates } : f)))
  }

  function updateDietary(index: number, key: keyof DietaryInfo, value: unknown) {
    setForms((prev) =>
      prev.map((f, i) => (i === index ? { ...f, dietary: { ...f.dietary, [key]: value } } : f)),
    )
  }

  function updatePlusOneDietary(index: number, key: keyof DietaryInfo, value: unknown) {
    setForms((prev) =>
      prev.map((f, i) =>
        i === index ? { ...f, plusOneDietary: { ...f.plusOneDietary, [key]: value } } : f,
      ),
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const allResponded = forms.every((f) => f.rsvpStatus !== 'pending')
    if (!allResponded) {
      setError('Please select a response for each guest.')
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      const submissions = forms.map(buildSubmission)

      if (isBatch) {
        const res = await fetch(`${API_URL}/rsvp/submit-batch`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ submissions }),
        })

        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: 'Submit failed' }))
          throw new Error(err.error ?? 'Failed to submit RSVP')
        }
      } else {
        const res = await fetch(`${API_URL}/rsvp/submit`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(submissions[0]),
        })

        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: 'Submit failed' }))
          throw new Error(err.error ?? 'Failed to submit RSVP')
        }
      }

      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {forms.map((form, index) => {
        const guest = guestsToRsvp[index]!
        const showPlusOne = guest.hasPlusOne

        return (
          <div
            key={form.guestId}
            className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
          >
            {/* Guest Name */}
            <h3 className="font-serif text-xl font-semibold text-gray-900">
              {guest.firstName} {guest.lastName}
            </h3>

            {/* RSVP Status Selection */}
            <div className="mt-6">
              <p className="mb-3 text-sm font-medium text-gray-700">Your Response</p>
              <div className="grid gap-3 sm:grid-cols-3">
                {RSVP_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => updateForm(index, { rsvpStatus: opt.value })}
                    className={`rounded-xl border-2 px-4 py-3 text-sm font-medium transition-all ${
                      form.rsvpStatus === opt.value
                        ? opt.value === 'accepted'
                          ? 'border-sage-500 bg-sage-50 text-sage-700'
                          : opt.value === 'declined'
                            ? 'border-red-300 bg-red-50 text-red-700'
                            : 'border-amber-300 bg-amber-50 text-amber-700'
                        : 'border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    <span className="mr-2">{opt.icon}</span>
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Details section — only show if accepted or maybe */}
            {(form.rsvpStatus === 'accepted' || form.rsvpStatus === 'maybe') && (
              <div className="mt-6 space-y-5">
                {/* Meal Choice */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">Meal Preference</label>
                  <select
                    value={form.mealChoice}
                    onChange={(e) => updateForm(index, { mealChoice: e.target.value })}
                    className="focus:border-wedding-600 focus:ring-wedding-600/20 mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 text-sm text-gray-900 shadow-sm transition-colors focus:outline-none focus:ring-2"
                  >
                    <option value="">Select a meal...</option>
                    {MEAL_OPTIONS.map((meal) => (
                      <option key={meal} value={meal}>
                        {meal}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Dietary Restrictions */}
                <div>
                  <p className="text-sm font-medium text-gray-700">Dietary Restrictions</p>
                  <div className="mt-2 flex flex-wrap gap-3">
                    {(['vegetarian', 'vegan', 'glutenFree', 'kosher', 'halal'] as const).map(
                      (key) => (
                        <label key={key} className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={!!form.dietary[key]}
                            onChange={(e) => updateDietary(index, key, e.target.checked)}
                            className="text-wedding-600 focus:ring-wedding-600 h-4 w-4 rounded border-gray-300"
                          />
                          <span className="text-sm capitalize text-gray-700">
                            {key === 'glutenFree' ? 'Gluten Free' : key}
                          </span>
                        </label>
                      ),
                    )}
                  </div>
                  <input
                    type="text"
                    value={(form.dietary.allergies ?? []).join(', ')}
                    onChange={(e) =>
                      updateDietary(
                        index,
                        'allergies',
                        e.target.value
                          .split(',')
                          .map((s) => s.trim())
                          .filter(Boolean),
                      )
                    }
                    placeholder="Allergies (comma separated)"
                    className="focus:border-wedding-600 focus:ring-wedding-600/20 mt-2 w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm text-gray-900 shadow-sm transition-colors focus:outline-none focus:ring-2"
                  />
                </div>

                {/* Song Request */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">Song Request</label>
                  <input
                    type="text"
                    value={form.songRequest}
                    onChange={(e) => updateForm(index, { songRequest: e.target.value })}
                    placeholder="What song will get you on the dance floor?"
                    className="focus:border-wedding-600 focus:ring-wedding-600/20 mt-2 w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm text-gray-900 shadow-sm transition-colors focus:outline-none focus:ring-2"
                  />
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Additional Notes
                  </label>
                  <textarea
                    value={form.rsvpNotes}
                    onChange={(e) => updateForm(index, { rsvpNotes: e.target.value })}
                    placeholder="Anything else the couple should know?"
                    rows={3}
                    className="focus:border-wedding-600 focus:ring-wedding-600/20 mt-2 w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm text-gray-900 shadow-sm transition-colors focus:outline-none focus:ring-2"
                  />
                </div>

                {/* Plus One Section */}
                {showPlusOne && (
                  <div className="rounded-xl border border-gray-200 bg-gray-50 p-5">
                    <h4 className="font-serif text-lg font-semibold text-gray-900">Plus One</h4>

                    <div className="mt-3 space-y-4">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={form.plusOneConfirmed}
                          onChange={(e) =>
                            updateForm(index, { plusOneConfirmed: e.target.checked })
                          }
                          className="text-wedding-600 focus:ring-wedding-600 h-4 w-4 rounded border-gray-300"
                        />
                        <span className="text-sm text-gray-700">I&apos;m bringing a guest</span>
                      </label>

                      {form.plusOneConfirmed && (
                        <>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">
                              Guest Name
                            </label>
                            <input
                              type="text"
                              value={form.plusOneName}
                              onChange={(e) => updateForm(index, { plusOneName: e.target.value })}
                              placeholder="Full name"
                              className="focus:border-wedding-600 focus:ring-wedding-600/20 mt-1 w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm text-gray-900 shadow-sm transition-colors focus:outline-none focus:ring-2"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700">
                              Their Meal Preference
                            </label>
                            <select
                              value={form.plusOneMealChoice}
                              onChange={(e) =>
                                updateForm(index, { plusOneMealChoice: e.target.value })
                              }
                              className="focus:border-wedding-600 focus:ring-wedding-600/20 mt-1 w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm text-gray-900 shadow-sm transition-colors focus:outline-none focus:ring-2"
                            >
                              <option value="">Select a meal...</option>
                              {MEAL_OPTIONS.map((meal) => (
                                <option key={meal} value={meal}>
                                  {meal}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <p className="text-sm font-medium text-gray-700">
                              Their Dietary Restrictions
                            </p>
                            <div className="mt-2 flex flex-wrap gap-3">
                              {(
                                ['vegetarian', 'vegan', 'glutenFree', 'kosher', 'halal'] as const
                              ).map((key) => (
                                <label key={key} className="flex items-center gap-2">
                                  <input
                                    type="checkbox"
                                    checked={!!form.plusOneDietary[key]}
                                    onChange={(e) =>
                                      updatePlusOneDietary(index, key, e.target.checked)
                                    }
                                    className="text-wedding-600 focus:ring-wedding-600 h-4 w-4 rounded border-gray-300"
                                  />
                                  <span className="text-sm capitalize text-gray-700">
                                    {key === 'glutenFree' ? 'Gluten Free' : key}
                                  </span>
                                </label>
                              ))}
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })}

      {error && <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>}

      <button
        type="submit"
        disabled={submitting}
        className="bg-wedding-600 hover:bg-wedding-700 w-full rounded-xl px-5 py-3.5 text-base font-semibold text-white shadow-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50"
      >
        {submitting ? (
          <span className="flex items-center justify-center gap-2">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            Submitting...
          </span>
        ) : (
          'Submit RSVP'
        )}
      </button>
    </form>
  )
}
