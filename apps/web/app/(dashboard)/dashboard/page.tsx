'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@clerk/nextjs'
import { motion } from 'framer-motion'
import type { DashboardData, DashboardStats, GuestStats } from '@planfortwo/types'
import { api } from '@/lib/api'
import { staggerGrid, fadeInUp, springSmooth } from '@/lib/animations'
import { StatCard } from '@/components/dashboard/stat-card'
import { UpcomingTasks } from '@/components/dashboard/upcoming-tasks'
import { ActivityFeed } from '@/components/dashboard/activity-feed'

export default function DashboardPage() {
  const { getToken } = useAuth()
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [guestStats, setGuestStats] = useState<GuestStats | null>(null)
  const [websiteStatus, setWebsiteStatus] = useState<string>('Not Set Up')
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

      if (data.wedding.id) {
        const promises: Promise<void>[] = []
        promises.push(
          api.dashboard.stats(data.wedding.id, token)
            .then(({ data: statsData }) => setStats(statsData))
            .catch(() => { /* stats endpoint may not have data yet */ })
        )
        promises.push(
          api.guests.stats(data.wedding.id, token)
            .then(({ data: gs }) => setGuestStats(gs))
            .catch(() => { /* guest stats may not exist yet */ })
        )
        promises.push(
          api.websiteConfig.get(data.wedding.id, token)
            .then(({ data: configData }) => {
              if (!configData) {
                setWebsiteStatus('Not Set Up')
              } else if (configData.publishedAt) {
                setWebsiteStatus('Published')
              } else {
                setWebsiteStatus('Draft')
              }
            })
            .catch(() => { setWebsiteStatus('Not Set Up') })
        )
        await Promise.all(promises)
      }
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
      console.error('Invite partner error:', err)
      setInviteError(err instanceof Error ? err.message : 'Failed to send invite. Please check that the API server is running.')
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
  const members = dashboardData?.members ?? []
  const daysUntil = dashboardData?.daysUntilWedding
  const showInvite = members.length < 2

  return (
    <motion.div
      className="mx-auto max-w-4xl"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ...springSmooth }}
    >
      {/* Welcome + Countdown */}
      <motion.div
        className="mb-8"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <h1 className="font-serif text-3xl font-bold text-gray-900">
          {wedding?.name ? `Welcome, ${wedding.name}` : 'Welcome'}
        </h1>
        {daysUntil !== null && daysUntil !== undefined && daysUntil > 0 && (
          <p className="mt-2 text-lg text-gray-600">
            <motion.span
              className="font-semibold text-wedding-600"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              {daysUntil}
            </motion.span>{' '}
            days until the big day
          </p>
        )}
      </motion.div>

      <div className="space-y-6">
        {/* Invite Partner Card */}
        {showInvite && (
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="font-serif text-xl font-semibold text-gray-900">Invite Your Partner</h2>
            <p className="mt-1 text-sm text-gray-600">Send an invitation so you can plan together.</p>

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

            {inviteError && <p className="mt-2 text-sm text-red-600">{inviteError}</p>}
          </div>
        )}

        {/* Quick Stats */}
        <motion.div
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
          variants={staggerGrid}
          initial="hidden"
          animate="visible"
        >
          <motion.div variants={fadeInUp} transition={{ duration: 0.4, ...springSmooth }}>
            <StatCard
              label="Tasks"
              value={stats ? `${stats.tasksCompleted}/${stats.tasksTotal}` : '0/0'}
              icon={
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              }
              trend={stats && stats.tasksTotal > 0 ? `${Math.round((stats.tasksCompleted / stats.tasksTotal) * 100)}%` : undefined}
            />
          </motion.div>
          <motion.div variants={fadeInUp} transition={{ duration: 0.4, ...springSmooth }}>
            <StatCard
              label="Guests"
              value={guestStats ? `${guestStats.rsvpAccepted}/${guestStats.totalGuests}` : '0/0'}
              icon={
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              }
              trend={guestStats && guestStats.totalGuests > 0 ? `${guestStats.rsvpPending} pending` : undefined}
            />
          </motion.div>
          <motion.div variants={fadeInUp} transition={{ duration: 0.4, ...springSmooth }}>
            <StatCard
              label="Budget"
              value={
                stats && stats.budgetTotal > 0
                  ? `$${Math.round(stats.budgetSpent / 1000)}k / $${Math.round(stats.budgetTotal / 1000)}k`
                  : 'Not Set'
              }
              icon={
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
              trend={stats && stats.budgetTotal > 0 ? `${Math.round((stats.budgetSpent / stats.budgetTotal) * 100)}% used` : undefined}
            />
          </motion.div>
          <motion.div variants={fadeInUp} transition={{ duration: 0.4, ...springSmooth }}>
            <StatCard
              label="Website"
              value={websiteStatus}
              icon={
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                </svg>
              }
              trend={websiteStatus === 'Published' ? 'Live' : undefined}
            />
          </motion.div>
        </motion.div>

        {/* Upcoming Tasks + Activity Feed */}
        <motion.div
          className="grid gap-6 lg:grid-cols-2"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4, ...springSmooth }}
        >
          <UpcomingTasks tasks={stats?.upcomingTasks ?? []} />
          <ActivityFeed activities={stats?.recentActivity ?? []} />
        </motion.div>
      </div>
    </motion.div>
  )
}
