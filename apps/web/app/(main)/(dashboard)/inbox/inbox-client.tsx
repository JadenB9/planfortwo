'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from '@clerk/nextjs'
import { motion } from 'framer-motion'
import { sanitizeHtml } from '@/lib/sanitize'
import { springSmooth, fadeInUp, staggerContainer, listItem } from '@/lib/animations'
import { api } from '@/lib/api'
import { useWedding } from '@/hooks/use-wedding'
import { refreshBadges } from '@/hooks/use-notification-badges'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Inbox,
  Send,
  Star,
  StarOff,
  Trash2,
  RefreshCw,
  Plus,
  Mail,
  MailOpen,
  Loader2,
  Check,
  AtSign,
  Paperclip,
  Download,
  Eye,
  EyeOff,
  Reply,
  Search,
  Users,
  X,
  FileImage,
  FileText,
} from 'lucide-react'
import type { Email, EmailAddress, EmailAttachment, GuestWithTags } from '@planfortwo/types'
import { toast } from 'sonner'

type TabFilter = 'all' | 'inbound' | 'outbound' | 'unread' | 'starred'

const ALLOWED_ATTACHMENT_TYPES: Record<string, string> = {
  'application/pdf': 'application/pdf',
  'image/jpeg': 'image/jpeg',
  'image/png': 'image/png',
  'image/gif': 'image/gif',
  'image/webp': 'image/webp',
  'image/heic': 'image/heic',
  'image/heif': 'image/heif',
}

const ACCEPT_STRING = Object.keys(ALLOWED_ATTACHMENT_TYPES).join(',')
const MAX_FILE_SIZE = 25 * 1024 * 1024 // 25MB
const MAX_ATTACHMENTS = 10

interface PendingAttachment {
  id: string
  filename: string
  contentType: string
  size: number
  r2Key: string
  status: 'uploading' | 'done' | 'error'
  errorMessage?: string
}

