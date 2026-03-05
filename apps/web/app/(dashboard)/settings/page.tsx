'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth, useUser } from '@clerk/nextjs'
import { motion } from 'framer-motion'
import { springSmooth } from '@/lib/animations'
import { api } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import type { Wedding, NotificationPreference } from '@planfortwo/types'

export default function SettingsPage() {
  const { getToken } = useAuth()
  const { user } = useUser()
  const [loading, setLoading] = useState(true)
  const [weddingId, setWeddingId] = useState<string | null>(null)
  const [wedding, setWedding] = useState<Wedding | null>(null)
  const [notifPrefs, setNotifPrefs] = useState<NotificationPreference | null>(null)

  const [weddingForm, setWeddingForm] = useState({ name: '', date: '', venue: '' })
  const [saving, setSaving] = useState(false)
  const [notifSaving, setNotifSaving] = useState(false)

  const loadData = useCallback(async () => {
    try {
      const token = await getToken()
      if (!token) return
      const { data: dashData } = await api.weddings.mine(token)
      const w = dashData.wedding
      setWedding(w)
      setWeddingId(w.id)
      setWeddingForm({
        name: w.name,
        date: w.date ? (new Date(w.date).toISOString().split('T')[0] ?? '') : '',
        venue: w.venue ?? '',
      })

      try {
        const { data: prefs } = await api.notificationPrefs.get(w.id, token)
        setNotifPrefs(prefs)
      } catch {
        /* first time - no prefs */
      }
    } catch {
      /* silent */
    } finally {
      setLoading(false)
    }
  }, [getToken])

  useEffect(() => {
    void loadData()
  }, [loadData])

  const handleSaveWedding = useCallback(async () => {
    if (!weddingId) return
    setSaving(true)
    try {
      const token = await getToken()
      if (!token) return
      await api.weddings.update(
        weddingId,
        {
          name: weddingForm.name,
          date: weddingForm.date ? new Date(weddingForm.date).toISOString() : null,
          venue: weddingForm.venue || null,
        },
        token,
      )
      void loadData()
    } catch {
      /* silent */
    } finally {
      setSaving(false)
    }
  }, [weddingId, getToken, weddingForm, loadData])

  const handleUpdateNotif = useCallback(
    async (key: string, value: boolean | string) => {
      if (!weddingId) return
      setNotifSaving(true)
      try {
        const token = await getToken()
        if (!token) return
        const { data } = await api.notificationPrefs.update(weddingId, { [key]: value }, token)
        setNotifPrefs(data)
      } catch {
        /* silent */
      } finally {
        setNotifSaving(false)
      }
    },
    [weddingId, getToken],
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
      className="mx-auto max-w-4xl"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ...springSmooth }}
    >
      <div className="mb-8">
        <h1 className="font-serif text-3xl font-bold text-gray-900">Settings</h1>
        <p className="mt-1 text-sm text-gray-600">
          Manage your wedding details, notifications, and account.
        </p>
      </div>

      <Tabs defaultValue="wedding">
        <TabsList className="mb-6">
          <TabsTrigger value="wedding">Wedding Details</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="account">Account</TabsTrigger>
        </TabsList>

        <TabsContent value="wedding">
          <Card>
            <CardHeader>
              <CardTitle>Wedding Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Wedding Name</Label>
                <Input
                  value={weddingForm.name}
                  onChange={(e) => setWeddingForm({ ...weddingForm, name: e.target.value })}
                  placeholder="The Smith-Jones Wedding"
                />
              </div>
              <div>
                <Label>Wedding Date</Label>
                <Input
                  type="date"
                  value={weddingForm.date}
                  onChange={(e) => setWeddingForm({ ...weddingForm, date: e.target.value })}
                />
              </div>
              <div>
                <Label>Venue</Label>
                <Input
                  value={weddingForm.venue}
                  onChange={(e) => setWeddingForm({ ...weddingForm, venue: e.target.value })}
                  placeholder="Venue name"
                />
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-gray-500">Tier</Label>
                  <p className="font-medium capitalize text-gray-900">{wedding?.tier ?? 'free'}</p>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Guest Estimate</Label>
                  <p className="font-medium text-gray-900">
                    {wedding?.guestCountEstimate ?? 'Not set'}
                  </p>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Budget</Label>
                  <p className="font-medium text-gray-900">
                    {wedding?.budgetTotal ? `$${wedding.budgetTotal.toLocaleString()}` : 'Not set'}
                  </p>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Style</Label>
                  <p className="font-medium capitalize text-gray-900">
                    {wedding?.style ?? 'Not set'}
                  </p>
                </div>
              </div>

              <div className="pt-2">
                <Button onClick={handleSaveWedding} disabled={saving}>
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">RSVP Notifications</p>
                  <p className="text-sm text-gray-500">
                    Get notified when guests respond to your RSVP.
                  </p>
                </div>
                <Switch
                  checked={notifPrefs?.emailRsvp ?? true}
                  onCheckedChange={(val) => handleUpdateNotif('emailRsvp', val)}
                  disabled={notifSaving}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">Payment Reminders</p>
                  <p className="text-sm text-gray-500">
                    Receive reminders for upcoming vendor payments.
                  </p>
                </div>
                <Switch
                  checked={notifPrefs?.emailPaymentReminder ?? true}
                  onCheckedChange={(val) => handleUpdateNotif('emailPaymentReminder', val)}
                  disabled={notifSaving}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">Task Due Dates</p>
                  <p className="text-sm text-gray-500">
                    Get notified when checklist tasks are approaching due dates.
                  </p>
                </div>
                <Switch
                  checked={notifPrefs?.emailTaskDue ?? true}
                  onCheckedChange={(val) => handleUpdateNotif('emailTaskDue', val)}
                  disabled={notifSaving}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">Weekly Summary</p>
                  <p className="text-sm text-gray-500">
                    Receive a weekly email summarizing your planning progress.
                  </p>
                </div>
                <Switch
                  checked={notifPrefs?.emailWeeklySummary ?? false}
                  onCheckedChange={(val) => handleUpdateNotif('emailWeeklySummary', val)}
                  disabled={notifSaving}
                />
              </div>
              <Separator />
              <div>
                <Label>Digest Frequency</Label>
                <select
                  value={notifPrefs?.digestFrequency ?? 'weekly'}
                  onChange={(e) => handleUpdateNotif('digestFrequency', e.target.value)}
                  className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm"
                  disabled={notifSaving}
                >
                  <option value="instant">Instant</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                </select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="account">
          <Card>
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-gray-500">Name</Label>
                  <p className="font-medium text-gray-900">{user?.fullName ?? 'Unknown'}</p>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Email</Label>
                  <p className="font-medium text-gray-900">
                    {user?.primaryEmailAddress?.emailAddress ?? 'Unknown'}
                  </p>
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="mb-2 font-medium text-gray-900">Data Export</h3>
                <p className="mb-3 text-sm text-gray-500">
                  Download all your wedding planning data as a CSV file.
                </p>
                <Button
                  variant="outline"
                  onClick={async () => {
                    if (!weddingId) return
                    try {
                      const token = await getToken()
                      if (!token) return
                      const csv = await api.budgetAnalytics.exportCsv(weddingId, token)
                      const blob = new Blob([csv], { type: 'text/csv' })
                      const url = URL.createObjectURL(blob)
                      const a = document.createElement('a')
                      a.href = url
                      a.download = 'planfortwo-export.csv'
                      a.click()
                      URL.revokeObjectURL(url)
                    } catch {
                      /* silent */
                    }
                  }}
                >
                  Export Data (CSV)
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </motion.div>
  )
}
