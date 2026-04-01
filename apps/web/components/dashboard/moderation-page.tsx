'use client'

import { useState, useEffect, useCallback, Suspense, type ReactNode } from 'react'
import { useAuth } from '@clerk/nextjs'
import { motion, AnimatePresence } from 'framer-motion'
import { springSmooth, fadeInUp, staggerContainer } from '@/lib/animations'
import { useWedding } from '@/hooks/use-wedding'
import { refreshBadges } from '@/hooks/use-notification-badges'
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
import { Clock, CheckCircle2, Eye, Check, X, Trash2, Loader2 } from 'lucide-react'
import { useTabParam } from '@/hooks/use-tab-param'
import type { LucideIcon } from 'lucide-react'

interface ModeratableEntry {
  id: string
  authorName: string
  isApproved: boolean
  isVisible: boolean
  createdAt: Date | string
}

interface ModerationPageConfig<T extends ModeratableEntry> {
  title: string
  entityName: string
  entityNamePlural: string
  icon: LucideIcon
  iconColor: string
  avatarColor: string
  emptyTitle: string
  emptyDescription: string
  emptyExtra?: ReactNode
  getText: (entry: T) => string
  textClassName?: string
  api: {
    list: (weddingId: string, token: string) => Promise<{ data: T[] }>
    approve: (id: string, weddingId: string, token: string) => Promise<unknown>
    reject: (id: string, weddingId: string, token: string) => Promise<unknown>
    delete: (id: string, weddingId: string, token: string) => Promise<unknown>
  }
}

type FilterTab = 'all' | 'pending' | 'approved'
const VALID_FILTER_TABS: FilterTab[] = ['all', 'pending', 'approved']

function formatDate(date: Date | string) {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function ModerationPageInner<T extends ModeratableEntry>({
  config,
}: {
  config: ModerationPageConfig<T>
}) {
  const { getToken } = useAuth()
  const { data: weddingData, loading: weddingLoading } = useWedding()
  const weddingId = weddingData?.wedding.id ?? null

  const [entries, setEntries] = useState<T[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useTabParam<FilterTab>('filter', 'all', VALID_FILTER_TABS)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const loadEntries = useCallback(async () => {
    if (!weddingId) return
    try {
      const token = await getToken()
      if (!token) return
      const { data } = await config.api.list(weddingId, token)
      setEntries(data)
    } catch {
      toast.error(`Failed to load ${config.entityNamePlural}`)
    } finally {
      setLoading(false)
    }
  }, [weddingId, getToken, config.api, config.entityNamePlural])

  useEffect(() => {
    void loadEntries()
  }, [loadEntries])

  const handleAction = async (id: string, action: 'approve' | 'reject' | 'delete') => {
    if (!weddingId) return
    setActionLoading(id)
    try {
      const token = await getToken()
      if (!token) return
      await config.api[action](id, weddingId, token)
      const messages = {
        approve: `${config.entityName} approved`,
        reject: `${config.entityName} unapproved`,
        delete: `${config.entityName} deleted`,
      }
      toast.success(messages[action])
      if (action === 'delete') setDeletingId(null)
      refreshBadges()
      void loadEntries()
    } catch {
      toast.error(`Failed to ${action} ${config.entityName}`)
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

  if (weddingLoading || loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="border-wedding-200 border-t-wedding-600 h-8 w-8 animate-spin rounded-full border-4" />
      </div>
    )
  }

  const stats = [
    {
      label: `Total ${config.entityNamePlural}`,
      value: totalCount,
      icon: config.icon,
      color: config.iconColor,
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
        <h1 className="font-serif text-3xl font-bold text-foreground">{config.title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Review and manage {config.entityNamePlural} from your wedding website
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
                  <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                  <p className="truncate text-xs text-muted-foreground">{stat.label}</p>
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
                  : 'bg-muted text-foreground hover:bg-muted'
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
            <div
              className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full ${config.iconColor.split(' ')[1] ?? 'bg-muted'}`}
            >
              <config.icon
                className={`h-8 w-8 ${config.iconColor.split(' ')[0] ?? 'text-muted-foreground'}`}
              />
            </div>
            <h2 className="font-serif text-xl font-semibold text-foreground">{config.emptyTitle}</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">{config.emptyDescription}</p>
            {config.emptyExtra}
          </CardContent>
        </Card>
      ) : filteredEntries.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-sm text-muted-foreground">
              No {filter === 'pending' ? 'pending' : 'approved'} {config.entityNamePlural}.
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
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="mb-2 flex items-center gap-3">
                          <div
                            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${config.avatarColor}`}
                          >
                            {entry.authorName.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="truncate font-medium text-foreground">
                                {entry.authorName}
                              </span>
                              <Badge
                                variant={entry.isApproved ? 'default' : 'secondary'}
                                className="shrink-0 text-xs"
                              >
                                {entry.isApproved ? 'Approved' : 'Pending'}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground">{formatDate(entry.createdAt)}</p>
                          </div>
                        </div>
                        <p
                          className={`ml-12 whitespace-pre-wrap text-sm leading-relaxed text-foreground ${config.textClassName ?? ''}`}
                        >
                          {config.getText(entry)}
                        </p>
                      </div>

                      <div className="flex shrink-0 items-center gap-2 self-end sm:self-auto">
                        {entry.isApproved ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => void handleAction(entry.id, 'reject')}
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
                            onClick={() => void handleAction(entry.id, 'approve')}
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
            <DialogTitle>Delete {config.entityName}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete this {config.entityName.toLowerCase()}? This action
            cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingId(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={actionLoading !== null}
              onClick={() => {
                if (deletingId) void handleAction(deletingId, 'delete')
              }}
            >
              {actionLoading === deletingId ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}

export function ModerationPage<T extends ModeratableEntry>(props: {
  config: ModerationPageConfig<T>
}) {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-20">
          <div className="border-wedding-200 border-t-wedding-600 h-8 w-8 animate-spin rounded-full border-4" />
        </div>
      }
    >
      <ModerationPageInner config={props.config} />
    </Suspense>
  )
}

export type { ModerationPageConfig, ModeratableEntry }
