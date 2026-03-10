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
  rsvpEmail: string
  dietary: DietaryInfo
  rsvpNotes: string
  plusOneName: string
  plusOneConfirmed: boolean
  plusOneDietary: DietaryInfo
}

function createGuestFormState(guest: Guest): GuestFormState {
  return {
    guestId: guest.id,
    rsvpStatus: guest.rsvpStatus ?? 'pending',
    rsvpEmail: guest.rsvpEmail ?? '',
    dietary: {
      vegetarian: guest.dietary?.vegetarian ?? false,
      vegan: guest.dietary?.vegan ?? false,
      glutenFree: guest.dietary?.glutenFree ?? false,
      kosher: guest.dietary?.kosher ?? false,
      halal: guest.dietary?.halal ?? false,
      allergies: guest.dietary?.allergies ?? [],
      notes: guest.dietary?.notes ?? '',
    },
    rsvpNotes: guest.rsvpNotes ?? '',
    plusOneName: guest.plusOneName ?? '',
    plusOneConfirmed: guest.plusOneConfirmed ?? false,
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
    rsvpEmail: state.rsvpEmail || null,
    dietary: state.dietary,
    rsvpNotes: state.rsvpNotes || null,
    plusOneName: state.plusOneName || null,
    plusOneConfirmed: state.plusOneConfirmed,
    plusOneDietary: state.plusOneDietary,
  }
}

function formatRsvpStatus(status: string): string {
  if (status === 'accepted') return 'Accepted'
  if (status === 'declined') return 'Declined'
  if (status === 'maybe') return 'Maybe'
  return 'Pending'
}

const RSVP_OPTIONS: { value: RsvpStatus; label: string; icon: string }[] = [
  { value: 'accepted', label: 'Joyfully Accept', icon: '\u2714' },
  { value: 'declined', label: 'Respectfully Decline', icon: '\u2718' },
  { value: 'maybe', label: 'Not Sure Yet', icon: '?' },
]

interface RsvpFormProps {
  lookupResult: RsvpLookupResult
  onSuccess: () => void
  showEmailField?: boolean
  showDietary?: boolean
}

export function RsvpForm({
  lookupResult,
  onSuccess,
  showEmailField = false,
  showDietary = true,
}: RsvpFormProps) {
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

      const token = lookupResult.guest.rsvpToken
      const tokenParam = token ? `?token=${encodeURIComponent(token)}` : ''

      if (isBatch) {
        const res = await fetch(`${API_URL}/rsvp/submit-batch${tokenParam}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ submissions }),
        })

        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: 'Submit failed' }))
          throw new Error(err.error ?? 'Failed to submit RSVP')
        }
      } else {
        const res = await fetch(`${API_URL}/rsvp/submit${tokenParam}`, {
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

  const alreadyResponded = guestsToRsvp.filter((g) => g.rsvpRespondedAt)

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Household status banner */}
      {isBatch && (
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
          <p className="text-sm font-medium text-gray-700">
            RSVPing for the {lookupResult.household?.name || 'Family'} household
          </p>
          <p className="mt-0.5 text-xs text-gray-500">
            {guestsToRsvp.length} family member{guestsToRsvp.length !== 1 ? 's' : ''}
          </p>
          {alreadyResponded.length > 0 && (
            <p className="mt-1 text-xs text-gray-500">
              {alreadyResponded.length} of {guestsToRsvp.length} member
              {alreadyResponded.length !== 1 ? 's have' : ' has'} previously responded. You can
              update any responses below.
            </p>
          )}
        </div>
      )}

      {forms.map((form, index) => {
        const guest = guestsToRsvp[index]!
        const isChild = guest.isChild
        const showPlusOne = guest.hasPlusOne && !isChild

        return (
          <div
            key={form.guestId}
            className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
          >
            <h3 className="font-serif text-xl font-semibold text-gray-900">
              {guest.firstName} {guest.lastName}
              {isChild && <span className="ml-2 text-xs font-normal text-gray-400">(child)</span>}
            </h3>
            {guest.rsvpRespondedAt && (
              <p className="mt-1 text-xs text-gray-500">
                Previously responded: {formatRsvpStatus(guest.rsvpStatus ?? 'pending')}
              </p>
            )}

            <div className="mt-6">
              <p className="mb-3 text-sm font-medium text-gray-700">
                {isChild ? 'Will they be attending?' : 'Your Response'}
              </p>
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

            {(form.rsvpStatus === 'accepted' || form.rsvpStatus === 'maybe') && (
              <div className="mt-6 space-y-5">
                {showEmailField && !isChild && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Email Address (preferred)
                    </label>
                    <input
                      type="email"
                      value={form.rsvpEmail}
                      onChange={(e) => updateForm(index, { rsvpEmail: e.target.value })}
                      placeholder="your@email.com"
                      className="focus:border-wedding-600 focus:ring-wedding-600/20 mt-2 w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm text-gray-900 shadow-sm transition-colors focus:outline-none focus:ring-2"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      So the couple can keep in touch with updates.
                    </p>
                  </div>
                )}

                {showDietary && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      {isChild ? 'Allergies' : 'Allergies'}{' '}
                      <span className="font-normal text-gray-400">(leave blank for none)</span>
                    </label>
                    <input
                      type="text"
                      value={form.dietary.notes ?? ''}
                      onChange={(e) => updateDietary(index, 'notes', e.target.value)}
                      placeholder="e.g. peanuts, shellfish, dairy..."
                      className="focus:border-wedding-600 focus:ring-wedding-600/20 mt-2 w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm text-gray-900 shadow-sm transition-colors focus:outline-none focus:ring-2"
                    />
                  </div>
                )}

                {!isChild && (
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
                )}

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

                          {showDietary && (
                            <div>
                              <label className="block text-sm font-medium text-gray-700">
                                Their Allergies{' '}
                                <span className="font-normal text-gray-400">
                                  (leave blank for none)
                                </span>
                              </label>
                              <input
                                type="text"
                                value={form.plusOneDietary.notes ?? ''}
                                onChange={(e) =>
                                  updatePlusOneDietary(index, 'notes', e.target.value)
                                }
                                placeholder="e.g. peanuts, shellfish, dairy..."
                                className="focus:border-wedding-600 focus:ring-wedding-600/20 mt-2 w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm text-gray-900 shadow-sm transition-colors focus:outline-none focus:ring-2"
                              />
                            </div>
                          )}
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
