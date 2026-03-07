'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from '@clerk/nextjs'
import { motion, AnimatePresence } from 'framer-motion'
import DOMPurify from 'dompurify'
import { springSmooth, fadeInUp, staggerContainer, listItem } from '@/lib/animations'
import { api } from '@/lib/api'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import {
  Mail,
  Send,
  Star,
  StarOff,
  Trash2,
  Reply,
  Paperclip,
  Search,
  Inbox,
  Clock,
  Check,
  Download,
  X,
  Plus,
  Megaphone,
  MailOpen,
  RefreshCw,
  AtSign,
  Loader2,
  Eye,
  EyeOff,
} from 'lucide-react'
import type { Email, EmailAddress, EmailAttachment } from '@planfortwo/types'

// ── Campaign types & constants ──

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

// ── Inbox filter type ──

type InboxFilter = 'all' | 'inbound' | 'outbound' | 'unread' | 'starred'

// ── File type icon helper ──

function getFileIcon(contentType: string) {
  if (contentType.startsWith('image/')) return '🖼'
  if (contentType.includes('pdf')) return '📄'
  if (
    contentType.includes('spreadsheet') ||
    contentType.includes('excel') ||
    contentType.includes('csv')
  )
    return '📊'
  if (contentType.includes('word') || contentType.includes('document')) return '📝'
  if (contentType.includes('zip') || contentType.includes('archive')) return '📦'
  return '📎'
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

// ── Compose attachment type (local UI state) ──

interface LocalAttachment {
  id: string
  file: File
  filename: string
  contentType: string
  size: number
}

export default function CommunicationPage() {
  const { getToken } = useAuth()
  const [mainTab, setMainTab] = useState<'inbox' | 'campaigns'>('inbox')

  // ══════════════════════════════════════════════
  //  INBOX STATE
  // ══════════════════════════════════════════════

  const [inboxLoading, setInboxLoading] = useState(true)
  const [addresses, setAddresses] = useState<EmailAddress[]>([])
  const [emailList, setEmailList] = useState<Email[]>([])
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null)
  const [inboxFilter, setInboxFilter] = useState<InboxFilter>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [totalEmails, setTotalEmails] = useState(0)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  // Claim form
  const [claimAddress, setClaimAddress] = useState('')
  const [claimDisplayName, setClaimDisplayName] = useState('')
  const [claimLoading, setClaimLoading] = useState(false)
  const [claimError, setClaimError] = useState('')
  const [availability, setAvailability] = useState<{ available: boolean; reason?: string } | null>(
    null,
  )
  const [checkingAvailability, setCheckingAvailability] = useState(false)

  // Compose email
  const [showComposeEmail, setShowComposeEmail] = useState(false)
  const [composeForm, setComposeForm] = useState({
    toAddress: '',
    subject: '',
    textBody: '',
  })
  const [composeAttachments, setComposeAttachments] = useState<LocalAttachment[]>([])
  const [sendingEmail, setSendingEmail] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // ══════════════════════════════════════════════
  //  CAMPAIGN STATE
  // ══════════════════════════════════════════════

  const [campaignLoading, setCampaignLoading] = useState(true)
  const [weddingId, setWeddingId] = useState<string | null>(null)
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [showComposeCampaign, setShowComposeCampaign] = useState(false)
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null)
  const [campaignForm, setCampaignForm] = useState({
    subject: '',
    body: '',
    templateType: 'custom',
    scheduledAt: '',
  })

  // ══════════════════════════════════════════════
  //  INBOX DATA LOADING
  // ══════════════════════════════════════════════

  const fetchAddresses = useCallback(async () => {
    const token = await getToken()
    if (!token) return
    try {
      const res = await api.inbox.addresses.list(token)
      setAddresses(res.data)
    } catch {
      toast.error('Failed to load email addresses')
    }
  }, [getToken])

  const fetchEmails = useCallback(async () => {
    const token = await getToken()
    if (!token) return

    const filters: Record<string, string | number | boolean> = { page, pageSize: 20 }
    if (inboxFilter === 'inbound') filters.direction = 'inbound'
    if (inboxFilter === 'outbound') filters.direction = 'outbound'
    if (inboxFilter === 'unread') filters.isRead = false
    if (inboxFilter === 'starred') filters.isStarred = true
    if (searchQuery.trim()) filters.search = searchQuery.trim()

    try {
      const res = await api.inbox.list(token, filters)
      setEmailList(res.data)
      setTotalEmails(res.total)
      setHasMore(res.hasMore)
    } catch {
      toast.error('Failed to load emails')
      setEmailList([])
    }
  }, [getToken, page, inboxFilter, searchQuery])

  const fetchUnreadCount = useCallback(async () => {
    const token = await getToken()
    if (!token) return
    try {
      const res = await api.inbox.unreadCount(token)
      setUnreadCount(res.data.count)
    } catch {
      // silent fail
    }
  }, [getToken])

  useEffect(() => {
    async function init() {
      setInboxLoading(true)
      await fetchAddresses()
      setInboxLoading(false)
    }
    void init()
  }, [fetchAddresses])

  useEffect(() => {
    if (addresses.length > 0) {
      void fetchEmails()
      void fetchUnreadCount()
    }
  }, [addresses.length, fetchEmails, fetchUnreadCount])

  // ── Availability check with debounce ──

  const handleCheckAvailability = useCallback(
    async (address: string) => {
      if (address.length < 3) {
        setAvailability(null)
        return
      }
      setCheckingAvailability(true)
      try {
        const token = await getToken()
        if (!token) return
        const res = await api.inbox.addresses.checkAvailability(address, token)
        setAvailability(res.data)
      } catch {
        setAvailability(null)
      } finally {
        setCheckingAvailability(false)
      }
    },
    [getToken],
  )

  useEffect(() => {
    const timer = setTimeout(() => {
      if (claimAddress.length >= 3) {
        void handleCheckAvailability(claimAddress)
      }
    }, 400)
    return () => clearTimeout(timer)
  }, [claimAddress, handleCheckAvailability])

  // ── Search debounce ──

  const [debouncedSearch, setDebouncedSearch] = useState('')

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery)
    }, 400)
    return () => clearTimeout(timer)
  }, [searchQuery])

  useEffect(() => {
    if (addresses.length > 0) {
      setPage(1)
    }
  }, [debouncedSearch, addresses.length])

  // ══════════════════════════════════════════════
  //  INBOX ACTIONS
  // ══════════════════════════════════════════════

  const handleClaim = useCallback(async () => {
    const token = await getToken()
    if (!token) return

    setClaimLoading(true)
    setClaimError('')
    try {
      await api.inbox.addresses.claim(
        { address: claimAddress, displayName: claimDisplayName },
        token,
      )
      toast.success('Email address claimed!')
      await fetchAddresses()
    } catch (err) {
      setClaimError(err instanceof Error ? err.message : 'Failed to claim address')
    } finally {
      setClaimLoading(false)
    }
  }, [getToken, claimAddress, claimDisplayName, fetchAddresses])

  const handleSelectEmail = useCallback(
    async (email: Email) => {
      const token = await getToken()
      if (!token) return

      try {
        const res = await api.inbox.get(email.id, token)
        setSelectedEmail(res.data)
        if (!email.isRead) {
          await api.inbox.update(email.id, { isRead: true }, token)
          setEmailList((prev) => prev.map((e) => (e.id === email.id ? { ...e, isRead: true } : e)))
          setUnreadCount((c) => Math.max(0, c - 1))
        }
      } catch {
        toast.error('Failed to load email')
        setSelectedEmail(email)
      }
    },
    [getToken],
  )

  const handleToggleStar = useCallback(
    async (email: Email, e: React.MouseEvent) => {
      e.stopPropagation()
      const token = await getToken()
      if (!token) return

      try {
        const res = await api.inbox.update(email.id, { isStarred: !email.isStarred }, token)
        setEmailList((prev) => prev.map((em) => (em.id === email.id ? res.data : em)))
        if (selectedEmail?.id === email.id) setSelectedEmail(res.data)
      } catch {
        toast.error('Failed to update email')
      }
    },
    [getToken, selectedEmail],
  )

  const handleToggleRead = useCallback(
    async (email: Email) => {
      const token = await getToken()
      if (!token) return

      try {
        const res = await api.inbox.update(email.id, { isRead: !email.isRead }, token)
        setEmailList((prev) => prev.map((em) => (em.id === email.id ? res.data : em)))
        if (selectedEmail?.id === email.id) setSelectedEmail(res.data)
        setUnreadCount((c) => (email.isRead ? c + 1 : Math.max(0, c - 1)))
      } catch {
        toast.error('Failed to update email')
      }
    },
    [getToken, selectedEmail],
  )

  const handleDeleteEmail = useCallback(
    async (emailId: string) => {
      const token = await getToken()
      if (!token) return

      try {
        await api.inbox.delete(emailId, token)
        toast.success('Email deleted')
        setEmailList((prev) => prev.filter((e) => e.id !== emailId))
        if (selectedEmail?.id === emailId) setSelectedEmail(null)
      } catch {
        toast.error('Failed to delete email')
      }
    },
    [getToken, selectedEmail],
  )

  const handleSendEmail = useCallback(async () => {
    const token = await getToken()
    if (!token || addresses.length === 0) return

    setSendingEmail(true)
    try {
      const attachmentData = composeAttachments.map((a) => ({
        id: a.id,
        filename: a.filename,
        contentType: a.contentType,
        size: a.size,
      }))

      await api.inbox.send(
        {
          emailAddressId: addresses[0]!.id,
          toAddress: composeForm.toAddress,
          subject: composeForm.subject,
          textBody: composeForm.textBody,
          ...(attachmentData.length > 0 ? { attachments: attachmentData } : {}),
        },
        token,
      )
      toast.success('Email sent!')
      setShowComposeEmail(false)
      setComposeForm({ toAddress: '', subject: '', textBody: '' })
      setComposeAttachments([])
      await fetchEmails()
    } catch {
      toast.error('Failed to send email')
    } finally {
      setSendingEmail(false)
    }
  }, [getToken, addresses, composeForm, composeAttachments, fetchEmails])

  const handleReply = useCallback((email: Email) => {
    setComposeForm({
      toAddress: email.direction === 'inbound' ? email.fromAddress : email.toAddress,
      subject: email.subject.startsWith('Re:') ? email.subject : `Re: ${email.subject}`,
      textBody: '',
    })
    setComposeAttachments([])
    setShowComposeEmail(true)
  }, [])

  // ── Attachment handlers ──

  const handleFileSelect = useCallback(
    (files: FileList | null) => {
      if (!files) return
      const newAttachments: LocalAttachment[] = []
      for (let i = 0; i < files.length; i++) {
        const file = files[i]!
        if (composeAttachments.length + newAttachments.length >= 10) {
          toast.error('Maximum 10 attachments allowed')
          break
        }
        if (file.size > 25 * 1024 * 1024) {
          toast.error(`${file.name} is too large (max 25MB)`)
          continue
        }
        newAttachments.push({
          id: crypto.randomUUID(),
          file,
          filename: file.name,
          contentType: file.type || 'application/octet-stream',
          size: file.size,
        })
      }
      setComposeAttachments((prev) => [...prev, ...newAttachments])
    },
    [composeAttachments.length],
  )

  const handleRemoveAttachment = useCallback((id: string) => {
    setComposeAttachments((prev) => prev.filter((a) => a.id !== id))
  }, [])

  // ── Helpers ──

  const formatDate = useCallback((date: Date | string) => {
    const d = new Date(date)
    const now = new Date()
    const isToday = d.toDateString() === now.toDateString()
    if (isToday) return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' })
  }, [])

  const getSnippet = useCallback((email: Email) => {
    const text = email.textBody ?? ''
    return text.length > 100 ? text.slice(0, 100) + '...' : text
  }, [])

  // ══════════════════════════════════════════════
  //  CAMPAIGN DATA LOADING
  // ══════════════════════════════════════════════

  const loadCampaigns = useCallback(async () => {
    try {
      const token = await getToken()
      if (!token) return
      const { data: dashData } = await api.weddings.mine(token)
      const wId = dashData.wedding.id
      setWeddingId(wId)
      const { data } = await api.emailCampaigns.list(wId, token)
      setCampaigns(data)
    } catch {
      toast.error('Failed to load campaigns')
    } finally {
      setCampaignLoading(false)
    }
  }, [getToken])

  useEffect(() => {
    if (mainTab === 'campaigns') {
      void loadCampaigns()
    }
  }, [mainTab, loadCampaigns])

  // ══════════════════════════════════════════════
  //  CAMPAIGN ACTIONS
  // ══════════════════════════════════════════════

  const handleSaveCampaign = useCallback(async () => {
    if (!weddingId) return
    try {
      const token = await getToken()
      if (!token) return
      if (editingCampaign) {
        await api.emailCampaigns.update(
          editingCampaign.id,
          weddingId,
          {
            subject: campaignForm.subject,
            body: campaignForm.body,
            templateType: campaignForm.templateType as 'custom',
            scheduledAt: campaignForm.scheduledAt
              ? new Date(campaignForm.scheduledAt).toISOString()
              : null,
          },
          token,
        )
      } else {
        await api.emailCampaigns.create(
          {
            weddingId,
            subject: campaignForm.subject,
            body: campaignForm.body,
            templateType: campaignForm.templateType as 'custom',
            scheduledAt: campaignForm.scheduledAt
              ? new Date(campaignForm.scheduledAt).toISOString()
              : null,
          },
          token,
        )
      }
      toast.success(editingCampaign ? 'Campaign updated' : 'Campaign saved')
      setShowComposeCampaign(false)
      setEditingCampaign(null)
      setCampaignForm({ subject: '', body: '', templateType: 'custom', scheduledAt: '' })
      void loadCampaigns()
    } catch {
      toast.error('Failed to save campaign')
    }
  }, [weddingId, getToken, editingCampaign, campaignForm, loadCampaigns])

  const handleDeleteCampaign = useCallback(
    async (id: string) => {
      if (!weddingId) return
      try {
        const token = await getToken()
        if (!token) return
        await api.emailCampaigns.delete(id, weddingId, token)
        toast.success('Campaign deleted')
        void loadCampaigns()
      } catch {
        toast.error('Failed to delete campaign')
      }
    },
    [weddingId, getToken, loadCampaigns],
  )

  // ══════════════════════════════════════════════
  //  LOADING STATE
  // ══════════════════════════════════════════════

  if (inboxLoading && mainTab === 'inbox') {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="text-wedding-600 h-8 w-8 animate-spin" />
      </div>
    )
  }

  // ══════════════════════════════════════════════
  //  RENDER
  // ══════════════════════════════════════════════

  return (
    <motion.div
      className="mx-auto max-w-6xl"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ...springSmooth }}
    >
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="font-serif text-3xl font-bold text-gray-900">Communication</h1>
        <p className="mt-1 text-sm text-gray-600">
          Manage your inbox and email campaigns in one place.
        </p>
      </div>

      {/* Main Tabs */}
      <Tabs value={mainTab} onValueChange={(v) => setMainTab(v as 'inbox' | 'campaigns')}>
        <TabsList className="mb-6">
          <TabsTrigger value="inbox" className="gap-1.5">
            <Inbox className="h-4 w-4" />
            Inbox
            {unreadCount > 0 && (
              <Badge className="bg-wedding-600 ml-1 h-5 min-w-[20px] px-1.5 text-[10px] text-white">
                {unreadCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="campaigns" className="gap-1.5">
            <Megaphone className="h-4 w-4" />
            Campaigns
          </TabsTrigger>
        </TabsList>

        {/* ════════════════════════════════════════ */}
        {/*  TAB 1: INBOX                           */}
        {/* ════════════════════════════════════════ */}
        <TabsContent value="inbox">
          {addresses.length === 0 ? (
            /* ── Claim Address Setup ── */
            <motion.div
              className="mx-auto max-w-lg"
              variants={fadeInUp}
              initial="hidden"
              animate="visible"
              transition={springSmooth}
            >
              <Card>
                <CardContent className="p-8">
                  <div className="mb-6 text-center">
                    <div className="bg-wedding-50 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full">
                      <AtSign className="text-wedding-600 h-8 w-8" />
                    </div>
                    <h2 className="mb-2 font-serif text-2xl font-bold text-gray-900">
                      Claim Your Email Address
                    </h2>
                    <p className="text-gray-500">
                      Get your own <span className="font-medium">@planfortwo.com</span> email
                      address to send and receive messages from your guests.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="claim-address">Email Address</Label>
                      <div className="mt-1 flex items-center gap-2">
                        <Input
                          id="claim-address"
                          placeholder="yourname"
                          value={claimAddress}
                          onChange={(e) => setClaimAddress(e.target.value.toLowerCase())}
                          className="flex-1"
                        />
                        <span className="whitespace-nowrap text-sm text-gray-500">
                          @planfortwo.com
                        </span>
                      </div>
                      {checkingAvailability && (
                        <p className="mt-1 text-sm text-gray-400">Checking availability...</p>
                      )}
                      {availability && !checkingAvailability && (
                        <p
                          className={`mt-1 text-sm ${availability.available ? 'text-green-600' : 'text-red-500'}`}
                        >
                          {availability.available ? (
                            <span className="flex items-center gap-1">
                              <Check className="h-3 w-3" /> Available
                            </span>
                          ) : (
                            (availability.reason ?? 'Not available')
                          )}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="claim-display-name">Display Name</Label>
                      <Input
                        id="claim-display-name"
                        placeholder="Your Name"
                        value={claimDisplayName}
                        onChange={(e) => setClaimDisplayName(e.target.value)}
                        className="mt-1"
                      />
                    </div>

                    {claimAddress && claimDisplayName && (
                      <div className="bg-wedding-50 rounded-lg p-3 text-sm">
                        <span className="text-gray-500">Preview: </span>
                        <span className="font-medium text-gray-800">
                          {claimDisplayName} &lt;{claimAddress}@planfortwo.com&gt;
                        </span>
                      </div>
                    )}

                    {claimError && <p className="text-sm text-red-500">{claimError}</p>}

                    <Button
                      onClick={handleClaim}
                      disabled={
                        claimLoading ||
                        !claimAddress ||
                        !claimDisplayName ||
                        (availability !== null && !availability.available)
                      }
                      className="bg-wedding-600 hover:bg-wedding-700 w-full"
                    >
                      {claimLoading ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Mail className="mr-2 h-4 w-4" />
                      )}
                      Claim Address
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            /* ── Inbox View ── */
            <div>
              {/* Inbox Header Bar */}
              <motion.div
                variants={fadeInUp}
                initial="hidden"
                animate="visible"
                transition={springSmooth}
                className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="bg-wedding-50 flex h-9 w-9 items-center justify-center rounded-full">
                    <Mail className="text-wedding-600 h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {addresses[0]!.address}@planfortwo.com
                    </p>
                    <p className="text-xs text-gray-500">
                      {totalEmails} message{totalEmails !== 1 ? 's' : ''}
                      {unreadCount > 0 && ` \u00b7 ${unreadCount} unread`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1 sm:w-56 sm:flex-initial">
                    <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <Input
                      placeholder="Search emails..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 text-sm"
                    />
                  </div>
                  <Button variant="outline" size="sm" onClick={fetchEmails}>
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    className="bg-wedding-600 hover:bg-wedding-700"
                    onClick={() => {
                      setComposeForm({ toAddress: '', subject: '', textBody: '' })
                      setComposeAttachments([])
                      setShowComposeEmail(true)
                    }}
                  >
                    <Plus className="mr-1 h-4 w-4" />
                    Compose
                  </Button>
                </div>
              </motion.div>

              {/* Filter Tabs */}
              <motion.div
                variants={fadeInUp}
                initial="hidden"
                animate="visible"
                transition={springSmooth}
                className="mb-4"
              >
                <div className="flex flex-wrap gap-1.5">
                  {(
                    [
                      { key: 'all', label: 'All', icon: null },
                      { key: 'inbound', label: 'Inbox', icon: Inbox },
                      { key: 'outbound', label: 'Sent', icon: Send },
                      { key: 'unread', label: 'Unread', icon: Mail },
                      { key: 'starred', label: 'Starred', icon: Star },
                    ] as const
                  ).map(({ key, label, icon: Icon }) => (
                    <Button
                      key={key}
                      variant={inboxFilter === key ? 'default' : 'outline'}
                      size="sm"
                      className={
                        inboxFilter === key
                          ? 'bg-wedding-600 hover:bg-wedding-700 text-white'
                          : 'text-gray-600 hover:text-gray-900'
                      }
                      onClick={() => {
                        setInboxFilter(key)
                        setPage(1)
                        setSelectedEmail(null)
                      }}
                    >
                      {Icon && <Icon className="mr-1 h-3 w-3" />}
                      {label}
                    </Button>
                  ))}
                </div>
              </motion.div>

              {/* Two-column layout: email list + detail */}
              <motion.div
                variants={fadeInUp}
                initial="hidden"
                animate="visible"
                transition={springSmooth}
                className="flex h-[calc(100vh-22rem)] gap-4"
              >
                {/* Email List */}
                <Card className="w-full flex-shrink-0 overflow-hidden md:w-[380px]">
                  <div className="flex h-full flex-col">
                    <div className="flex-1 overflow-y-auto">
                      {emailList.length === 0 ? (
                        <div className="flex h-full flex-col items-center justify-center p-8 text-gray-400">
                          <Inbox className="mb-3 h-12 w-12" />
                          <p className="text-sm font-medium">No emails found</p>
                          <p className="mt-1 text-xs">
                            {searchQuery ? 'Try a different search term' : 'Your inbox is empty'}
                          </p>
                        </div>
                      ) : (
                        <motion.div variants={staggerContainer} initial="hidden" animate="visible">
                          {emailList.map((email) => (
                            <motion.div
                              key={email.id}
                              variants={listItem}
                              transition={springSmooth}
                              className={`flex cursor-pointer items-start gap-3 border-b p-3 transition-colors ${
                                selectedEmail?.id === email.id
                                  ? 'bg-wedding-50 border-l-wedding-600 border-l-2'
                                  : 'hover:bg-gray-50'
                              } ${!email.isRead ? 'bg-blue-50/40' : ''}`}
                              onClick={() => handleSelectEmail(email)}
                            >
                              <div className="pt-0.5">
                                {email.isRead ? (
                                  <MailOpen className="h-4 w-4 text-gray-400" />
                                ) : (
                                  <Mail className="text-wedding-600 h-4 w-4" />
                                )}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center justify-between">
                                  <p
                                    className={`truncate text-sm ${!email.isRead ? 'font-semibold text-gray-900' : 'text-gray-700'}`}
                                  >
                                    {email.direction === 'inbound'
                                      ? (email.fromName ?? email.fromAddress)
                                      : `To: ${email.toAddress}`}
                                  </p>
                                  <span className="ml-2 flex-shrink-0 text-xs text-gray-400">
                                    {formatDate(email.createdAt)}
                                  </span>
                                </div>
                                <p
                                  className={`truncate text-sm ${!email.isRead ? 'font-medium text-gray-800' : 'text-gray-600'}`}
                                >
                                  {email.subject || '(No subject)'}
                                </p>
                                <div className="mt-0.5 flex items-center gap-1.5">
                                  <p className="min-w-0 flex-1 truncate text-xs text-gray-400">
                                    {getSnippet(email)}
                                  </p>
                                  {email.attachments && email.attachments.length > 0 && (
                                    <Paperclip className="h-3 w-3 flex-shrink-0 text-gray-400" />
                                  )}
                                </div>
                              </div>
                              <button
                                onClick={(e) => handleToggleStar(email, e)}
                                className="flex-shrink-0 pt-0.5"
                              >
                                {email.isStarred ? (
                                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                ) : (
                                  <StarOff className="h-4 w-4 text-gray-300 hover:text-yellow-400" />
                                )}
                              </button>
                            </motion.div>
                          ))}
                        </motion.div>
                      )}
                    </div>

                    {/* Pagination */}
                    {(page > 1 || hasMore) && (
                      <div className="flex items-center justify-between border-t p-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={page <= 1}
                          onClick={() => setPage((p) => p - 1)}
                        >
                          Previous
                        </Button>
                        <span className="text-xs text-gray-400">
                          Page {page} of {Math.max(1, Math.ceil(totalEmails / 20))}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={!hasMore}
                          onClick={() => setPage((p) => p + 1)}
                        >
                          Next
                        </Button>
                      </div>
                    )}
                  </div>
                </Card>

                {/* Email Detail Panel */}
                <Card className="hidden flex-1 overflow-hidden md:block">
                  <AnimatePresence mode="wait">
                    {selectedEmail ? (
                      <motion.div
                        key={selectedEmail.id}
                        initial={{ opacity: 0, x: 8 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -8 }}
                        transition={{ duration: 0.2 }}
                        className="flex h-full flex-col"
                      >
                        {/* Detail Header */}
                        <div className="flex items-start justify-between border-b p-4">
                          <div className="min-w-0 flex-1">
                            <div className="mb-2 flex items-center gap-2">
                              <Badge
                                variant="outline"
                                className={
                                  selectedEmail.direction === 'inbound'
                                    ? 'border-blue-200 bg-blue-50 text-blue-700'
                                    : 'border-green-200 bg-green-50 text-green-700'
                                }
                              >
                                {selectedEmail.direction === 'inbound' ? 'Received' : 'Sent'}
                              </Badge>
                              <span className="text-xs text-gray-400">
                                {new Date(selectedEmail.createdAt).toLocaleString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                  hour: 'numeric',
                                  minute: '2-digit',
                                  hour12: true,
                                })}
                              </span>
                            </div>
                            <h2 className="font-serif text-lg font-semibold text-gray-900">
                              {selectedEmail.subject || '(No subject)'}
                            </h2>
                            <div className="mt-2 space-y-0.5 text-sm text-gray-600">
                              <p>
                                <span className="font-medium text-gray-700">From:</span>{' '}
                                {selectedEmail.fromName
                                  ? `${selectedEmail.fromName} <${selectedEmail.fromAddress}>`
                                  : selectedEmail.fromAddress}
                              </p>
                              <p>
                                <span className="font-medium text-gray-700">To:</span>{' '}
                                {selectedEmail.toAddress}
                              </p>
                              {selectedEmail.ccAddresses && (
                                <p>
                                  <span className="font-medium text-gray-700">CC:</span>{' '}
                                  {selectedEmail.ccAddresses}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              title={selectedEmail.isRead ? 'Mark as unread' : 'Mark as read'}
                              onClick={() => handleToggleRead(selectedEmail)}
                            >
                              {selectedEmail.isRead ? (
                                <EyeOff className="h-4 w-4 text-gray-400" />
                              ) : (
                                <Eye className="h-4 w-4 text-gray-400" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              title={selectedEmail.isStarred ? 'Unstar' : 'Star'}
                              onClick={() =>
                                handleToggleStar(selectedEmail, {
                                  stopPropagation: () => {},
                                } as React.MouseEvent)
                              }
                            >
                              {selectedEmail.isStarred ? (
                                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                              ) : (
                                <StarOff className="h-4 w-4 text-gray-400" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              title="Reply"
                              onClick={() => handleReply(selectedEmail)}
                            >
                              <Reply className="h-4 w-4 text-gray-500" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              title="Delete"
                              className="text-red-500 hover:text-red-700"
                              onClick={() => handleDeleteEmail(selectedEmail.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        {/* Email Body */}
                        <div className="flex-1 overflow-y-auto p-4">
                          {selectedEmail.htmlBody ? (
                            <iframe
                              sandbox="allow-same-origin"
                              srcDoc={`<!DOCTYPE html><html><head><style>body{font-family:system-ui,-apple-system,sans-serif;font-size:14px;line-height:1.6;color:#374151;margin:0;padding:0;}a{color:#8b5cf6;}img{max-width:100%;height:auto;}</style></head><body>${DOMPurify.sanitize(selectedEmail.htmlBody, { ALLOWED_TAGS: ['a', 'b', 'i', 'u', 'em', 'strong', 'p', 'br', 'div', 'span', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'blockquote', 'pre', 'code', 'img', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'hr', 'small', 'del', 'sub', 'sup'], ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class', 'style', 'target', 'rel', 'width', 'height', 'colspan', 'rowspan', 'border', 'align', 'valign'], ALLOW_DATA_ATTR: false, ADD_ATTR: ['target'] })}</body></html>`}
                              className="h-full w-full border-0"
                              title="Email content"
                              style={{ minHeight: '300px' }}
                            />
                          ) : (
                            <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-gray-700">
                              {selectedEmail.textBody ?? '(No content)'}
                            </pre>
                          )}
                        </div>

                        {/* Attachments */}
                        {selectedEmail.attachments && selectedEmail.attachments.length > 0 && (
                          <div className="border-t p-4">
                            <p className="mb-2 flex items-center gap-1.5 text-xs font-medium text-gray-500">
                              <Paperclip className="h-3 w-3" />
                              {selectedEmail.attachments.length} attachment
                              {selectedEmail.attachments.length !== 1 ? 's' : ''}
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {selectedEmail.attachments.map((att: EmailAttachment) => (
                                <div
                                  key={att.id}
                                  className="flex items-center gap-2 rounded-lg border bg-gray-50 px-3 py-2"
                                >
                                  <span className="text-base">{getFileIcon(att.contentType)}</span>
                                  <div className="min-w-0">
                                    <p className="truncate text-xs font-medium text-gray-700">
                                      {att.filename}
                                    </p>
                                    <p className="text-[10px] text-gray-400">
                                      {formatFileSize(att.size)}
                                    </p>
                                  </div>
                                  {att.url && (
                                    <a
                                      href={att.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-wedding-600 hover:text-wedding-700 ml-1"
                                      title="Download"
                                    >
                                      <Download className="h-3.5 w-3.5" />
                                    </a>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </motion.div>
                    ) : (
                      <motion.div
                        key="empty"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex h-full flex-col items-center justify-center text-gray-400"
                      >
                        <Mail className="mb-3 h-16 w-16 opacity-30" />
                        <p className="text-sm font-medium">Select an email to read</p>
                        <p className="mt-1 text-xs">Choose a message from the list on the left</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Card>

                {/* Mobile detail view (shown below list on small screens) */}
                {selectedEmail && (
                  <Card className="mt-4 overflow-hidden md:hidden">
                    <div className="flex flex-col">
                      <div className="flex items-center justify-between border-b p-3">
                        <Button variant="ghost" size="sm" onClick={() => setSelectedEmail(null)}>
                          Back to list
                        </Button>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleReply(selectedEmail)}
                          >
                            <Reply className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-500"
                            onClick={() => handleDeleteEmail(selectedEmail.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="p-4">
                        <Badge
                          variant="outline"
                          className={
                            selectedEmail.direction === 'inbound'
                              ? 'border-blue-200 text-blue-700'
                              : 'border-green-200 text-green-700'
                          }
                        >
                          {selectedEmail.direction === 'inbound' ? 'Received' : 'Sent'}
                        </Badge>
                        <h2 className="mt-2 font-serif text-lg font-semibold text-gray-900">
                          {selectedEmail.subject || '(No subject)'}
                        </h2>
                        <p className="mt-1 text-sm text-gray-600">
                          {selectedEmail.fromName
                            ? `${selectedEmail.fromName} <${selectedEmail.fromAddress}>`
                            : selectedEmail.fromAddress}
                        </p>
                        <p className="text-xs text-gray-400">
                          {new Date(selectedEmail.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <div className="border-t p-4">
                        {selectedEmail.htmlBody ? (
                          <iframe
                            sandbox="allow-same-origin"
                            srcDoc={`<!DOCTYPE html><html><head><style>body{font-family:system-ui,-apple-system,sans-serif;font-size:14px;line-height:1.6;color:#374151;margin:0;padding:0;}a{color:#8b5cf6;}img{max-width:100%;height:auto;}</style></head><body>${DOMPurify.sanitize(selectedEmail.htmlBody, { ALLOWED_TAGS: ['a', 'b', 'i', 'u', 'em', 'strong', 'p', 'br', 'div', 'span', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'blockquote', 'pre', 'code', 'img', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'hr', 'small', 'del', 'sub', 'sup'], ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class', 'style', 'target', 'rel', 'width', 'height', 'colspan', 'rowspan', 'border', 'align', 'valign'], ALLOW_DATA_ATTR: false, ADD_ATTR: ['target'] })}</body></html>`}
                            className="w-full border-0"
                            title="Email content"
                            style={{ minHeight: '200px' }}
                          />
                        ) : (
                          <pre className="whitespace-pre-wrap font-sans text-sm text-gray-700">
                            {selectedEmail.textBody ?? '(No content)'}
                          </pre>
                        )}
                      </div>
                      {selectedEmail.attachments && selectedEmail.attachments.length > 0 && (
                        <div className="border-t p-4">
                          <p className="mb-2 flex items-center gap-1 text-xs font-medium text-gray-500">
                            <Paperclip className="h-3 w-3" />
                            {selectedEmail.attachments.length} attachment
                            {selectedEmail.attachments.length !== 1 ? 's' : ''}
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {selectedEmail.attachments.map((att: EmailAttachment) => (
                              <div
                                key={att.id}
                                className="flex items-center gap-2 rounded-lg border bg-gray-50 px-3 py-2"
                              >
                                <span>{getFileIcon(att.contentType)}</span>
                                <div>
                                  <p className="text-xs font-medium">{att.filename}</p>
                                  <p className="text-[10px] text-gray-400">
                                    {formatFileSize(att.size)}
                                  </p>
                                </div>
                                {att.url && (
                                  <a
                                    href={att.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-wedding-600"
                                  >
                                    <Download className="h-3.5 w-3.5" />
                                  </a>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </Card>
                )}
              </motion.div>
            </div>
          )}

          {/* ── Compose Email Dialog ── */}
          <Dialog open={showComposeEmail} onOpenChange={setShowComposeEmail}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle className="font-serif">Compose Email</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {/* From (read-only) */}
                <div>
                  <Label className="text-xs text-gray-500">
                    From: {addresses[0]?.displayName} &lt;{addresses[0]?.address}@planfortwo.com&gt;
                  </Label>
                </div>

                {/* To */}
                <div>
                  <Label htmlFor="compose-to">To</Label>
                  <Input
                    id="compose-to"
                    type="email"
                    placeholder="recipient@example.com"
                    value={composeForm.toAddress}
                    onChange={(e) => setComposeForm((f) => ({ ...f, toAddress: e.target.value }))}
                  />
                </div>

                {/* Subject */}
                <div>
                  <Label htmlFor="compose-subject">Subject</Label>
                  <Input
                    id="compose-subject"
                    placeholder="Subject"
                    value={composeForm.subject}
                    onChange={(e) => setComposeForm((f) => ({ ...f, subject: e.target.value }))}
                  />
                </div>

                {/* Body */}
                <div>
                  <Label htmlFor="compose-body">Message</Label>
                  <Textarea
                    id="compose-body"
                    placeholder="Write your message..."
                    rows={8}
                    value={composeForm.textBody}
                    onChange={(e) => setComposeForm((f) => ({ ...f, textBody: e.target.value }))}
                  />
                </div>

                {/* Attachments */}
                <div>
                  <Label className="mb-2 flex items-center gap-1.5">
                    <Paperclip className="h-3.5 w-3.5" />
                    Attachments
                    <span className="text-xs font-normal text-gray-400">
                      ({composeAttachments.length}/10, max 25MB each)
                    </span>
                  </Label>

                  {/* Drop zone */}
                  <div
                    className="cursor-pointer rounded-lg border-2 border-dashed border-gray-200 p-4 text-center transition-colors hover:border-gray-300 hover:bg-gray-50"
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(e) => {
                      e.preventDefault()
                      e.currentTarget.classList.add('border-wedding-400', 'bg-wedding-50')
                    }}
                    onDragLeave={(e) => {
                      e.currentTarget.classList.remove('border-wedding-400', 'bg-wedding-50')
                    }}
                    onDrop={(e) => {
                      e.preventDefault()
                      e.currentTarget.classList.remove('border-wedding-400', 'bg-wedding-50')
                      handleFileSelect(e.dataTransfer.files)
                    }}
                  >
                    <Paperclip className="mx-auto mb-1 h-5 w-5 text-gray-400" />
                    <p className="text-xs text-gray-500">
                      Drag and drop files here, or click to select
                    </p>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    className="hidden"
                    onChange={(e) => {
                      handleFileSelect(e.target.files)
                      e.target.value = ''
                    }}
                  />

                  {/* Attached files list */}
                  {composeAttachments.length > 0 && (
                    <div className="mt-2 space-y-1.5">
                      {composeAttachments.map((att) => (
                        <div
                          key={att.id}
                          className="flex items-center justify-between rounded-lg border bg-gray-50 px-3 py-2"
                        >
                          <div className="flex min-w-0 items-center gap-2">
                            <span className="text-sm">{getFileIcon(att.contentType)}</span>
                            <div className="min-w-0">
                              <p className="truncate text-xs font-medium text-gray-700">
                                {att.filename}
                              </p>
                              <p className="text-[10px] text-gray-400">
                                {formatFileSize(att.size)}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => handleRemoveAttachment(att.id)}
                            className="ml-2 flex-shrink-0 rounded p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-600"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowComposeEmail(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleSendEmail}
                  disabled={
                    sendingEmail ||
                    !composeForm.toAddress ||
                    !composeForm.subject ||
                    !composeForm.textBody
                  }
                  className="bg-wedding-600 hover:bg-wedding-700"
                >
                  {sendingEmail ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="mr-2 h-4 w-4" />
                  )}
                  Send
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* ════════════════════════════════════════ */}
        {/*  TAB 2: CAMPAIGNS                       */}
        {/* ════════════════════════════════════════ */}
        <TabsContent value="campaigns">
          {campaignLoading && mainTab === 'campaigns' ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="text-wedding-600 h-8 w-8 animate-spin" />
            </div>
          ) : (
            <>
              <div className="mb-6 flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  Create and manage email campaigns for your guests.
                </p>
                <Button
                  className="bg-wedding-600 hover:bg-wedding-700"
                  onClick={() => {
                    setEditingCampaign(null)
                    setCampaignForm({
                      subject: '',
                      body: '',
                      templateType: 'custom',
                      scheduledAt: '',
                    })
                    setShowComposeCampaign(true)
                  }}
                >
                  <Plus className="mr-1 h-4 w-4" />
                  Compose Campaign
                </Button>
              </div>

              {campaigns.length === 0 ? (
                <Card>
                  <CardContent className="py-16 text-center">
                    <div className="bg-wedding-50 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full">
                      <Megaphone className="text-wedding-600 h-8 w-8" />
                    </div>
                    <h2 className="font-serif text-xl font-semibold text-gray-900">
                      No Campaigns Yet
                    </h2>
                    <p className="mx-auto mt-2 max-w-md text-sm text-gray-600">
                      Send save-the-dates, invitations, reminders, and thank-you notes to your
                      guests.
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
                          <div className="min-w-0 flex-1">
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
                            <p className="mt-1 line-clamp-1 text-sm text-gray-500">
                              {campaign.body}
                            </p>
                            <div className="mt-1 flex items-center gap-4 text-xs text-gray-400">
                              {campaign.scheduledAt && (
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  Scheduled:{' '}
                                  {new Date(campaign.scheduledAt).toLocaleString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric',
                                    hour: 'numeric',
                                    minute: '2-digit',
                                    hour12: true,
                                  })}
                                </span>
                              )}
                              {campaign.sentAt && (
                                <span className="flex items-center gap-1">
                                  <Check className="h-3 w-3" />
                                  Sent:{' '}
                                  {new Date(campaign.sentAt).toLocaleString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric',
                                    hour: 'numeric',
                                    minute: '2-digit',
                                    hour12: true,
                                  })}
                                </span>
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
                                  setCampaignForm({
                                    subject: campaign.subject,
                                    body: campaign.body,
                                    templateType: campaign.templateType ?? 'custom',
                                    scheduledAt: campaign.scheduledAt
                                      ? (campaign.scheduledAt.split('T')[0] ?? '')
                                      : '',
                                  })
                                  setShowComposeCampaign(true)
                                }}
                              >
                                Edit
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-500 hover:text-red-700"
                              onClick={() => handleDeleteCampaign(campaign.id)}
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

              {/* Campaign Compose Dialog */}
              <Dialog open={showComposeCampaign} onOpenChange={setShowComposeCampaign}>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle className="font-serif">
                      {editingCampaign ? 'Edit Campaign' : 'Compose Campaign'}
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Template Type</Label>
                      <select
                        value={campaignForm.templateType}
                        onChange={(e) =>
                          setCampaignForm({ ...campaignForm, templateType: e.target.value })
                        }
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
                        value={campaignForm.subject}
                        onChange={(e) =>
                          setCampaignForm({ ...campaignForm, subject: e.target.value })
                        }
                        placeholder="e.g. You're Invited!"
                      />
                    </div>
                    <div>
                      <Label>Body</Label>
                      <Textarea
                        value={campaignForm.body}
                        onChange={(e) => setCampaignForm({ ...campaignForm, body: e.target.value })}
                        rows={8}
                        placeholder="Write your message..."
                      />
                    </div>
                    <div>
                      <Label>Schedule Send (optional)</Label>
                      <Input
                        type="datetime-local"
                        value={campaignForm.scheduledAt}
                        onChange={(e) =>
                          setCampaignForm({ ...campaignForm, scheduledAt: e.target.value })
                        }
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowComposeCampaign(false)}>
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSaveCampaign}
                      disabled={!campaignForm.subject || !campaignForm.body}
                      className="bg-wedding-600 hover:bg-wedding-700"
                    >
                      {editingCampaign ? 'Update' : 'Save Draft'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </>
          )}
        </TabsContent>
      </Tabs>
    </motion.div>
  )
}
