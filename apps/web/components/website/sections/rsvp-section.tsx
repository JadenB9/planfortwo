'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import type { RsvpSectionContent, RsvpLookupResult } from '@planfortwo/types'
import { useTemplateStyles } from '../template-context'
import { RsvpForm } from '@/components/rsvp/rsvp-form'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

interface RsvpSectionProps {
  title: string
  content: RsvpSectionContent
  slug: string
}

type RsvpState =
  | 'search'
  | 'loading'
  | 'found'
  | 'multiple'
  | 'not-found'
  | 'success'
  | 'expired'
  | 'error'

interface StrippedGuest {
  id: string
  firstName: string
  lastName: string
  householdId: string | null
}

export function RsvpSection({ title, content, slug }: RsvpSectionProps) {
  const { colors, fontPair } = useTemplateStyles()
  const [state, setState] = useState<RsvpState>('search')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [lookupResult, setLookupResult] = useState<RsvpLookupResult | null>(null)
  const [multipleGuests, setMultipleGuests] = useState<StrippedGuest[]>([])
  const [errorMsg, setErrorMsg] = useState('')

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!firstName.trim() || !lastName.trim()) return

    setState('loading')
    setErrorMsg('')

    try {
      const res = await fetch(`${API_URL}/rsvp/lookup-by-name`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, firstName: firstName.trim(), lastName: lastName.trim() }),
      })

      if (!res.ok) {
        if (res.status === 410) {
          setState('expired')
          return
        }
        setState('not-found')
        return
      }

      const { data } = await res.json()

      if (data.type === 'single') {
        setLookupResult(data.result)
        if (data.result.isExpired) {
          setState('expired')
        } else {
          setState('found')
        }
      } else if (data.type === 'multiple') {
        setMultipleGuests(data.guests)
        setState('multiple')
      } else {
        setState('not-found')
      }
    } catch {
      setErrorMsg('Something went wrong. Please try again.')
      setState('error')
    }
  }

  const handleSelectGuest = async (guestId: string) => {
    setState('loading')
    try {
      const res = await fetch(`${API_URL}/rsvp/lookup-by-guest-id`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ guestId, slug }),
      })

      if (!res.ok) {
        setState('not-found')
        return
      }

      const { data } = await res.json()
      setLookupResult(data)
      if (data.isExpired) {
        setState('expired')
      } else {
        setState('found')
      }
    } catch {
      setErrorMsg('Something went wrong. Please try again.')
      setState('error')
    }
  }

  const handleReset = () => {
    setState('search')
    setFirstName('')
    setLastName('')
    setLookupResult(null)
    setMultipleGuests([])
    setErrorMsg('')
  }

  return (
    <section className="py-16 sm:py-24" style={{ backgroundColor: `${colors.secondary}33` }}>
      <div className="mx-auto max-w-2xl px-4">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className={`mb-4 text-center text-3xl sm:text-4xl ${fontPair.headingClass}`}
          style={{ color: colors.primary }}
        >
          {title}
        </motion.h2>

        {content.message && state === 'search' && (
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className={`mb-8 text-center ${fontPair.bodyClass}`}
            style={{ color: `${colors.primary}BB` }}
          >
            {content.message}
          </motion.p>
        )}

        {/* Search Form */}
        {state === 'search' && (
          <motion.form
            onSubmit={handleSearch}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="mx-auto max-w-md space-y-4"
          >
            <p
              className={`text-center text-sm ${fontPair.bodyClass}`}
              style={{ color: `${colors.primary}99` }}
            >
              Enter your name as it appears on your invitation
            </p>
            <div className="flex gap-3">
              <input
                type="text"
                placeholder="First Name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
                className="flex-1 rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2"
                style={{ '--tw-ring-color': colors.primary } as React.CSSProperties}
              />
              <input
                type="text"
                placeholder="Last Name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
                className="flex-1 rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2"
                style={{ '--tw-ring-color': colors.primary } as React.CSSProperties}
              />
            </div>
            <button
              type="submit"
              className="w-full rounded-full px-8 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: colors.primary }}
            >
              Find My Invitation
            </button>
          </motion.form>
        )}

        {/* Loading */}
        {state === 'loading' && (
          <div className="flex flex-col items-center py-12">
            <div
              className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200"
              style={{ borderTopColor: colors.primary }}
            />
            <p className="mt-4 text-sm text-gray-500">Looking you up...</p>
          </div>
        )}

        {/* Multiple Matches */}
        {state === 'multiple' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
            <p
              className={`text-center text-sm ${fontPair.bodyClass}`}
              style={{ color: `${colors.primary}BB` }}
            >
              We found multiple guests with that name. Please select yourself:
            </p>
            {multipleGuests.map((guest) => (
              <button
                key={guest.id}
                onClick={() => handleSelectGuest(guest.id)}
                className="w-full rounded-lg border border-gray-200 bg-white p-4 text-left transition-shadow hover:shadow-md"
              >
                <span
                  className={`font-medium ${fontPair.bodyClass}`}
                  style={{ color: colors.primary }}
                >
                  {guest.firstName} {guest.lastName}
                </span>
              </button>
            ))}
            <button
              onClick={handleReset}
              className="mx-auto block text-sm underline"
              style={{ color: `${colors.primary}99` }}
            >
              Search again
            </button>
          </motion.div>
        )}

        {/* Not Found */}
        {state === 'not-found' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
            <p className={`mb-4 ${fontPair.bodyClass}`} style={{ color: `${colors.primary}BB` }}>
              We couldn&apos;t find your name on the guest list. Please check your spelling and try
              again.
            </p>
            <button
              onClick={handleReset}
              className="rounded-full px-6 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: colors.primary }}
            >
              Try Again
            </button>
          </motion.div>
        )}

        {/* Error */}
        {state === 'error' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
            <p className="mb-4 text-sm text-red-600">{errorMsg}</p>
            <button
              onClick={handleReset}
              className="rounded-full px-6 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: colors.primary }}
            >
              Try Again
            </button>
          </motion.div>
        )}

        {/* Expired */}
        {state === 'expired' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
            <p className={`${fontPair.bodyClass}`} style={{ color: `${colors.primary}BB` }}>
              The RSVP deadline has passed. Please contact the couple directly.
            </p>
          </motion.div>
        )}

        {/* RSVP Form (found guest) */}
        {state === 'found' && lookupResult && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="mb-4 text-center">
              <p
                className={`text-sm ${fontPair.bodyClass}`}
                style={{ color: `${colors.primary}99` }}
              >
                Welcome, {lookupResult.guest.firstName}! Please complete your RSVP below.
              </p>
            </div>
            <RsvpForm
              lookupResult={lookupResult}
              onSuccess={() => setState('success')}
              showMealChoice={content.showMealChoice}
              showDietary={content.showDietary}
              showSongRequest={content.showSongRequest}
            />
          </motion.div>
        )}

        {/* Success */}
        {state === 'success' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            <div
              className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full"
              style={{ backgroundColor: `${colors.primary}20` }}
            >
              <svg
                className="h-8 w-8"
                style={{ color: colors.primary }}
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
            <h3
              className={`text-xl font-semibold ${fontPair.headingClass}`}
              style={{ color: colors.primary }}
            >
              Thank You!
            </h3>
            <p className={`mt-2 ${fontPair.bodyClass}`} style={{ color: `${colors.primary}BB` }}>
              Your RSVP has been received. We look forward to celebrating with you!
            </p>
          </motion.div>
        )}
      </div>
    </section>
  )
}
