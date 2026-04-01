'use client'

import type { RsvpLookupResult } from '@planfortwo/types'

interface RsvpConfirmationProps {
  lookupResult: RsvpLookupResult
}

export function RsvpConfirmation({ lookupResult }: RsvpConfirmationProps) {
  const weddingDate = lookupResult.weddingDate
    ? new Date(lookupResult.weddingDate).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : null

  return (
    <div className="rounded-2xl border border-border bg-white p-8 text-center shadow-sm">
      <div className="bg-sage-100 mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full">
        <svg
          className="text-sage-600 h-8 w-8"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>

      <h2 className="font-serif text-3xl font-bold text-foreground">Thank You!</h2>

      <p className="mt-3 text-lg text-muted-foreground">
        Your RSVP for{' '}
        <span className="text-wedding-600 font-semibold">{lookupResult.weddingName}</span> has been
        received.
      </p>

      {weddingDate && (
        <p className="mt-2 text-sm text-muted-foreground">
          We look forward to celebrating on {weddingDate}
        </p>
      )}

      <div className="bg-cream-50 mt-8 rounded-xl px-6 py-4">
        <p className="text-sm text-muted-foreground">
          Need to make changes? You can come back to this page anytime before the deadline to update
          your response.
        </p>
      </div>
    </div>
  )
}
