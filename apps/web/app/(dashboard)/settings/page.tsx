'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth, useUser } from '@clerk/nextjs'
import { toast } from 'sonner'
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
import { UserPlus, Trash2, Crown, Heart, Users } from 'lucide-react'

export default function SettingsPage() {
  const { getToken } = useAuth()
  const { user } = useUser()
  const [loading, setLoading] = useState(true)
  const [weddingId, setWeddingId] = useState<string | null>(null)
  const [wedding, setWedding] = useState<Wedding | null>(null)
  const [notifPrefs, setNotifPrefs] = useState<NotificationPreference | null>(null)

  const [weddingForm, setWeddingForm] = useState({
    name: '',
    date: '',
    venue: '',
    budgetTotal: '',
    guestCountEstimate: '',
  })
  const [saving, setSaving] = useState(false)
  const [notifSaving, setNotifSaving] = useState(false)

  // Team member management state
  const [members, setMembers] = useState<
    Array<{
      member: { id: string; role: string }
      user: {
        id: string
        email: string
        firstName: string
        lastName: string
        avatarUrl: string | null
      }
    }>
  >([])
  const [newMemberEmail, setNewMemberEmail] = useState('')
  const [newMemberRole, setNewMemberRole] = useState<'planner' | 'family'>('planner')
  const [addingMember, setAddingMember] = useState(false)
  const [removingId, setRemovingId] = useState<string | null>(null)

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
        budgetTotal: w.budgetTotal ? String(w.budgetTotal) : '',
        guestCountEstimate: w.guestCountEstimate ? String(w.guestCountEstimate) : '',
      })

      try {
        const { data: prefs } = await api.notificationPrefs.get(w.id, token)
        setNotifPrefs(prefs)
      } catch {
        /* first time - no prefs */
      }

      try {
        const { data: memberList } = await api.weddings.getMembers(w.id, token)
        setMembers(memberList)
      } catch {
        /* members will show empty */
      }
    } catch {
      toast.error('Failed to load settings')
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
      const budgetParsed = weddingForm.budgetTotal ? parseFloat(weddingForm.budgetTotal) : null
      const guestParsed = weddingForm.guestCountEstimate
        ? parseInt(weddingForm.guestCountEstimate, 10)
        : null
      await api.weddings.update(
        weddingId,
        {
          name: weddingForm.name,
          date: weddingForm.date ? new Date(weddingForm.date).toISOString() : null,
          venue: weddingForm.venue || null,
          budgetTotal: budgetParsed && !isNaN(budgetParsed) ? budgetParsed : null,
          guestCountEstimate: guestParsed && !isNaN(guestParsed) ? guestParsed : null,
        },
        token,
      )
      toast.success('Settings saved')
      void loadData()
    } catch {
      toast.error('Failed to save settings')
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
        toast.success('Notification preferences updated')
      } catch {
        toast.error('Failed to update preferences')
      } finally {
        setNotifSaving(false)
      }
    },
    [weddingId, getToken],
  )

  const handleAddMember = useCallback(async () => {
    if (!weddingId || !newMemberEmail.trim()) return
    setAddingMember(true)
    try {
      const token = await getToken()
      if (!token) return
      const { data } = await api.weddings.addMember(
        weddingId,
        { email: newMemberEmail, role: newMemberRole },
        token,
      )
      if (data.invited) {
        toast.success('Invitation sent! They\u2019ll receive an email to join your team.')
      } else {
        toast.success('Team member added')
      }
      setNewMemberEmail('')
      const { data: memberList } = await api.weddings.getMembers(weddingId, token)
      setMembers(memberList)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to add member')
    } finally {
      setAddingMember(false)
    }
  }, [weddingId, getToken, newMemberEmail, newMemberRole])

  const handleRemoveMember = useCallback(
    async (memberId: string) => {
      if (!weddingId) return
      setRemovingId(memberId)
      try {
        const token = await getToken()
        if (!token) return
        await api.weddings.removeMember(weddingId, memberId, token)
        toast.success('Team member removed')
        const { data: memberList } = await api.weddings.getMembers(weddingId, token)
        setMembers(memberList)
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed to remove member')
      } finally {
        setRemovingId(null)
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
          <TabsTrigger value="team">Planning Team</TabsTrigger>
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
                  <Label className="text-xs text-gray-500">Guest Estimate</Label>
                  <Input
                    type="number"
                    value={weddingForm.guestCountEstimate}
                    onChange={(e) =>
                      setWeddingForm({ ...weddingForm, guestCountEstimate: e.target.value })
                    }
                    placeholder="150"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Tier</Label>
                  <p className="font-medium capitalize text-gray-900">{wedding?.tier ?? 'free'}</p>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Budget</Label>
                  <Input
                    type="number"
                    value={weddingForm.budgetTotal}
                    onChange={(e) =>
                      setWeddingForm({ ...weddingForm, budgetTotal: e.target.value })
                    }
                    placeholder="30000"
                    className="mt-1"
                  />
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

        <TabsContent value="team">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Planning Team
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-sm text-gray-600">
                Everyone on your planning team sees the same dashboard and can manage all wedding
                details together.
              </p>

              {/* Current Members */}
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-gray-900">Current Members</h3>
                {members.map(({ member, user: memberUser }) => {
                  const roleIcon =
                    member.role === 'owner' ? (
                      <Crown className="h-4 w-4 text-amber-500" />
                    ) : member.role === 'partner' ? (
                      <Heart className="h-4 w-4 text-pink-500" />
                    ) : (
                      <Users className="h-4 w-4 text-blue-500" />
                    )

                  const roleLabel =
                    member.role === 'owner'
                      ? 'Owner'
                      : member.role === 'partner'
                        ? 'Partner'
                        : member.role === 'planner'
                          ? 'Planner'
                          : 'Family'

                  return (
                    <div
                      key={member.id}
                      className="flex items-center justify-between rounded-xl border border-gray-200 px-4 py-3"
                    >
                      <div className="flex items-center gap-3">
                        {memberUser.avatarUrl ? (
                          <img src={memberUser.avatarUrl} alt="" className="h-8 w-8 rounded-full" />
                        ) : (
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-sm font-medium text-gray-600">
                            {memberUser.firstName?.[0]}
                            {memberUser.lastName?.[0]}
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {memberUser.firstName} {memberUser.lastName}
                          </p>
                          <p className="text-xs text-gray-500">{memberUser.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700">
                          {roleIcon}
                          {roleLabel}
                        </span>
                        {member.role !== 'owner' && (
                          <button
                            onClick={() => handleRemoveMember(member.id)}
                            disabled={removingId === member.id}
                            className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                            title="Remove member"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>

              <Separator />

              {/* Add New Member */}
              <div className="space-y-3">
                <h3 className="flex items-center gap-2 text-sm font-medium text-gray-900">
                  <UserPlus className="h-4 w-4" />
                  Add Team Member
                </h3>
                <p className="text-xs text-gray-500">
                  Add a wedding planner, coordinator, or family member to help plan. They&apos;ll
                  receive an email invitation to join your planning team.
                </p>
                <div className="flex gap-3">
                  <Input
                    type="email"
                    value={newMemberEmail}
                    onChange={(e) => setNewMemberEmail(e.target.value)}
                    placeholder="email@example.com"
                    className="flex-1"
                  />
                  <select
                    value={newMemberRole}
                    onChange={(e) => setNewMemberRole(e.target.value as 'planner' | 'family')}
                    className="rounded-xl border border-gray-300 px-3 py-2 text-sm"
                  >
                    <option value="planner">Planner</option>
                    <option value="family">Family</option>
                  </select>
                  <Button
                    onClick={handleAddMember}
                    disabled={!newMemberEmail.trim() || addingMember}
                  >
                    {addingMember ? 'Adding...' : 'Add'}
                  </Button>
                </div>
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
                      toast.error('Failed to export data')
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