function buildEmailSrcDoc(html: string): string {
  const sanitized = sanitizeHtml(html, {
    ALLOWED_TAGS: [
      'html',
      'head',
      'body',
      'style',
      'a',
      'b',
      'i',
      'u',
      'em',
      'strong',
      'p',
      'br',
      'div',
      'span',
      'h1',
      'h2',
      'h3',
      'h4',
      'h5',
      'h6',
      'ul',
      'ol',
      'li',
      'dl',
      'dt',
      'dd',
      'table',
      'thead',
      'tbody',
      'tfoot',
      'tr',
      'th',
      'td',
      'caption',
      'colgroup',
      'col',
      'img',
      'picture',
      'source',
      'hr',
      'sub',
      'sup',
      'small',
      'del',
      'ins',
      'mark',
      'abbr',
      'blockquote',
      'pre',
      'code',
      'section',
      'header',
      'footer',
      'nav',
      'main',
      'article',
      'figure',
      'figcaption',
      'center',
      'font',
    ],
    ALLOWED_ATTR: [
      'href',
      'src',
      'alt',
      'title',
      'class',
      'id',
      'style',
      'target',
      'rel',
      'width',
      'height',
      'colspan',
      'rowspan',
      'cellpadding',
      'cellspacing',
      'border',
      'align',
      'valign',
      'bgcolor',
      'color',
      'face',
      'size',
      'role',
      'aria-label',
      'aria-hidden',
      'dir',
      'lang',
      'type',
      'media',
    ],
    ALLOW_DATA_ATTR: false,
    ADD_ATTR: ['target'],
    WHOLE_DOCUMENT: true,
  })

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <base target="_blank">
  <style>
    body {
      font-family: system-ui, -apple-system, sans-serif;
      font-size: 14px;
      line-height: 1.6;
      color: #374151;
      margin: 0;
      padding: 16px;
      word-wrap: break-word;
      overflow-wrap: break-word;
    }
    a { color: #6d28d9; }
    img { max-width: 100%; height: auto; }
    table { max-width: 100%; }
    pre { overflow-x: auto; }
    blockquote {
      border-left: 3px solid #d1d5db;
      margin: 8px 0;
      padding: 4px 12px;
      color: #6b7280;
    }
  </style>
</head>
<body>${sanitized}</body>
</html>`
}

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

export default function InboxPage() {
  const { getToken } = useAuth()
  const { data: weddingData } = useWedding()
  const weddingId = weddingData?.wedding.id ?? null
  const [loading, setLoading] = useState(true)
  const [addresses, setAddresses] = useState<EmailAddress[]>([])
  const [emailList, setEmailList] = useState<Email[]>([])
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null)
  const [activeTab, setActiveTab] = useState<TabFilter>('all')
  const [totalEmails, setTotalEmails] = useState(0)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)

  const [searchQuery, setSearchQuery] = useState('')
  const [unreadCount, setUnreadCount] = useState(0)

  // Iframe ref for auto-height
  const iframeRef = useRef<HTMLIFrameElement>(null)

  const handleIframeLoad = useCallback(() => {
    const iframe = iframeRef.current
    if (!iframe) return
    try {
      const doc = iframe.contentDocument || iframe.contentWindow?.document
      if (doc?.body) {
        const height = doc.body.scrollHeight + 32
        iframe.style.height = `${Math.max(200, Math.min(height, 800))}px`
      }
    } catch {
      // sandbox may block access in some cases
      iframe.style.height = '500px'
    }
  }, [])

  // Claim form
  const [claimAddress, setClaimAddress] = useState('')
  const [claimDisplayName, setClaimDisplayName] = useState('')
  const [claimLoading, setClaimLoading] = useState(false)
  const [claimError, setClaimError] = useState('')
  const [availability, setAvailability] = useState<{ available: boolean; reason?: string } | null>(
    null,
  )
  const [checkingAvailability, setCheckingAvailability] = useState(false)

  // Compose
  const [showCompose, setShowCompose] = useState(false)
  const [composeForm, setComposeForm] = useState({
    toAddress: '',
    subject: '',
    textBody: '',
  })
  const [sending, setSending] = useState(false)
  const [composeAttachments, setComposeAttachments] = useState<PendingAttachment[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Mass email
  const [showMassEmail, setShowMassEmail] = useState(false)
  const [massGuests, setMassGuests] = useState<GuestWithTags[]>([])
  const [massGuestsLoading, setMassGuestsLoading] = useState(false)
  const [massSelected, setMassSelected] = useState<Set<string>>(new Set())
  const [massGuestSearch, setMassGuestSearch] = useState('')
  const [massForm, setMassForm] = useState({ subject: '', textBody: '' })
  const [massSending, setMassSending] = useState(false)
  const [massSendProgress, setMassSendProgress] = useState({ sent: 0, total: 0 })
  const [massAttachments, setMassAttachments] = useState<PendingAttachment[]>([])
  const massFileInputRef = useRef<HTMLInputElement>(null)

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
    if (activeTab === 'inbound') filters.direction = 'inbound'
    if (activeTab === 'outbound') filters.direction = 'outbound'
    if (activeTab === 'unread') filters.isRead = false
    if (activeTab === 'starred') filters.isStarred = true
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
  }, [getToken, page, activeTab, searchQuery])

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
      setLoading(true)
      await fetchAddresses()
      setLoading(false)
    }
    init()
  }, [fetchAddresses])

  useEffect(() => {
    if (addresses.length > 0) {
      fetchEmails()
      fetchUnreadCount()
    }
  }, [addresses.length, fetchEmails, fetchUnreadCount])

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
        handleCheckAvailability(claimAddress)
      }
    }, 400)
    return () => clearTimeout(timer)
  }, [claimAddress, handleCheckAvailability])

  const handleClaim = async () => {
    const token = await getToken()
    if (!token) return

    setClaimLoading(true)
    setClaimError('')
    try {
      await api.inbox.addresses.claim(
        { address: claimAddress, displayName: claimDisplayName },
        token,
      )
      await fetchAddresses()
    } catch (err) {
      setClaimError(err instanceof Error ? err.message : 'Failed to claim address')
    } finally {
      setClaimLoading(false)
    }
  }

  // Search debounce
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

  const handleSelectEmail = async (email: Email) => {
    const token = await getToken()
    if (!token) return

    try {
      const res = await api.inbox.get(email.id, token)
      setSelectedEmail(res.data)
      if (!email.isRead) {
        await api.inbox.update(email.id, { isRead: true }, token)
        setEmailList((prev) => prev.map((e) => (e.id === email.id ? { ...e, isRead: true } : e)))
        setUnreadCount((c) => Math.max(0, c - 1))
        refreshBadges()
      }
    } catch {
      toast.error('Failed to load email')
      setSelectedEmail(email)
    }
  }

  const handleToggleRead = async (email: Email) => {
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
  }

  const handleToggleStar = async (email: Email, e: React.MouseEvent) => {
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
  }

  const handleDelete = async (emailId: string) => {
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
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    const token = await getToken()
    if (!token || addresses.length === 0) return

    const emailAddressId = addresses[0]!.id
    const remaining = MAX_ATTACHMENTS - composeAttachments.length
    const selected = Array.from(files).slice(0, remaining)

    for (const file of selected) {
      if (!ALLOWED_ATTACHMENT_TYPES[file.type]) {
        toast.error(`${file.name}: unsupported file type`)
        continue
      }
      if (file.size > MAX_FILE_SIZE) {
        toast.error(`${file.name}: exceeds 25MB limit`)
        continue
      }

      const tempId = crypto.randomUUID()
      const pending: PendingAttachment = {
        id: tempId,
        filename: file.name,
        contentType: file.type,
        size: file.size,
        r2Key: '',
        status: 'uploading',
      }

      setComposeAttachments((prev) => [...prev, pending])

      try {
        const res = await api.inbox.getUploadUrl(
          { emailAddressId, fileName: file.name, contentType: file.type },
          token,
        )
        const { uploadUrl, r2Key, attachmentId } = res.data

        await fetch(uploadUrl, {
          method: 'PUT',
          headers: { 'Content-Type': file.type },
          body: file,
        })

        setComposeAttachments((prev) =>
          prev.map((a) =>
            a.id === tempId ? { ...a, id: attachmentId, r2Key, status: 'done' as const } : a,
          ),
        )
      } catch {
        setComposeAttachments((prev) =>
          prev.map((a) =>
            a.id === tempId ? { ...a, status: 'error' as const, errorMessage: 'Upload failed' } : a,
          ),
        )
        toast.error(`Failed to upload ${file.name}`)
      }
    }

    // Reset input so user can re-select same file
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const removeAttachment = (id: string) => {
    setComposeAttachments((prev) => prev.filter((a) => a.id !== id))
  }

  const handleSend = async () => {
    const token = await getToken()
    if (!token || addresses.length === 0) return

    // Don't send if attachments are still uploading
    if (composeAttachments.some((a) => a.status === 'uploading')) {
      toast.error('Please wait for attachments to finish uploading')
      return
    }

    setSending(true)
    try {
      const doneAttachments = composeAttachments
        .filter((a) => a.status === 'done')
        .map((a) => ({
          id: a.id,
          filename: a.filename,
          contentType: a.contentType,
          size: a.size,
          r2Key: a.r2Key,
        }))

      await api.inbox.send(
        {
          emailAddressId: addresses[0]!.id,
          toAddress: composeForm.toAddress,
          subject: composeForm.subject,
          textBody: composeForm.textBody,
          ...(doneAttachments.length > 0 ? { attachments: doneAttachments } : {}),
        },
        token,
      )
      toast.success('Email sent')
      setShowCompose(false)
      setComposeForm({ toAddress: '', subject: '', textBody: '' })
      setComposeAttachments([])
      await fetchEmails()
    } catch {
      toast.error('Failed to send email')
    } finally {
      setSending(false)
    }
  }

  const handleMassFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    const token = await getToken()
    if (!token || addresses.length === 0) return

    const emailAddressId = addresses[0]!.id
    const remaining = MAX_ATTACHMENTS - massAttachments.length
    const selected = Array.from(files).slice(0, remaining)

    for (const file of selected) {
      if (!ALLOWED_ATTACHMENT_TYPES[file.type]) {
        toast.error(`${file.name}: unsupported file type`)
        continue
      }
      if (file.size > MAX_FILE_SIZE) {
        toast.error(`${file.name}: exceeds 25MB limit`)
        continue
      }

      const tempId = crypto.randomUUID()
      const pending: PendingAttachment = {
        id: tempId,
        filename: file.name,
        contentType: file.type,
        size: file.size,
        r2Key: '',
        status: 'uploading',
      }

      setMassAttachments((prev) => [...prev, pending])

      try {
        const res = await api.inbox.getUploadUrl(
          { emailAddressId, fileName: file.name, contentType: file.type },
          token,
        )
        const { uploadUrl, r2Key, attachmentId } = res.data

        await fetch(uploadUrl, {
          method: 'PUT',
          headers: { 'Content-Type': file.type },
          body: file,
        })

        setMassAttachments((prev) =>
          prev.map((a) =>
            a.id === tempId ? { ...a, id: attachmentId, r2Key, status: 'done' as const } : a,
          ),
        )
      } catch {
        setMassAttachments((prev) =>
          prev.map((a) =>
            a.id === tempId ? { ...a, status: 'error' as const, errorMessage: 'Upload failed' } : a,
          ),
        )
        toast.error(`Failed to upload ${file.name}`)
      }
    }

    if (massFileInputRef.current) massFileInputRef.current.value = ''
  }

  const removeMassAttachment = (id: string) => {
    setMassAttachments((prev) => prev.filter((a) => a.id !== id))
  }

  const openMassEmail = useCallback(async () => {
    if (!weddingId) return
    setShowMassEmail(true)
    setMassGuestsLoading(true)
    setMassSelected(new Set())
    setMassGuestSearch('')
    setMassForm({ subject: '', textBody: '' })
    setMassAttachments([])
    try {
      const token = await getToken()
      if (!token) return
      const allGuests: GuestWithTags[] = []
      let p = 1
      let more = true
      while (more) {
        const res = await api.guests.list(weddingId, token, { pageSize: 200, page: p })
        allGuests.push(...res.data)
        more = res.hasMore
        p++
      }
      setMassGuests(allGuests)
    } catch {
      toast.error('Failed to load guest list')
    } finally {
      setMassGuestsLoading(false)
    }
  }, [weddingId, getToken])

  const guestsWithEmail = massGuests.filter((g) => g.email)
  const filteredMassGuests = guestsWithEmail.filter((g) => {
    if (!massGuestSearch.trim()) return true
    const q = massGuestSearch.toLowerCase()
    return (
      g.firstName.toLowerCase().includes(q) ||
      g.lastName.toLowerCase().includes(q) ||
      (g.email?.toLowerCase().includes(q) ?? false)
    )
  })

  const handleSelectAll = () => {
    if (massSelected.size === filteredMassGuests.length) {
      setMassSelected(new Set())
    } else {
      setMassSelected(new Set(filteredMassGuests.map((g) => g.id)))
    }
  }

  const toggleMassGuest = (id: string) => {
    setMassSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleMassSend = async () => {
    const token = await getToken()
    if (!token || addresses.length === 0 || massSelected.size === 0) return

    if (massAttachments.some((a) => a.status === 'uploading')) {
      toast.error('Please wait for attachments to finish uploading')
      return
    }

    const doneAttachments = massAttachments
      .filter((a) => a.status === 'done')
      .map((a) => ({
        id: a.id,
        filename: a.filename,
        contentType: a.contentType,
        size: a.size,
        r2Key: a.r2Key,
      }))

    const recipients = guestsWithEmail.filter((g) => massSelected.has(g.id))
    setMassSending(true)
    setMassSendProgress({ sent: 0, total: recipients.length })

    let sent = 0
    let failed = 0
    for (const guest of recipients) {
      try {
        await api.inbox.send(
          {
            emailAddressId: addresses[0]!.id,
            toAddress: guest.email!,
            subject: massForm.subject,
            textBody: massForm.textBody,
            ...(doneAttachments.length > 0 ? { attachments: doneAttachments } : {}),
          },
          token,
        )
        sent++
      } catch {
        failed++
      }
      setMassSendProgress({ sent: sent + failed, total: recipients.length })
    }

    setMassSending(false)
    if (failed === 0) {
      toast.success(`Sent ${sent} email${sent !== 1 ? 's' : ''}`)
    } else {
      toast.warning(`Sent ${sent}, failed ${failed}`)
    }
    setShowMassEmail(false)
    setMassAttachments([])
    await fetchEmails()
  }

  const formatDate = (date: Date | string) => {
    const d = new Date(date)
    const now = new Date()
    const isToday = d.toDateString() === now.toDateString()
    if (isToday) return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' })
  }

  const getSnippet = (email: Email) => {
    const text = email.textBody ?? ''
    return text.length > 100 ? text.slice(0, 100) + '...' : text
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-rose-400" />
      </div>
    )
  }

  // ── No address claimed yet ──
  if (addresses.length === 0) {
    return (
      <motion.div
        className="mx-auto mt-16 max-w-lg"
        variants={fadeInUp}
        initial="hidden"
        animate="visible"
        transition={springSmooth}
      >
        <Card>
          <CardContent className="p-8">
            <div className="mb-6 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-rose-100">
                <AtSign className="h-8 w-8 text-rose-500" />
              </div>
              <h1 className="mb-2 text-2xl font-bold text-gray-900">Claim Your Email Address</h1>
              <p className="text-gray-500">
                Get your own <span className="font-medium">@planfortwo.com</span> email address to
                send and receive messages.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="address">Email Address</Label>
                <div className="mt-1 flex items-center gap-2">
                  <Input
                    id="address"
                    placeholder="yourname"
                    value={claimAddress}
                    onChange={(e) => setClaimAddress(e.target.value.toLowerCase())}
                    className="flex-1"
                  />
                  <span className="whitespace-nowrap text-sm text-gray-500">@planfortwo.com</span>
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
                      availability.reason
                    )}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="displayName">Display Name</Label>
                <Input
                  id="displayName"
                  placeholder="Your Name"
                  value={claimDisplayName}
                  onChange={(e) => setClaimDisplayName(e.target.value)}
                  className="mt-1"
                />
              </div>

              {claimAddress && claimDisplayName && (
                <div className="rounded-lg bg-gray-50 p-3 text-sm">
                  <span className="text-gray-500">Preview: </span>
                  <span className="font-medium">
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
                className="w-full bg-rose-500 hover:bg-rose-600"
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
    )
  }

  // ── Inbox View ──
  return (
    <motion.div
      className="h-[calc(100vh-8rem)]"
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <motion.div
        variants={fadeInUp}
        transition={springSmooth}
        className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inbox</h1>
          <p className="text-sm text-gray-500">
            {addresses[0]!.address}@planfortwo.com &middot; {totalEmails} message
            {totalEmails !== 1 ? 's' : ''}
            {unreadCount > 0 && ` \u00b7 ${unreadCount} unread`}
          </p>
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
          <Button variant="outline" size="sm" onClick={openMassEmail}>
            <Users className="mr-1 h-4 w-4" />
            Mass Email
          </Button>
          <Button
            size="sm"
            className="bg-rose-500 hover:bg-rose-600"
            onClick={() => setShowCompose(true)}
          >
            <Plus className="mr-1 h-4 w-4" />
            Compose
          </Button>
        </div>
      </motion.div>

      {/* Tabs */}
      <motion.div variants={fadeInUp} transition={springSmooth} className="mb-4">
        <Tabs
          value={activeTab}
          onValueChange={(v) => {
            setActiveTab(v as TabFilter)
            setPage(1)
            setSelectedEmail(null)
          }}
        >
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="inbound">
              <Inbox className="mr-1 h-3 w-3" />
              Inbox
            </TabsTrigger>
            <TabsTrigger value="outbound">
              <Send className="mr-1 h-3 w-3" />
              Sent
            </TabsTrigger>
            <TabsTrigger value="unread">
              <Mail className="mr-1 h-3 w-3" />
              Unread
            </TabsTrigger>
            <TabsTrigger value="starred">
              <Star className="mr-1 h-3 w-3" />
              Starred
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </motion.div>

      {/* Two-column layout */}
      <motion.div
        variants={fadeInUp}
        transition={springSmooth}
        className="flex h-[calc(100%-7rem)] gap-4"
      >
        {/* Email list */}
        <Card className="w-full flex-shrink-0 overflow-hidden md:w-[380px]">
          <div className="h-full overflow-y-auto">
            {emailList.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center p-8 text-gray-400">
                <Inbox className="mb-3 h-12 w-12" />
                <p className="text-sm">No emails yet</p>
              </div>
            ) : (
              <motion.div variants={staggerContainer} initial="hidden" animate="visible">
                {emailList.map((email) => (
                  <motion.div
                    key={email.id}
                    variants={listItem}
                    transition={springSmooth}
                    className={`flex cursor-pointer items-start gap-3 border-b p-3 transition-colors ${
                      selectedEmail?.id === email.id ? 'bg-rose-50' : 'hover:bg-gray-50'
                    } ${!email.isRead ? 'bg-blue-50/50' : ''}`}
                    onClick={() => handleSelectEmail(email)}
                  >
                    <div className="pt-1">
                      {email.isRead ? (
                        <MailOpen className="h-4 w-4 text-gray-400" />
                      ) : (
                        <Mail className="h-4 w-4 text-blue-500" />
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
                        className={`truncate text-sm ${!email.isRead ? 'font-medium' : 'text-gray-600'}`}
                      >
                        {email.subject}
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
                      className="flex-shrink-0 pt-1"
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

        {/* Email detail */}
        <Card className="hidden flex-1 overflow-hidden md:block">
          {selectedEmail ? (
            <div className="flex h-full flex-col">
              {/* Detail header */}
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
                  </div>
                  <h2 className="text-lg font-semibold text-gray-900">
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
                    {selectedEmail.replyTo && (
                      <p>
                        <span className="font-medium text-gray-700">Reply-To:</span>{' '}
                        {selectedEmail.replyTo}
                      </p>
                    )}
                    <p>
                      <span className="font-medium text-gray-700">Date:</span>{' '}
                      {new Date(selectedEmail.createdAt).toLocaleString([], {
                        weekday: 'short',
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                    </p>
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
                    onClick={() => {
                      setComposeForm({
                        toAddress:
                          selectedEmail.direction === 'inbound'
                            ? selectedEmail.fromAddress
                            : selectedEmail.toAddress,
                        subject: selectedEmail.subject.startsWith('Re:')
                          ? selectedEmail.subject
                          : `Re: ${selectedEmail.subject}`,
                        textBody: '',
                      })
                      setShowCompose(true)
                    }}
                  >
                    <Reply className="h-4 w-4 text-gray-500" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    title="Delete"
                    className="text-red-500 hover:text-red-700"
                    onClick={() => handleDelete(selectedEmail.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Email body */}
              <div className="flex-1 overflow-y-auto p-4">
                {selectedEmail.htmlBody ? (
                  <iframe
                    ref={iframeRef}
                    sandbox="allow-same-origin allow-popups"
                    srcDoc={buildEmailSrcDoc(selectedEmail.htmlBody)}
                    className="w-full border-0"
                    title="Email content"
                    style={{ minHeight: '200px' }}
                    onLoad={handleIframeLoad}
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
                      <button
                        key={att.id}
                        type="button"
                        onClick={async () => {
                          try {
                            if (att.url) {
                              window.open(att.url, '_blank', 'noopener,noreferrer')
                            } else {
                              const token = await getToken()
                              if (!token) return
                              const res = await api.inbox.getAttachmentUrl(att.id, token)
                              window.open(res.data.url, '_blank', 'noopener,noreferrer')
                            }
                          } catch {
                            toast.error('Failed to open attachment')
                          }
                        }}
                        className="flex cursor-pointer items-center gap-2 rounded-lg border bg-gray-50 px-3 py-2 transition-colors hover:border-rose-200 hover:bg-rose-50"
                      >
                        <span className="text-base">{getFileIcon(att.contentType)}</span>
                        <div className="min-w-0 text-left">
                          <p className="truncate text-xs font-medium text-gray-700">
                            {att.filename}
                          </p>
                          <p className="text-[10px] text-gray-400">{formatFileSize(att.size)}</p>
                        </div>
                        <Download className="ml-1 h-3.5 w-3.5 text-rose-500" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex h-full flex-col items-center justify-center text-gray-400">
              <Mail className="mb-3 h-16 w-16 opacity-30" />
              <p className="text-sm font-medium">Select an email to read</p>
              <p className="mt-1 text-xs">Choose a message from the list on the left</p>
            </div>
          )}
        </Card>
      </motion.div>

      {/* Compose Dialog */}
      <Dialog
        open={showCompose}
        onOpenChange={(open) => {
          setShowCompose(open)
          if (!open) setComposeAttachments([])
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Compose Email</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-xs text-gray-500">
                From: {addresses[0]?.displayName} &lt;{addresses[0]?.address}@planfortwo.com&gt;
              </Label>
            </div>
            <div>
              <Label htmlFor="to">To</Label>
              <Input
                id="to"
                type="email"
                placeholder="recipient@example.com"
                value={composeForm.toAddress}
                onChange={(e) => setComposeForm((f) => ({ ...f, toAddress: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                placeholder="Subject"
                value={composeForm.subject}
                onChange={(e) => setComposeForm((f) => ({ ...f, subject: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="body">Message</Label>
              <Textarea
                id="body"
                placeholder="Write your message..."
                rows={8}
                value={composeForm.textBody}
                onChange={(e) => setComposeForm((f) => ({ ...f, textBody: e.target.value }))}
              />
            </div>

            {/* Attachments */}
            <div>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept={ACCEPT_STRING}
                onChange={handleFileSelect}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={composeAttachments.length >= MAX_ATTACHMENTS}
                className="gap-2"
              >
                <Paperclip className="h-4 w-4" />
                Attach Files
              </Button>
              <span className="ml-2 text-xs text-gray-400">
                PDF, JPG, PNG, HEIC up to 25MB each
              </span>

              {composeAttachments.length > 0 && (
                <div className="mt-2 space-y-1.5">
                  {composeAttachments.map((att) => (
                    <div
                      key={att.id}
                      className="flex items-center gap-2 rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm"
                    >
                      {att.contentType.startsWith('image/') ? (
                        <FileImage className="h-4 w-4 shrink-0 text-blue-500" />
                      ) : (
                        <FileText className="h-4 w-4 shrink-0 text-red-500" />
                      )}
                      <span className="min-w-0 flex-1 truncate text-gray-700">{att.filename}</span>
                      <span className="shrink-0 text-xs text-gray-400">
                        {formatFileSize(att.size)}
                      </span>
                      {att.status === 'uploading' && (
                        <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-gray-400" />
                      )}
                      {att.status === 'done' && (
                        <Check className="h-3.5 w-3.5 shrink-0 text-green-500" />
                      )}
                      {att.status === 'error' && (
                        <span className="shrink-0 text-xs text-red-500">Failed</span>
                      )}
                      <button
                        type="button"
                        onClick={() => removeAttachment(att.id)}
                        className="shrink-0 rounded p-0.5 text-gray-400 hover:bg-gray-200 hover:text-gray-600"
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
            <Button
              variant="outline"
              onClick={() => {
                setShowCompose(false)
                setComposeAttachments([])
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSend}
              disabled={
                sending ||
                !composeForm.toAddress ||
                !composeForm.subject ||
                !composeForm.textBody ||
                composeAttachments.some((a) => a.status === 'uploading')
              }
              className="bg-rose-500 hover:bg-rose-600"
            >
              {sending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Send className="mr-2 h-4 w-4" />
              )}
              Send
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Mass Email Dialog */}
      <Dialog open={showMassEmail} onOpenChange={setShowMassEmail}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Mass Email to Guests</DialogTitle>
          </DialogHeader>

          {massGuestsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-rose-400" />
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <Label className="text-xs text-gray-500">
                  From: {addresses[0]?.displayName} &lt;{addresses[0]?.address}@planfortwo.com&gt;
                </Label>
              </div>

              {/* Guest selection */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <Label>
                    Recipients ({massSelected.size} of {guestsWithEmail.length} guests with email)
                  </Label>
                  <button
                    type="button"
                    onClick={handleSelectAll}
                    className="text-xs font-medium text-rose-600 hover:text-rose-700"
                  >
                    {massSelected.size === filteredMassGuests.length &&
                    filteredMassGuests.length > 0
                      ? 'Deselect All'
                      : 'Select All'}
                  </button>
                </div>
                <div className="relative mb-2">
                  <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="Search guests..."
                    value={massGuestSearch}
                    onChange={(e) => setMassGuestSearch(e.target.value)}
                    className="pl-9 text-sm"
                  />
                </div>
                <div className="max-h-48 overflow-y-auto rounded-lg border border-gray-200">
                  {filteredMassGuests.length === 0 ? (
                    <p className="p-3 text-center text-sm text-gray-400">
                      {guestsWithEmail.length === 0
                        ? 'No guests have email addresses'
                        : 'No matching guests'}
                    </p>
                  ) : (
                    filteredMassGuests.map((guest) => (
                      <label
                        key={guest.id}
                        className="flex cursor-pointer items-center gap-3 border-b border-gray-100 px-3 py-2 last:border-b-0 hover:bg-gray-50"
                      >
                        <input
                          type="checkbox"
                          checked={massSelected.has(guest.id)}
                          onChange={() => toggleMassGuest(guest.id)}
                          className="h-4 w-4 rounded border-gray-300 text-rose-600 focus:ring-rose-500"
                        />
                        <div className="min-w-0 flex-1">
                          <span className="text-sm font-medium text-gray-900">
                            {guest.firstName} {guest.lastName}
                          </span>
                          <span className="ml-2 text-xs text-gray-400">{guest.email}</span>
                        </div>
                      </label>
                    ))
                  )}
                </div>
              </div>

              {/* Subject & body */}
              <div>
                <Label htmlFor="mass-subject">Subject</Label>
                <Input
                  id="mass-subject"
                  placeholder="Subject"
                  value={massForm.subject}
                  onChange={(e) => setMassForm((f) => ({ ...f, subject: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="mass-body">Message</Label>
                <Textarea
                  id="mass-body"
                  placeholder="Write your message..."
                  rows={6}
                  value={massForm.textBody}
                  onChange={(e) => setMassForm((f) => ({ ...f, textBody: e.target.value }))}
                />
              </div>

              {/* Attachments */}
              <div>
                <input
                  ref={massFileInputRef}
                  type="file"
                  multiple
                  accept={ACCEPT_STRING}
                  onChange={handleMassFileSelect}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => massFileInputRef.current?.click()}
                  disabled={massAttachments.length >= MAX_ATTACHMENTS || massSending}
                  className="gap-2"
                >
                  <Paperclip className="h-4 w-4" />
                  Attach Files
                </Button>
                <span className="ml-2 text-xs text-gray-400">
                  PDF, JPG, PNG, HEIC up to 25MB each
                </span>

                {massAttachments.length > 0 && (
                  <div className="mt-2 space-y-1.5">
                    {massAttachments.map((att) => (
                      <div
                        key={att.id}
                        className="flex items-center gap-2 rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm"
                      >
                        {att.contentType.startsWith('image/') ? (
                          <FileImage className="h-4 w-4 shrink-0 text-blue-500" />
                        ) : (
                          <FileText className="h-4 w-4 shrink-0 text-red-500" />
                        )}
                        <span className="min-w-0 flex-1 truncate text-gray-700">
                          {att.filename}
                        </span>
                        <span className="shrink-0 text-xs text-gray-400">
                          {formatFileSize(att.size)}
                        </span>
                        {att.status === 'uploading' && (
                          <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-gray-400" />
                        )}
                        {att.status === 'done' && (
                          <Check className="h-3.5 w-3.5 shrink-0 text-green-500" />
                        )}
                        {att.status === 'error' && (
                          <span className="shrink-0 text-xs text-red-500">Failed</span>
                        )}
                        <button
                          type="button"
                          onClick={() => removeMassAttachment(att.id)}
                          disabled={massSending}
                          className="shrink-0 rounded p-0.5 text-gray-400 hover:bg-gray-200 hover:text-gray-600"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {massSending && (
                <div className="space-y-1">
                  <div className="h-2 overflow-hidden rounded-full bg-gray-200">
                    <div
                      className="h-full rounded-full bg-rose-500 transition-all"
                      style={{
                        width: `${massSendProgress.total > 0 ? (massSendProgress.sent / massSendProgress.total) * 100 : 0}%`,
                      }}
                    />
                  </div>
                  <p className="text-center text-xs text-gray-500">
                    Sending {massSendProgress.sent} of {massSendProgress.total}...
                  </p>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowMassEmail(false)
                setMassAttachments([])
              }}
              disabled={massSending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleMassSend}
              disabled={
                massSending ||
                massSelected.size === 0 ||
                !massForm.subject ||
                !massForm.textBody ||
                massAttachments.some((a) => a.status === 'uploading')
              }
              className="bg-rose-500 hover:bg-rose-600"
            >
              {massSending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Send className="mr-2 h-4 w-4" />
              )}
              Send to {massSelected.size} Guest{massSelected.size !== 1 ? 's' : ''}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}
