'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@clerk/nextjs'
import { motion } from 'framer-motion'
import type { DashboardData, DashboardStats, GuestStats } from '@planfortwo/types'
import { api } from '@/lib/api'
import { staggerGrid, fadeInUp, springSmooth } from '@/lib/animations'
import Link from 'next/link'
import type { PartnerInvitation } from '@planfortwo/types'
import { Map, ArrowRight, Calendar, Pencil, Check, X, Mail, Clock, XCircle } from 'lucide-react'
import { StatCard } from '@/components/dashboard/stat-card'
import { UpcomingTasks } from '@/components/dashboard/upcoming-tasks'
import { ActivityFeed } from '@/components/dashboard/activity-feed'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'

function formatBudgetValue(amount: number): string {
  if (amount >= 10000) {
    const k = amount / 1000
    return k === Math.floor(k) ? `$${Math.floor(k)}k` : `$${k.toFixed(1)}k`
  }
  return `$${amount.toLocaleString()}`
}

export default function DashboardPage() {
  const { getToken } = useAuth()
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [guestStats, setGuestStats] = useState<GuestStats | null>(null)
  const [websiteStatus, setWebsiteStatus] = useState<string>('Not Set Up')
  const [loading, setLoading] = useState(true)
  const [pendingInvitations, setPendingInvitations] = useState<PartnerInvitation[]>([])
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteStatus, setInviteStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [inviteError, setInviteError] = useState<string | null>(null)
  const [editingDate, setEditingDate] = useState(false)
  const [dateInput, setDateInput] = useState('')
  const [savingDate, setSavingDate] = useState(false)
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
  const [cancellingInvite, setCancellingInvite] = useState(false)

  const loadDashboard = useCallback(async () => {
    try {
      const token = await getToken()
      if (!token) return
      const { data } = await api.weddings.mine(token)
      setDashboardData(data)

      if (data.wedding.id) {
        const promises: Promise<void>[] = []
        promises.push(
          api.dashboard
            .stats(data.wedding.id, token)
            .then(({ data: statsData }) => setStats(statsData))
            .catch(() => {
              /* stats endpoint may not have data yet */
            }),
        )
        promises.push(
          api.guests
            .stats(data.wedding.id, token)
            .then(({ data: gs }) => setGuestStats(gs))
            .catch(() => {
              /* guest stats may not exist yet */
            }),
        )
        promises.push(
          api.websiteConfig
            .get(data.wedding.id, token)
            .then(({ data: configData }) => {
              if (!configData) {
                setWebsiteStatus('Not Set Up')
              } else if (configData.publishedAt) {
                setWebsiteStatus('Published')
              } else {
                setWebsiteStatus('Draft')
              }
            })
            .catch(() => {
              setWebsiteStatus('Not Set Up')
            }),
        )
        promises.push(
          api.weddings
            .getPendingInvitations(data.wedding.id, token)
            .then(({ data: invites }) => setPendingInvitations(invites))
            .catch(() => {
              /* no pending invitations */
            }),
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
      const { data: invitation } = await api.weddings.invitePartner(
        dashboardData.wedding.id,
        { email: inviteEmail },
        token,
      )
      setPendingInvitations((prev) => [...prev, invitation])
      setInviteStatus('sent')
      setInviteEmail('')
    } catch (err) {
      setInviteError(
        err instanceof Error
          ? err.message
          : 'Failed to send invite. Please check that the API server is running.',
      )
      setInviteStatus('error')
    }
  }

  async function handleSaveDate() {
    if (!dashboardData || !dateInput) return
    setSavingDate(true)
    try {
      const token = await getToken()
      if (!token) throw new Error('Not authenticated')
      await api.weddings.update(dashboardData.wedding.id, { date: dateInput }, token)
      await loadDashboard()
      setEditingDate(false)
      toast.success('Wedding date updated')
    } catch {
      toast.error('Failed to update date')
    } finally {
      setSavingDate(false)
    }
  }

  async function handleCancelInvitation() {
    if (!dashboardData || !pendingPartnerInvite) return
    setCancellingInvite(true)
    try {
      const token = await getToken()
      if (!token) throw new Error('Not authenticated')
      await api.weddings.cancelInvitation(dashboardData.wedding.id, pendingPartnerInvite.id, token)
      setPendingInvitations((prev) => prev.filter((i) => i.id !== pendingPartnerInvite.id))
      setCancelDialogOpen(false)
      setInviteStatus('idle')
      toast.success('Invitation cancelled')
    } catch {
      toast.error('Failed to cancel invitation')
    } finally {
      setCancellingInvite(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="border-wedding-200 border-t-wedding-600 h-8 w-8 animate-spin rounded-full border-4" />
      </div>
    )
  }

  const wedding = dashboardData?.wedding
  const members = dashboardData?.members ?? []
  const daysUntil = dashboardData?.daysUntilWedding
  const hasPartner = members.some((m) => m.role === 'partner')
  const pendingPartnerInvite = pendingInvitations.find(
    (i) => i.status === 'pending' && i.role === 'partner',
  )
  const showInvite = !hasPartner && !pendingPartnerInvite

  return (
    <motion.div
      className="mx-auto max-w-4xl"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ...springSmooth }}
    >
      {/* Welcome + Countdown + Date */}
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
              className="text-wedding-600 font-semibold"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              {daysUntil}
            </motion.span>{' '}
            days until the big day
          </p>
        )}
        <div className="mt-2 flex items-center gap-2">
          <Calendar className="h-4 w-4 text-gray-400" />
          {editingDate ? (
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={dateInput}
                onChange={(e) => setDateInput(e.target.value)}
                className="focus:border-wedding-600 focus:ring-wedding-600/20 rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-900 focus:outline-none focus:ring-2"
                min={new Date().toISOString().split('T')[0]}
              />
              <button
                onClick={handleSaveDate}
                disabled={savingDate || !dateInput}
                className="text-wedding-600 hover:text-wedding-700 rounded-lg p-1 transition-colors disabled:opacity-50"
              >
                <Check className="h-4 w-4" />
              </button>
              <button
                onClick={() => setEditingDate(false)}
                className="rounded-lg p-1 text-gray-400 transition-colors hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => {
                setDateInput(
                  wedding?.date ? (new Date(wedding.date).toISOString().split('T')[0] ?? '') : '',
                )
                setEditingDate(true)
              }}
              className="group flex items-center gap-1.5 text-sm text-gray-500 transition-colors hover:text-gray-700"
            >
              <span>
                {wedding?.date
                  ? new Date(wedding.date).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })
                  : 'Set your wedding date'}
              </span>
              <Pencil className="h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-100" />
            </button>
          )}
        </div>
      </motion.div>

      {/* Roadmap Quick Link */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15 }}
        className="mb-6"
      >
        <Link
          href="/roadmap"
          className="border-wedding-200 from-wedding-50 to-cream-50 group flex items-center justify-between rounded-2xl border bg-gradient-to-r p-5 shadow-sm transition-all hover:shadow-md"
        >
          <div className="flex items-center gap-3">
            <div className="bg-wedding-100 flex h-10 w-10 items-center justify-center rounded-xl">
              <Map className="text-wedding-700 h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">Planning Roadmap</p>
              <p className="text-xs text-gray-500">Track your overall wedding planning progress</p>
            </div>
          </div>
          <ArrowRight className="h-5 w-5 text-gray-400 transition-transform group-hover:translate-x-1" />
        </Link>
      </motion.div>

      <div className="space-y-6">
        {/* Invite Partner Card */}
        {!hasPartner &&
          (pendingPartnerInvite ? (
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50">
                  <Clock className="h-5 w-5 text-amber-600" />
                </div>
                <div className="flex-1">
                  <h2 className="font-serif text-lg font-semibold text-gray-900">
                    Partner Invitation Pending
                  </h2>
                  <p className="text-sm text-gray-500">
                    Invitation sent to{' '}
                    <span className="font-medium text-gray-700">{pendingPartnerInvite.email}</span>{' '}
                    &mdash; waiting for them to accept.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1.5">
                    <Mail className="h-3.5 w-3.5 text-amber-600" />
                    <span className="text-xs font-medium text-amber-700">Sent</span>
                  </div>
                  <button
                    onClick={() => setCancelDialogOpen(true)}
                    className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600"
                    title="Cancel invitation"
                  >
                    <XCircle className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Cancel Partner Invitation</DialogTitle>
                    <DialogDescription>
                      Are you sure you want to cancel the invitation sent to{' '}
                      <span className="font-medium text-gray-700">
                        {pendingPartnerInvite.email}
                      </span>
                      ? They will no longer be able to accept it, but you can send a new one
                      afterward.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <button
                      onClick={() => setCancelDialogOpen(false)}
                      className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                    >
                      Keep Invitation
                    </button>
                    <button
                      onClick={handleCancelInvitation}
                      disabled={cancellingInvite}
                      className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-50"
                    >
                      {cancellingInvite ? 'Cancelling...' : 'Cancel Invitation'}
                    </button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          ) : (
            showInvite && (
              <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <h2 className="font-serif text-xl font-semibold text-gray-900">
                  Invite Your Partner
                </h2>
                <p className="mt-1 text-sm text-gray-600">
                  Send an invitation so you can plan together.
                </p>

                {inviteStatus === 'sent' ? (
                  <div className="border-sage-200 bg-sage-50 text-sage-700 mt-4 rounded-xl border px-4 py-3 text-sm">
                    Invitation sent! They&apos;ll receive an email shortly.
                  </div>
                ) : (
                  <div className="mt-4 flex gap-3">
                    <input
                      type="email"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      placeholder="partner@email.com"
                      className="focus:border-wedding-600 focus:ring-wedding-600/20 flex-1 rounded-xl border border-gray-300 px-4 py-2.5 text-sm text-gray-900 shadow-sm transition-colors focus:outline-none focus:ring-2"
                    />
                    <button
                      onClick={handleInvitePartner}
                      disabled={!inviteEmail.trim() || inviteStatus === 'sending'}
                      className="bg-wedding-600 hover:bg-wedding-700 rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {inviteStatus === 'sending' ? 'Sending...' : 'Send Invite'}
                    </button>
                  </div>
                )}

                {inviteError && <p className="mt-2 text-sm text-red-600">{inviteError}</p>}
              </div>
            )
          ))}

        {/* Quick Stats */}
        <motion.div
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
          variants={staggerGrid}
          initial="hidden"
          animate="visible"
        >
          <motion.div
            className="min-w-0"
            variants={fadeInUp}
            transition={{ duration: 0.4, ...springSmooth }}
          >
            <StatCard
              label="Tasks"
              value={stats ? `${stats.tasksCompleted}/${stats.tasksTotal}` : '0/0'}
              icon={
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                  />
                </svg>
              }
              trend={
                stats && stats.tasksTotal > 0
                  ? `${Math.round((stats.tasksCompleted / stats.tasksTotal) * 100)}%`
                  : undefined
              }
              href="/checklist"
            />
          </motion.div>
          <motion.div
            className="min-w-0"
            variants={fadeInUp}
            transition={{ duration: 0.4, ...springSmooth }}
          >
            <StatCard
              label="Guests"
              value={
                guestStats
                  ? `${guestStats.totalGuests}/${dashboardData?.wedding?.guestCountEstimate ?? 100}`
                  : '0/0'
              }
              icon={
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              }
              trend={
                guestStats && guestStats.rsvpAccepted > 0
                  ? `${guestStats.rsvpAccepted} confirmed`
                  : undefined
              }
              href="/guests"
            />
          </motion.div>
          <motion.div
            className="min-w-0"
            variants={fadeInUp}
            transition={{ duration: 0.4, ...springSmooth }}
          >
            <StatCard
              label="Budget"
              value={
                stats && stats.budgetTotal > 0
                  ? `${formatBudgetValue(stats.budgetSpent)} / ${formatBudgetValue(stats.budgetTotal)}`
                  : 'Not Set'
              }
              icon={
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              }
              trend={
                stats && stats.budgetTotal > 0
                  ? `${Math.round((stats.budgetSpent / stats.budgetTotal) * 100)}% used`
                  : undefined
              }
              href="/budget"
            />
          </motion.div>
          <motion.div
            className="min-w-0"
            variants={fadeInUp}
            transition={{ duration: 0.4, ...springSmooth }}
          >
            <StatCard
              label="Website"
              value={websiteStatus}
              icon={
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
                  />
                </svg>
              }
              trend={websiteStatus === 'Published' ? 'Live' : undefined}
              href="/website"
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
