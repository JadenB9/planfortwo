'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@clerk/nextjs'
import type { DashboardData } from '@planfortwo/types'
import { api } from '@/lib/api'

export default function DashboardPage() {
  const { getToken } = useAuth()
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteStatus, setInviteStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [inviteError, setInviteError] = useState<string | null>(null)

  const loadDashboard = useCallback(async () => {
    try {
      const token = await getToken()
      if (!token) return
      const { data } = await api.weddings.mine(token)
      setDashboardData(data)
    } catch {
      /* dashboard will show empty state */
    } finally {
      setLoading(false)
    }
  }, [getToken])

  useEffect(() => {
    void loadDashboard()
  }, [loadDashboard])

  async function handleInvitePartner() {
    if (!inviteEmail.trim() || !dashboardData) return
    setInviteStatus('sending')
    setInviteError(null)

    try {
      const token = await getToken()
      if (!token) throw new Error('Not authenticated')
      await api.weddings.invitePartner(dashboardData.wedding.id, { email: inviteEmail }, token)
      setInviteStatus('sent')
      setInviteEmail('')
    } catch (err) {
      setInviteError(err instanceof Error ? err.message : 'Failed to send invite')
      setInviteStatus('error')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-wedding-200 border-t-wedding-600" />
      </div>
    )
  }

  const wedding = dashboardData?.wedding
  const daysUntil = dashboardData?.daysUntilWedding

  return (
    <div className="mx-auto max-w-4xl animate-fade-in">
      <div className="mb-8">
        <h1 className="font-serif text-3xl font-bold text-gray-900">
          {wedding?.name ? `Welcome, ${wedding.name}` : 'Welcome'}
        </h1>
        {daysUntil !== null && daysUntil !== undefined && daysUntil > 0 && (
          <p className="mt-2 text-lg text-gray-600">
            <span className="font-semibold text-wedding-600">{daysUntil}</span> days until the big day
          </p>
        )}
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        {/* Invite Partner Card */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:col-span-2">
          <h2 className="font-serif text-xl font-semibold text-gray-900">
            Invite Your Partner
          </h2>
          <p className="mt-1 text-sm text-gray-600">
            Send an invitation so you can plan together.
          </p>

          {inviteStatus === 'sent' ? (
            <div className="mt-4 rounded-xl border border-sage-200 bg-sage-50 px-4 py-3 text-sm text-sage-700">
              Invitation sent! They&apos;ll receive an email shortly.
            </div>
          ) : (
            <div className="mt-4 flex gap-3">
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="partner@email.com"
                className="flex-1 rounded-xl border border-gray-300 px-4 py-2.5 text-sm text-gray-900 shadow-sm transition-colors focus:border-wedding-600 focus:outline-none focus:ring-2 focus:ring-wedding-600/20"
              />
              <button
                onClick={handleInvitePartner}
                disabled={!inviteEmail.trim() || inviteStatus === 'sending'}
                className="rounded-xl bg-wedding-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-wedding-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {inviteStatus === 'sending' ? 'Sending...' : 'Send Invite'}
              </button>
            </div>
          )}

          {inviteError && (
            <p className="mt-2 text-sm text-red-600">{inviteError}</p>
          )}
        </div>

        {/* Placeholder Cards */}
        {(['Checklist', 'Guest List', 'Budget'] as const).map((title) => (
          <div
            key={title}
            className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-white p-8 text-center"
          >
            <h3 className="font-serif text-lg font-semibold text-gray-400">{title}</h3>
            <p className="mt-1 text-sm text-gray-400">Coming Soon</p>
          </div>
        ))}
      </div>
    </div>
  )
}
