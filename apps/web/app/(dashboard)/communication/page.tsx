'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@clerk/nextjs'
import { motion } from 'framer-motion'
import { springSmooth, fadeInUp, staggerContainer } from '@/lib/animations'
import { api } from '@/lib/api'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'

const TEMPLATE_LABELS: Record<string, string> = {
  save_the_date: 'Save the Date',
  invitation: 'Invitation',
  update: 'Update',
  reminder: 'Reminder',
  thank_you: 'Thank You',
  custom: 'Custom',
}

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700',
  scheduled: 'bg-blue-100 text-blue-700',
  sending: 'bg-yellow-100 text-yellow-700',
  sent: 'bg-green-100 text-green-700',
  failed: 'bg-red-100 text-red-700',
}

interface Campaign {
  id: string
  weddingId: string
  subject: string
  body: string
  templateType: string | null
  status: string
  scheduledAt: string | null
  sentAt: string | null
  createdAt: Date
}

export default function CommunicationPage() {
  const { getToken } = useAuth()
  const [weddingId, setWeddingId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [campaigns, setCampaigns] = useState<Campaign[]>([])

  const [showComposeDialog, setShowComposeDialog] = useState(false)
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null)
  const [form, setForm] = useState({
    subject: '',
    body: '',
    templateType: 'custom',
    scheduledAt: '',
  })

  const loadData = useCallback(async () => {
    try {
      const token = await getToken()
      if (!token) return
      const { data: dashData } = await api.weddings.mine(token)
      const wId = dashData.wedding.id
      setWeddingId(wId)
      const { data } = await api.emailCampaigns.list(wId, token)
      setCampaigns(data)
    } catch {
      /* silent */
    } finally {
      setLoading(false)
    }
  }, [getToken])

  useEffect(() => {
    void loadData()
  }, [loadData])

  const handleSave = useCallback(async () => {
    if (!weddingId) return
    try {
      const token = await getToken()
      if (!token) return
      if (editingCampaign) {
        await api.emailCampaigns.update(
          editingCampaign.id,
          weddingId,
          {
            subject: form.subject,
            body: form.body,
            templateType: form.templateType as 'custom',
            scheduledAt: form.scheduledAt ? new Date(form.scheduledAt).toISOString() : null,
          },
          token,
        )
      } else {
        await api.emailCampaigns.create(
          {
            weddingId,
            subject: form.subject,
            body: form.body,
            templateType: form.templateType as 'custom',
            scheduledAt: form.scheduledAt ? new Date(form.scheduledAt).toISOString() : null,
          },
          token,
        )
      }
      setShowComposeDialog(false)
      setEditingCampaign(null)
      setForm({ subject: '', body: '', templateType: 'custom', scheduledAt: '' })
      void loadData()
    } catch {
      /* silent */
    }
  }, [weddingId, getToken, editingCampaign, form, loadData])

  const handleDelete = useCallback(
    async (id: string) => {
      if (!weddingId) return
      try {
        const token = await getToken()
        if (!token) return
        await api.emailCampaigns.delete(id, weddingId, token)
        void loadData()
      } catch {
        /* silent */
      }
    },
    [weddingId, getToken, loadData],
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="border-wedding-200 border-t-wedding-600 h-8 w-8 animate-spin rounded-full border-4" />
      </div>
    )
  }

  return (
    <motion.div
      className="mx-auto max-w-5xl"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ...springSmooth }}
    >
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl font-bold text-gray-900">Communication</h1>
          <p className="mt-1 text-sm text-gray-600">
            Create and manage email campaigns for your guests.
          </p>
        </div>
        <Button
          onClick={() => {
            setEditingCampaign(null)
            setForm({ subject: '', body: '', templateType: 'custom', scheduledAt: '' })
            setShowComposeDialog(true)
          }}
        >
          Compose Campaign
        </Button>
      </div>

      {campaigns.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <div className="bg-wedding-50 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full">
              <svg
                className="text-wedding-600 h-8 w-8"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
            </div>
            <h2 className="font-serif text-xl font-semibold text-gray-900">No Campaigns Yet</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-gray-600">
              Send save-the-dates, invitations, reminders, and thank-you notes to your guests.
            </p>
          </CardContent>
        </Card>
      ) : (
        <motion.div
          className="space-y-3"
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          {campaigns.map((campaign) => (
            <motion.div key={campaign.id} variants={fadeInUp}>
              <Card>
                <CardContent className="flex items-center justify-between py-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-medium text-gray-900">{campaign.subject}</h3>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[campaign.status] ?? 'bg-gray-100 text-gray-600'}`}
                      >
                        {campaign.status}
                      </span>
                      {campaign.templateType && (
                        <Badge variant="outline" className="text-xs">
                          {TEMPLATE_LABELS[campaign.templateType] ?? campaign.templateType}
                        </Badge>
                      )}
                    </div>
                    <p className="mt-1 line-clamp-1 text-sm text-gray-500">{campaign.body}</p>
                    <div className="mt-1 flex items-center gap-4 text-xs text-gray-400">
                      {campaign.scheduledAt && (
                        <span>
                          Scheduled: {new Date(campaign.scheduledAt).toLocaleDateString()}
                        </span>
                      )}
                      {campaign.sentAt && (
                        <span>Sent: {new Date(campaign.sentAt).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {campaign.status === 'draft' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingCampaign(campaign)
                          setForm({
                            subject: campaign.subject,
                            body: campaign.body,
                            templateType: campaign.templateType ?? 'custom',
                            scheduledAt: campaign.scheduledAt
                              ? (campaign.scheduledAt.split('T')[0] ?? '')
                              : '',
                          })
                          setShowComposeDialog(true)
                        }}
                      >
                        Edit
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-500 hover:text-red-700"
                      onClick={() => handleDelete(campaign.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      )}

      <Dialog open={showComposeDialog} onOpenChange={setShowComposeDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingCampaign ? 'Edit Campaign' : 'Compose Campaign'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Template Type</Label>
              <select
                value={form.templateType}
                onChange={(e) => setForm({ ...form, templateType: e.target.value })}
                className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm"
              >
                {Object.entries(TEMPLATE_LABELS).map(([val, label]) => (
                  <option key={val} value={val}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label>Subject</Label>
              <Input
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                placeholder="e.g. You're Invited!"
              />
            </div>
            <div>
              <Label>Body</Label>
              <Textarea
                value={form.body}
                onChange={(e) => setForm({ ...form, body: e.target.value })}
                rows={8}
                placeholder="Write your message..."
              />
            </div>
            <div>
              <Label>Schedule Send (optional)</Label>
              <Input
                type="datetime-local"
                value={form.scheduledAt}
                onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowComposeDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!form.subject || !form.body}>
              {editingCampaign ? 'Update' : 'Save Draft'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}
