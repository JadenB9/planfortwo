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
import type { Wedding, NotificationPreference, PartnerInvitation } from '@planfortwo/types'
import {
  UserPlus,
  Trash2,
  Crown,
  Heart,
  Users,
  Mail,
  Clock,
  XCircle,
  Palette,
  Check,
} from 'lucide-react'
import { useTheme } from '@/components/theme-provider'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'

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
  const [pendingInvitations, setPendingInvitations] = useState<PartnerInvitation[]>([])
  const [partnerEmail, setPartnerEmail] = useState('')
  const [invitingPartner, setInvitingPartner] = useState(false)
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
  const [cancellingInvite, setCancellingInvite] = useState(false)
  const [cancelTeamDialogId, setCancelTeamDialogId] = useState<string | null>(null)
  const [removePartnerDialogOpen, setRemovePartnerDialogOpen] = useState(false)

  // Theme state
  const { setThemeColors: applyTheme } = useTheme()
  const [selectedPrimary, setSelectedPrimary] = useState<string | null>(null)
  const [selectedAccent, setSelectedAccent] = useState<string | null>(null)
  const [themeSaving, setThemeSaving] = useState(false)

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

      // Initialize theme state from wedding data
      if (w.themeColors) {
        setSelectedPrimary(w.themeColors.primary)
        setSelectedAccent(w.themeColors.accent)
      }

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

      try {
        const { data: invites } = await api.weddings.getPendingInvitations(w.id, token)
        setPendingInvitations(invites)
      } catch {
        /* no pending invitations */
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
      // Re-fetch pending invitations so new team invites appear
      try {
        const { data: invites } = await api.weddings.getPendingInvitations(weddingId, token)
        setPendingInvitations(invites)
      } catch {
        /* ignore */
      }
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

  const hasPartner = members.some(({ member }) => member.role === 'partner')
  const pendingPartnerInvite = pendingInvitations.find(
    (i) => i.status === 'pending' && i.role === 'partner',
  )
  const pendingTeamInvites = pendingInvitations.filter(
    (i) => i.status === 'pending' && i.role !== 'partner',
  )
  const isOwner = members.some(
    ({ member, user: u }) =>
      member.role === 'owner' && u.email === user?.primaryEmailAddress?.emailAddress,
  )

  const handleInvitePartner = useCallback(async () => {
    if (!weddingId || !partnerEmail.trim()) return
    setInvitingPartner(true)
    try {
      const token = await getToken()
      if (!token) return
      const { data: invitation } = await api.weddings.invitePartner(
        weddingId,
        { email: partnerEmail },
        token,
      )
      setPendingInvitations((prev) => [...prev, invitation])
      setPartnerEmail('')
      toast.success('Partner invitation sent!')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to send invitation')
    } finally {
      setInvitingPartner(false)
    }
  }, [weddingId, getToken, partnerEmail])

  const handleCancelInvitation = useCallback(
    async (invitationId?: string) => {
      const targetId = invitationId ?? pendingPartnerInvite?.id
      if (!weddingId || !targetId) return
      setCancellingInvite(true)
      try {
        const token = await getToken()
        if (!token) return
        await api.weddings.cancelInvitation(weddingId, targetId, token)
        setPendingInvitations((prev) => prev.filter((i) => i.id !== targetId))
        setCancelDialogOpen(false)
        setCancelTeamDialogId(null)
        toast.success('Invitation cancelled')
      } catch {
        toast.error('Failed to cancel invitation')
      } finally {
        setCancellingInvite(false)
      }
    },
    [weddingId, getToken, pendingPartnerInvite],
  )

  const handleSaveTheme = useCallback(async () => {
    if (!weddingId) return
    setThemeSaving(true)
    try {
      const token = await getToken()
      if (!token) return
      const themeColors =
        selectedPrimary && selectedAccent
          ? { primary: selectedPrimary, accent: selectedAccent }
          : null
      await api.weddings.update(weddingId, { themeColors }, token)
      applyTheme(themeColors)
      toast.success('Theme colors saved')
    } catch {
      toast.error('Failed to save theme')
    } finally {
      setThemeSaving(false)
    }
  }, [weddingId, getToken, selectedPrimary, selectedAccent, applyTheme])

  const handleResetTheme = useCallback(async () => {
    if (!weddingId) return
    setThemeSaving(true)
    try {
      const token = await getToken()
      if (!token) return
      await api.weddings.update(weddingId, { themeColors: null }, token)
      setSelectedPrimary(null)
      setSelectedAccent(null)
      applyTheme(null)
      toast.success('Theme reset to default')
    } catch {
      toast.error('Failed to reset theme')
    } finally {
      setThemeSaving(false)
    }
  }, [weddingId, getToken, applyTheme])

  // Color presets
  const primaryPresets = [
    { name: 'Default Orange', hex: '#c2674a' },
    { name: 'Pastel Yellow', hex: '#e8c547' },
    { name: 'Blush Pink', hex: '#d4899e' },
    { name: 'Dusty Rose', hex: '#c9817a' },
    { name: 'Sage Green', hex: '#7a9a7d' },
    { name: 'Lavender', hex: '#9b8ec4' },
    { name: 'Sky Blue', hex: '#6ba3c7' },
    { name: 'Coral', hex: '#e07b5f' },
    { name: 'Gold', hex: '#c4963d' },
    { name: 'Burgundy', hex: '#8b3a4a' },
    { name: 'Teal', hex: '#4a8b8b' },
    { name: 'Mauve', hex: '#a87793' },
  ]

  const accentPresets = [
    { name: 'Default Black', hex: '#1a1a1a' },
    { name: 'Navy Blue', hex: '#1e3a5f' },
    { name: 'Charcoal', hex: '#36454f' },
    { name: 'Deep Forest', hex: '#2d3e2f' },
    { name: 'Espresso', hex: '#3c2415' },
    { name: 'Midnight', hex: '#191970' },
    { name: 'Dark Plum', hex: '#4a2040' },
    { name: 'Slate', hex: '#4a5568' },
    { name: 'Dark Teal', hex: '#1a4040' },
    { name: 'Graphite', hex: '#2d2d2d' },
  ]

  const isFull = wedding?.tier === 'full'

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
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
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
                        {member.role !== 'owner' && member.role !== 'partner' && (
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

              {/* Partner Section */}
              {isOwner && (
                <>
                  <Separator />
                  <div className="space-y-3">
                    <h3 className="flex items-center gap-2 text-sm font-medium text-gray-900">
                      <Heart className="h-4 w-4 text-pink-500" />
                      {hasPartner ? 'Your Partner' : 'Invite Your Partner'}
                    </h3>
                    {hasPartner ? (
                      <>
                        {(() => {
                          const partnerEntry = members.find(
                            ({ member }) => member.role === 'partner',
                          )
                          if (!partnerEntry) return null
                          const { member: partnerMember, user: partnerUser } = partnerEntry
                          return (
                            <div className="flex items-center justify-between rounded-xl border border-pink-200 bg-pink-50 px-4 py-3">
                              <div className="flex items-center gap-3">
                                {partnerUser.avatarUrl ? (
                                  <img
                                    src={partnerUser.avatarUrl}
                                    alt=""
                                    className="h-8 w-8 rounded-full"
                                  />
                                ) : (
                                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-pink-100 text-sm font-medium text-pink-600">
                                    {partnerUser.firstName?.[0]}
                                    {partnerUser.lastName?.[0]}
                                  </div>
                                )}
                                <div>
                                  <p className="text-sm font-medium text-gray-900">
                                    {partnerUser.firstName} {partnerUser.lastName}
                                  </p>
                                  <p className="text-xs text-gray-500">{partnerUser.email}</p>
                                </div>
                              </div>
                              <button
                                onClick={() => setRemovePartnerDialogOpen(true)}
                                disabled={removingId === partnerMember.id}
                                className="rounded-lg px-3 py-1.5 text-sm text-gray-500 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          )
                        })()}

                        <Dialog
                          open={removePartnerDialogOpen}
                          onOpenChange={setRemovePartnerDialogOpen}
                        >
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Remove Partner</DialogTitle>
                              <DialogDescription>
                                Are you sure you want to remove your partner from this wedding? They
                                will lose access to all wedding planning data. You can invite them
                                again later.
                              </DialogDescription>
                            </DialogHeader>
                            <DialogFooter>
                              <Button
                                variant="outline"
                                onClick={() => setRemovePartnerDialogOpen(false)}
                              >
                                Keep Partner
                              </Button>
                              <Button
                                variant="destructive"
                                onClick={async () => {
                                  const partnerEntry = members.find(
                                    ({ member }) => member.role === 'partner',
                                  )
                                  if (partnerEntry) {
                                    await handleRemoveMember(partnerEntry.member.id)
                                    setRemovePartnerDialogOpen(false)
                                  }
                                }}
                                disabled={removingId !== null}
                              >
                                {removingId ? 'Removing...' : 'Remove Partner'}
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </>
                    ) : pendingPartnerInvite ? (
                      <>
                        <div className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                          <Clock className="h-4 w-4 text-amber-600" />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">Invitation Pending</p>
                            <p className="text-xs text-gray-500">
                              Sent to{' '}
                              <span className="font-medium text-gray-700">
                                {pendingPartnerInvite.email}
                              </span>{' '}
                              &mdash; waiting for them to accept.
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-1">
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
                                ? They will no longer be able to accept it, but you can send a new
                                one afterward.
                              </DialogDescription>
                            </DialogHeader>
                            <DialogFooter>
                              <Button variant="outline" onClick={() => setCancelDialogOpen(false)}>
                                Keep Invitation
                              </Button>
                              <Button
                                variant="destructive"
                                onClick={() => handleCancelInvitation()}
                                disabled={cancellingInvite}
                              >
                                {cancellingInvite ? 'Cancelling...' : 'Cancel Invitation'}
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </>
                    ) : (
                      <>
                        <p className="text-xs text-gray-500">
                          Invite your partner so you can plan together. They&apos;ll receive an
                          email invitation to join your wedding.
                        </p>
                        <div className="flex gap-3">
                          <Input
                            type="email"
                            value={partnerEmail}
                            onChange={(e) => setPartnerEmail(e.target.value)}
                            placeholder="partner@email.com"
                            className="flex-1"
                          />
                          <Button
                            onClick={handleInvitePartner}
                            disabled={!partnerEmail.trim() || invitingPartner}
                          >
                            {invitingPartner ? 'Sending...' : 'Send Invite'}
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                </>
              )}

              <Separator />

              {/* Pending Team Invitations */}
              {pendingTeamInvites.length > 0 && (
                <div className="space-y-3">
                  <h3 className="flex items-center gap-2 text-sm font-medium text-gray-900">
                    <Clock className="h-4 w-4 text-amber-500" />
                    Pending Team Invitations
                  </h3>
                  {pendingTeamInvites.map((invite) => (
                    <div
                      key={invite.id}
                      className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3"
                    >
                      <Clock className="h-4 w-4 shrink-0 text-amber-600" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900">Invitation Pending</p>
                        <p className="truncate text-xs text-gray-500">
                          Sent to <span className="font-medium text-gray-700">{invite.email}</span>{' '}
                          &mdash; waiting for them to accept.
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <span className="flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium capitalize text-gray-700">
                          {invite.role === 'planner' ? (
                            <Users className="h-3.5 w-3.5 text-blue-500" />
                          ) : (
                            <Users className="h-3.5 w-3.5 text-purple-500" />
                          )}
                          {invite.role}
                        </span>
                        <div className="flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-1">
                          <Mail className="h-3.5 w-3.5 text-amber-600" />
                          <span className="text-xs font-medium text-amber-700">Sent</span>
                        </div>
                        <button
                          onClick={() => setCancelTeamDialogId(invite.id)}
                          className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600"
                          title="Cancel invitation"
                        >
                          <XCircle className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* Cancel team invite dialog */}
                  <Dialog
                    open={cancelTeamDialogId !== null}
                    onOpenChange={(open) => {
                      if (!open) setCancelTeamDialogId(null)
                    }}
                  >
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Cancel Team Invitation</DialogTitle>
                        <DialogDescription>
                          Are you sure you want to cancel the invitation sent to{' '}
                          <span className="font-medium text-gray-700">
                            {pendingTeamInvites.find((i) => i.id === cancelTeamDialogId)?.email}
                          </span>
                          ? They will no longer be able to accept it, but you can send a new one
                          afterward.
                        </DialogDescription>
                      </DialogHeader>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setCancelTeamDialogId(null)}>
                          Keep Invitation
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={() => handleCancelInvitation(cancelTeamDialogId!)}
                          disabled={cancellingInvite}
                        >
                          {cancellingInvite ? 'Cancelling...' : 'Cancel Invitation'}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              )}

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

        <TabsContent value="appearance">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Theme Colors
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {!isFull ? (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                  <p className="font-medium text-amber-800">Upgrade to customize your theme</p>
                  <p className="mt-1 text-sm text-amber-600">
                    Custom theme colors are available on the full plan. Upgrade to personalize your
                    dashboard colors.
                  </p>
                  <Button
                    variant="outline"
                    className="mt-3"
                    onClick={() => (window.location.href = '/upgrade')}
                  >
                    View Plans
                  </Button>
                </div>
              ) : (
                <>
                  <p className="text-sm text-gray-600">
                    Choose your primary and accent colors to personalize your planning dashboard.
                    These colors are shared with your partner and persist across all sessions.
                  </p>

                  {/* Primary Color */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-medium text-gray-900">
                      Primary Color{' '}
                      <span className="font-normal text-gray-500">
                        (buttons, links, highlights)
                      </span>
                    </h3>
                    <div className="grid grid-cols-4 gap-3 sm:grid-cols-6">
                      {primaryPresets.map((preset) => (
                        <button
                          key={preset.hex}
                          onClick={() => setSelectedPrimary(preset.hex)}
                          className={`group relative flex flex-col items-center gap-1.5 rounded-xl border-2 p-3 transition-all ${
                            selectedPrimary === preset.hex
                              ? 'border-gray-900 shadow-md'
                              : !selectedPrimary && preset.hex === '#c2674a'
                                ? 'border-gray-300'
                                : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div
                            className="h-8 w-8 rounded-full shadow-inner"
                            style={{ backgroundColor: preset.hex }}
                          />
                          {selectedPrimary === preset.hex && (
                            <div className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-gray-900">
                              <Check className="h-3 w-3 text-white" />
                            </div>
                          )}
                          <span className="text-[10px] leading-tight text-gray-500">
                            {preset.name}
                          </span>
                        </button>
                      ))}
                    </div>
                    <div className="flex items-center gap-3">
                      <Label className="text-xs text-gray-500">Custom hex:</Label>
                      <Input
                        type="text"
                        value={selectedPrimary ?? '#c2674a'}
                        onChange={(e) => {
                          const val = e.target.value
                          if (/^#[0-9a-fA-F]{0,6}$/.test(val)) {
                            setSelectedPrimary(val)
                          }
                        }}
                        className="w-32 font-mono text-sm"
                        placeholder="#c2674a"
                      />
                      <div
                        className="h-6 w-6 rounded-full border border-gray-300"
                        style={{ backgroundColor: selectedPrimary ?? '#c2674a' }}
                      />
                    </div>
                  </div>

                  <Separator />

                  {/* Accent Color */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-medium text-gray-900">
                      Accent Color{' '}
                      <span className="font-normal text-gray-500">
                        (headings, body text, dark elements)
                      </span>
                    </h3>
                    <div className="grid grid-cols-4 gap-3 sm:grid-cols-5">
                      {accentPresets.map((preset) => (
                        <button
                          key={preset.hex}
                          onClick={() => setSelectedAccent(preset.hex)}
                          className={`group relative flex flex-col items-center gap-1.5 rounded-xl border-2 p-3 transition-all ${
                            selectedAccent === preset.hex
                              ? 'border-gray-900 shadow-md'
                              : !selectedAccent && preset.hex === '#1a1a1a'
                                ? 'border-gray-300'
                                : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div
                            className="h-8 w-8 rounded-full shadow-inner"
                            style={{ backgroundColor: preset.hex }}
                          />
                          {selectedAccent === preset.hex && (
                            <div className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-gray-900">
                              <Check className="h-3 w-3 text-white" />
                            </div>
                          )}
                          <span className="text-[10px] leading-tight text-gray-500">
                            {preset.name}
                          </span>
                        </button>
                      ))}
                    </div>
                    <div className="flex items-center gap-3">
                      <Label className="text-xs text-gray-500">Custom hex:</Label>
                      <Input
                        type="text"
                        value={selectedAccent ?? '#1a1a1a'}
                        onChange={(e) => {
                          const val = e.target.value
                          if (/^#[0-9a-fA-F]{0,6}$/.test(val)) {
                            setSelectedAccent(val)
                          }
                        }}
                        className="w-32 font-mono text-sm"
                        placeholder="#1a1a1a"
                      />
                      <div
                        className="h-6 w-6 rounded-full border border-gray-300"
                        style={{ backgroundColor: selectedAccent ?? '#1a1a1a' }}
                      />
                    </div>
                  </div>

                  <Separator />

                  {/* Preview */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-medium text-gray-900">Preview</h3>
                    <div className="rounded-xl border border-gray-200 p-4">
                      <div className="flex items-center gap-4">
                        <div
                          className="flex h-10 items-center rounded-lg px-4 text-sm font-medium text-white"
                          style={{
                            backgroundColor: selectedPrimary ?? '#c2674a',
                          }}
                        >
                          Sample Button
                        </div>
                        <p
                          className="font-serif text-lg font-bold"
                          style={{ color: selectedAccent ?? '#1a1a1a' }}
                        >
                          Heading Text
                        </p>
                        <p className="text-sm" style={{ color: selectedAccent ?? '#1a1a1a' }}>
                          Body text
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-3">
                    <Button onClick={handleSaveTheme} disabled={themeSaving}>
                      {themeSaving ? 'Saving...' : 'Save Theme'}
                    </Button>
                    <Button variant="outline" onClick={handleResetTheme} disabled={themeSaving}>
                      Reset to Default
                    </Button>
                  </div>
                </>
              )}
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
