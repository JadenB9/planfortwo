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
    <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
      <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-sage-100">
        <svg
          className="h-8 w-8 text-sage-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 13l4 4L19 7"
          />
        </svg>
      </div>

      <h2 className="font-serif text-3xl font-bold text-gray-900">Thank You!</h2>

      <p className="mt-3 text-lg text-gray-600">
        Your RSVP for{' '}
        <span className="font-semibold text-wedding-600">{lookupResult.weddingName}</span>{' '}
        has been received.
      </p>

      {weddingDate && (
        <p className="mt-2 text-sm text-gray-500">
          We look forward to celebrating on {weddingDate}
        </p>
      )}

      <div className="mt-8 rounded-xl bg-cream-50 px-6 py-4">
        <p className="text-sm text-gray-600">
          Need to make changes? You can come back to this page anytime before the deadline
          to update your response.
        </p>
      </div>
    </div>
  )
}
