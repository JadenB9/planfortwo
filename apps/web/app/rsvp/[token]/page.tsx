'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import type { RsvpLookupResult } from '@planfortwo/types'
import { RsvpForm } from '@/components/rsvp/rsvp-form'
import { RsvpConfirmation } from '@/components/rsvp/rsvp-confirmation'
import { RsvpExpired } from '@/components/rsvp/rsvp-expired'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

type PageState = 'loading' | 'form' | 'expired' | 'success' | 'error'

export default function RsvpTokenPage() {
  const params = useParams<{ token: string }>()
  const token = params.token

  const [state, setState] = useState<PageState>('loading')
  const [lookupResult, setLookupResult] = useState<RsvpLookupResult | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const loadRsvp = useCallback(async () => {
    if (!token) return

    try {
      const res = await fetch(`${API_URL}/rsvp/lookup?token=${encodeURIComponent(token)}`)

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Not found' }))
        throw new Error(err.error ?? 'Invitation not found')
      }

      const { data } = (await res.json()) as { data: RsvpLookupResult }
      setLookupResult(data)

      if (data.isExpired) {
        setState('expired')
      } else {
        setState('form')
      }
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Something went wrong')
      setState('error')
    }
  }, [token])

  useEffect(() => {
    void loadRsvp()
  }, [loadRsvp])

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-cream-50 to-white px-4 py-12">
      <div className="w-full max-w-lg animate-fade-in">
        {/* Loading */}
        {state === 'loading' && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-wedding-200 border-t-wedding-600" />
            <p className="mt-4 text-sm text-gray-500">Finding your invitation...</p>
          </div>
        )}

        {/* Error */}
        {state === 'error' && (
          <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
              <svg
                className="h-8 w-8 text-red-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
            <h2 className="font-serif text-2xl font-bold text-gray-900">
              Invitation Not Found
            </h2>
            <p className="mt-3 text-gray-600">
              {errorMessage ?? 'We could not find your invitation. Please check your link and try again.'}
            </p>
            <Link
              href="/rsvp"
              className="mt-6 inline-block rounded-xl bg-wedding-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-wedding-700"
            >
              Try Again
            </Link>
          </div>
        )}

        {/* Expired */}
        {state === 'expired' && lookupResult && (
          <RsvpExpired
            weddingName={lookupResult.weddingName}
            deadline={lookupResult.rsvpDeadline}
          />
        )}

        {/* RSVP Form */}
        {state === 'form' && lookupResult && (
          <div>
            {/* Header */}
            <div className="mb-8 text-center">
              <h1 className="font-serif text-3xl font-bold text-gray-900">
                {lookupResult.weddingName}
              </h1>
              {lookupResult.weddingDate && (
                <p className="mt-2 text-gray-600">
                  {new Date(lookupResult.weddingDate).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              )}
              {lookupResult.rsvpDeadline && (
                <p className="mt-1 text-sm text-gray-500">
                  Please respond by{' '}
                  {new Date(lookupResult.rsvpDeadline).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </p>
              )}
            </div>

            <RsvpForm
              lookupResult={lookupResult}
              onSuccess={() => setState('success')}
            />
          </div>
        )}

        {/* Success */}
        {state === 'success' && lookupResult && (
          <RsvpConfirmation lookupResult={lookupResult} />
        )}

        {/* Footer */}
        <p className="mt-8 text-center text-xs text-gray-400">
          Powered by PlanForTwo
        </p>
      </div>
    </main>
  )
}
