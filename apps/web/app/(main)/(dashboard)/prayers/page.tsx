'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@clerk/nextjs'
import { motion, AnimatePresence } from 'framer-motion'
import { springSmooth, fadeInUp, staggerContainer } from '@/lib/animations'
import { useWedding } from '@/hooks/use-wedding'
import { refreshBadges } from '@/hooks/use-notification-badges'
import { api } from '@/lib/api'
import type { Prayer } from '@planfortwo/types'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import { Heart, Clock, CheckCircle2, Eye, Check, X, Trash2, Loader2 } from 'lucide-react'

type FilterTab = 'all' | 'pending' | 'approved'

export default function PrayersPage() {
  const { getToken } = useAuth()
  const { data: weddingData, loading: weddingLoading } = useWedding()
  const weddingId = weddingData?.wedding.id ?? null

  const [entries, setEntries] = useState<Prayer[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<FilterTab>('all')
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const loadEntries = useCallback(async () => {
    if (!weddingId) return
    try {
      const token = await getToken()
      if (!token) return
      const { data } = await api.prayers.list(weddingId, token)
      setEntries(data)
    } catch {
      toast.error('Failed to load prayers')
    } finally {
      setLoading(false)
    }
  }, [weddingId, getToken])

  useEffect(() => {
    void loadEntries()
  }, [loadEntries])

  const handleApprove = async (id: string) => {
    if (!weddingId) return
    setActionLoading(id)
    try {
      const token = await getToken()
      if (!token) return
      await api.prayers.approve(id, weddingId, token)
      toast.success('Prayer approved')
      refreshBadges()
      void loadEntries()
    } catch {
      toast.error('Failed to approve prayer')
    } finally {
      setActionLoading(null)
    }
  }

  const handleReject = async (id: string) => {
    if (!weddingId) return
    setActionLoading(id)
    try {
      const token = await getToken()
      if (!token) return
      await api.prayers.reject(id, weddingId, token)
      toast.success('Prayer unapproved')
      refreshBadges()
      void loadEntries()
    } catch {
      toast.error('Failed to unapprove prayer')
    } finally {
      setActionLoading(null)
    }
  }

  const handleDelete = async (id: string) => {
    if (!weddingId) return
    setActionLoading(id)
    try {
      const token = await getToken()
      if (!token) return
      await api.prayers.delete(id, weddingId, token)
      toast.success('Prayer removed')
      setDeletingId(null)
      refreshBadges()
      void loadEntries()
    } catch {
      toast.error('Failed to delete prayer')
    } finally {
      setActionLoading(null)
    }
  }

  const filteredEntries = entries.filter((entry) => {
    if (filter === 'all') return true
    if (filter === 'pending') return !entry.isApproved
    if (filter === 'approved') return entry.isApproved
    return true
  })

  const totalCount = entries.length
  const pendingCount = entries.filter((e) => !e.isApproved).length
  const approvedCount = entries.filter((e) => e.isApproved).length
  const visibleCount = entries.filter((e) => e.isApproved && e.isVisible).length

  const formatDate = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  const isLoading = weddingLoading || loading

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="border-wedding-200 border-t-wedding-600 h-8 w-8 animate-spin rounded-full border-4" />
      </div>
    )
  }

  const stats = [
    {
      label: 'Total Prayers',
      value: totalCount,
      icon: Heart,
      color: 'text-rose-600 bg-rose-50',
    },
    {
      label: 'Pending Review',
      value: pendingCount,
      icon: Clock,
      color: 'text-amber-600 bg-amber-50',
    },
    {
      label: 'Approved',
      value: approvedCount,
      icon: CheckCircle2,
      color: 'text-green-600 bg-green-50',
    },
    {
      label: 'Visible on Website',
      value: visibleCount,
      icon: Eye,
      color: 'text-purple-600 bg-purple-50',
    },
  ]

  const filterTabs: { key: FilterTab; label: string; count: number }[] = [
    { key: 'all', label: 'All', count: totalCount },
    { key: 'pending', label: 'Pending', count: pendingCount },
    { key: 'approved', label: 'Approved', count: approvedCount },
  ]

  return (
    <motion.div
      className="mx-auto max-w-5xl"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ...springSmooth }}
    >
      <div className="mb-8">
        <h1 className="font-serif text-3xl font-bold text-gray-900">Prayers</h1>
        <p className="mt-1 text-sm text-gray-600">
          Review and manage prayers from your loved ones
          {pendingCount > 0 && (
            <span className="ml-2 font-medium text-amber-600">{pendingCount} pending review</span>
          )}
        </p>
      </div>

      <motion.div
        className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4"
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
      >
        {stats.map((stat) => (
          <motion.div key={stat.label} variants={fadeInUp}>
            <Card>
              <CardContent className="flex items-center gap-4 p-4">
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${stat.color}`}
                >
                  <stat.icon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  <p className="truncate text-xs text-gray-500">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {totalCount > 0 && (
        <div className="mb-6 flex flex-wrap gap-2">
          {filterTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                filter === tab.key
                  ? 'bg-wedding-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>
      )}

      {totalCount === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-rose-50">
              <Heart className="h-8 w-8 text-rose-400" />
            </div>
            <h2 className="font-serif text-xl font-semibold text-gray-900">No Prayers Yet</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-gray-600">
              When guests submit prayers through your wedding website, they will appear here for you
              to review and approve.
            </p>
            <p className="mx-auto mt-3 max-w-md text-xs italic text-gray-400">
              &ldquo;For where two or three gather in my name, there am I with them.&rdquo; —
              Matthew 18:20
            </p>
          </CardContent>
        </Card>
      ) : filteredEntries.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-sm text-gray-500">
              No {filter === 'pending' ? 'pending' : 'approved'} prayers.
            </p>
          </CardContent>
        </Card>
      ) : (
        <motion.div
          className="space-y-4"
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          <AnimatePresence mode="popLayout">
            {filteredEntries.map((entry) => (
              <motion.div
                key={entry.id}
                variants={fadeInUp}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3, ...springSmooth }}
              >
                <Card className="overflow-hidden transition-shadow hover:shadow-md">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="mb-2 flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-rose-100 text-sm font-semibold text-rose-700">
                            {entry.authorName.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="truncate font-medium text-gray-900">
                                {entry.authorName}
                              </span>
                              <Badge
                                variant={entry.isApproved ? 'default' : 'secondary'}
                                className="shrink-0 text-xs"
                              >
                                {entry.isApproved ? 'Approved' : 'Pending'}
                              </Badge>
                            </div>
                            <p className="text-xs text-gray-500">{formatDate(entry.createdAt)}</p>
                          </div>
                        </div>
                        <p className="ml-12 whitespace-pre-wrap text-sm italic leading-relaxed text-gray-700">
                          {entry.prayerText}
                        </p>
                      </div>

                      <div className="flex shrink-0 items-center gap-2">
                        {entry.isApproved ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => void handleReject(entry.id)}
                            disabled={actionLoading === entry.id}
                            className="text-amber-600 hover:bg-amber-50 hover:text-amber-700"
                          >
                            {actionLoading === entry.id ? (
                              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <X className="mr-1.5 h-3.5 w-3.5" />
                            )}
                            Unapprove
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => void handleApprove(entry.id)}
                            disabled={actionLoading === entry.id}
                            className="text-green-600 hover:bg-green-50 hover:text-green-700"
                          >
                            {actionLoading === entry.id ? (
                              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Check className="mr-1.5 h-3.5 w-3.5" />
                            )}
                            Approve
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeletingId(entry.id)}
                          className="text-red-500 hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      <Dialog
        open={deletingId !== null}
        onOpenChange={(open) => {
          if (!open) setDeletingId(null)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Prayer</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600">
            Are you sure you want to remove this prayer? This action cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingId(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={actionLoading !== null}
              onClick={() => {
                if (deletingId) void handleDelete(deletingId)
              }}
            >
              {actionLoading === deletingId ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}
