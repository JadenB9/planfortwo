'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Guest, RsvpLookupResult } from '@planfortwo/types'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

type Tab = 'code' | 'name'

export function RsvpEntry() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<Tab>('code')

  // Code lookup state
  const [code, setCode] = useState('')
  const [codeLoading, setCodeLoading] = useState(false)
  const [codeError, setCodeError] = useState<string | null>(null)

  // Name lookup state
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [slug, setSlug] = useState('')
  const [nameLoading, setNameLoading] = useState(false)
  const [nameError, setNameError] = useState<string | null>(null)
  const [nameResults, setNameResults] = useState<Guest[] | null>(null)

  async function handleCodeSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!code.trim()) return

    setCodeLoading(true)
    setCodeError(null)

    try {
      const res = await fetch(`${API_URL}/rsvp/lookup?code=${encodeURIComponent(code.trim())}`)

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Not found' }))
        throw new Error(err.error ?? 'Could not find your invitation')
      }

      const { data } = (await res.json()) as { data: RsvpLookupResult }

      if (data.guest.rsvpToken) {
        router.push(`/rsvp/${data.guest.rsvpToken}`)
      } else {
        throw new Error('No RSVP token found for this guest')
      }
    } catch (err) {
      setCodeError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setCodeLoading(false)
    }
  }

  async function handleNameSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!firstName.trim() || !lastName.trim() || !slug.trim()) return

    setNameLoading(true)
    setNameError(null)
    setNameResults(null)

    try {
      const res = await fetch(`${API_URL}/rsvp/lookup-by-name`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug: slug.trim(),
          firstName: firstName.trim(),
          lastName: lastName.trim(),
        }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Search failed' }))
        throw new Error(err.error ?? 'Search failed')
      }

      const { data } = (await res.json()) as { data: Guest[] }

      if (data.length === 0) {
        setNameError('No guests found with that name. Please check your spelling and try again.')
      } else {
        setNameResults(data)
      }
    } catch (err) {
      setNameError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setNameLoading(false)
    }
  }

  function handleGuestSelect(guest: Guest) {
    if (guest.rsvpToken) {
      router.push(`/rsvp/${guest.rsvpToken}`)
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-white p-8 shadow-sm">
      {/* Tab Switcher */}
      <div className="mb-8 flex rounded-xl bg-muted p-1">
        <button
          onClick={() => {
            setActiveTab('code')
            setNameResults(null)
            setNameError(null)
          }}
          className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
            activeTab === 'code'
              ? 'bg-white text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          I Have a Code
        </button>
        <button
          onClick={() => {
            setActiveTab('name')
            setCodeError(null)
          }}
          className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
            activeTab === 'name'
              ? 'bg-white text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Find My Name
        </button>
      </div>

      {/* Code Lookup */}
      {activeTab === 'code' && (
        <form onSubmit={handleCodeSubmit} className="space-y-4">
          <div>
            <label htmlFor="rsvp-code" className="block text-sm font-medium text-foreground">
              RSVP Code
            </label>
            <p className="mt-1 text-xs text-muted-foreground">Enter the code from your invitation</p>
            <input
              id="rsvp-code"
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="e.g. SMITH2025"
              className="focus:border-wedding-600 focus:ring-wedding-600/20 mt-2 w-full rounded-xl border border-border px-4 py-3 text-center text-lg tracking-wider text-foreground shadow-sm transition-colors focus:outline-none focus:ring-2"
              autoComplete="off"
            />
          </div>

          {codeError && (
            <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{codeError}</p>
          )}

          <button
            type="submit"
            disabled={!code.trim() || codeLoading}
            className="bg-wedding-600 hover:bg-wedding-700 w-full rounded-xl px-5 py-3 text-sm font-semibold text-white shadow-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50"
          >
            {codeLoading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Looking up...
              </span>
            ) : (
              'Find My Invitation'
            )}
          </button>
        </form>
      )}

      {/* Name Lookup */}
      {activeTab === 'name' && (
        <form onSubmit={handleNameSubmit} className="space-y-4">
          <div>
            <label htmlFor="rsvp-slug" className="block text-sm font-medium text-foreground">
              Wedding Website URL
            </label>
            <p className="mt-1 text-xs text-muted-foreground">
              The couple&apos;s wedding website name (e.g. &quot;smith-jones&quot;)
            </p>
            <input
              id="rsvp-slug"
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="e.g. smith-jones"
              className="focus:border-wedding-600 focus:ring-wedding-600/20 mt-2 w-full rounded-xl border border-border px-4 py-3 text-sm text-foreground shadow-sm transition-colors focus:outline-none focus:ring-2"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="rsvp-first-name" className="block text-sm font-medium text-foreground">
                First Name
              </label>
              <input
                id="rsvp-first-name"
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Jane"
                className="focus:border-wedding-600 focus:ring-wedding-600/20 mt-2 w-full rounded-xl border border-border px-4 py-3 text-sm text-foreground shadow-sm transition-colors focus:outline-none focus:ring-2"
              />
            </div>
            <div>
              <label htmlFor="rsvp-last-name" className="block text-sm font-medium text-foreground">
                Last Name
              </label>
              <input
                id="rsvp-last-name"
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Doe"
                className="focus:border-wedding-600 focus:ring-wedding-600/20 mt-2 w-full rounded-xl border border-border px-4 py-3 text-sm text-foreground shadow-sm transition-colors focus:outline-none focus:ring-2"
              />
            </div>
          </div>

          {nameError && (
            <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{nameError}</p>
          )}

          <button
            type="submit"
            disabled={!firstName.trim() || !lastName.trim() || !slug.trim() || nameLoading}
            className="bg-wedding-600 hover:bg-wedding-700 w-full rounded-xl px-5 py-3 text-sm font-semibold text-white shadow-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50"
          >
            {nameLoading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Searching...
              </span>
            ) : (
              'Search'
            )}
          </button>

          {nameResults && nameResults.length > 0 && (
            <div className="mt-4 space-y-2">
              <p className="text-sm font-medium text-foreground">
                We found {nameResults.length} match{nameResults.length !== 1 ? 'es' : ''}:
              </p>
              <div className="space-y-2">
                {nameResults.map((guest) => (
                  <button
                    key={guest.id}
                    onClick={() => handleGuestSelect(guest)}
                    disabled={!guest.rsvpToken}
                    className="hover:border-wedding-300 hover:bg-wedding-50 flex w-full items-center justify-between rounded-xl border border-border bg-muted px-4 py-3 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <span className="text-sm font-medium text-foreground">
                      {guest.firstName} {guest.lastName}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {guest.rsvpToken ? 'Select' : 'No RSVP link'}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </form>
      )}
    </div>
  )
}
