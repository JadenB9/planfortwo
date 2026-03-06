'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@clerk/nextjs'
import { motion } from 'framer-motion'
import DOMPurify from 'dompurify'
import { springSmooth, fadeInUp, staggerContainer, listItem } from '@/lib/animations'
import { api } from '@/lib/api'
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
  ArrowLeft,
  RefreshCw,
  Plus,
  Mail,
  MailOpen,
  Loader2,
  Check,
  AtSign,
} from 'lucide-react'
import type { Email, EmailAddress } from '@planfortwo/types'
import { toast } from 'sonner'

type TabFilter = 'all' | 'inbound' | 'outbound' | 'starred'

export default function InboxPage() {
  const { getToken } = useAuth()
  const [loading, setLoading] = useState(true)
  const [addresses, setAddresses] = useState<EmailAddress[]>([])
  const [emailList, setEmailList] = useState<Email[]>([])
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null)
  const [activeTab, setActiveTab] = useState<TabFilter>('all')
  const [totalEmails, setTotalEmails] = useState(0)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)

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
    if (activeTab === 'starred') filters.isStarred = true

    try {
      const res = await api.inbox.list(token, filters)
      setEmailList(res.data)
      setTotalEmails(res.total)
      setHasMore(res.hasMore)
    } catch {
      toast.error('Failed to load emails')
      setEmailList([])
    }
  }, [getToken, page, activeTab])

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
    }
  }, [addresses.length, fetchEmails])

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

  const handleSelectEmail = async (email: Email) => {
    const token = await getToken()
    if (!token) return

    try {
      const res = await api.inbox.get(email.id, token)
      setSelectedEmail(res.data)
      if (!email.isRead) {
        setEmailList((prev) => prev.map((e) => (e.id === email.id ? { ...e, isRead: true } : e)))
      }
    } catch {
      toast.error('Failed to load email')
      setSelectedEmail(email)
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

  const handleSend = async () => {
    const token = await getToken()
    if (!token || addresses.length === 0) return

    setSending(true)
    try {
      await api.inbox.send(
        {
          emailAddressId: addresses[0]!.id,
          toAddress: composeForm.toAddress,
          subject: composeForm.subject,
          textBody: composeForm.textBody,
        },
        token,
      )
      toast.success('Email sent')
      setShowCompose(false)
      setComposeForm({ toAddress: '', subject: '', textBody: '' })
      await fetchEmails()
    } catch {
      toast.error('Failed to send email')
    } finally {
      setSending(false)
    }
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
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-rose-400" />
      </div>
    )
  }

  // ── No address claimed yet ──
  if (addresses.length === 0) {
    return (
      <motion.div
        className="max-w-lg mx-auto mt-16"
        variants={fadeInUp}
        initial="hidden"
        animate="visible"
        transition={springSmooth}
      >
        <Card>
          <CardContent className="p-8">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AtSign className="h-8 w-8 text-rose-500" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Claim Your Email Address</h1>
              <p className="text-gray-500">
                Get your own <span className="font-medium">@planfortwo.com</span> email address to
                send and receive messages.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="address">Email Address</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Input
                    id="address"
                    placeholder="yourname"
                    value={claimAddress}
                    onChange={(e) => setClaimAddress(e.target.value.toLowerCase())}
                    className="flex-1"
                  />
                  <span className="text-gray-500 text-sm whitespace-nowrap">@planfortwo.com</span>
                </div>
                {checkingAvailability && (
                  <p className="text-sm text-gray-400 mt-1">Checking availability...</p>
                )}
                {availability && !checkingAvailability && (
                  <p
                    className={`text-sm mt-1 ${availability.available ? 'text-green-600' : 'text-red-500'}`}
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
                <div className="bg-gray-50 rounded-lg p-3 text-sm">
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
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Mail className="h-4 w-4 mr-2" />
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
        className="flex items-center justify-between mb-4"
      >
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inbox</h1>
          <p className="text-sm text-gray-500">
            {addresses[0]!.address}@planfortwo.com &middot; {totalEmails} messages
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchEmails}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            className="bg-rose-500 hover:bg-rose-600"
            onClick={() => setShowCompose(true)}
          >
            <Plus className="h-4 w-4 mr-1" />
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
              <Inbox className="h-3 w-3 mr-1" />
              Inbox
            </TabsTrigger>
            <TabsTrigger value="outbound">
              <Send className="h-3 w-3 mr-1" />
              Sent
            </TabsTrigger>
            <TabsTrigger value="starred">
              <Star className="h-3 w-3 mr-1" />
              Starred
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </motion.div>

      {/* Two-column layout */}
      <motion.div
        variants={fadeInUp}
        transition={springSmooth}
        className="flex gap-4 h-[calc(100%-7rem)]"
      >
        {/* Email list */}
        <Card className="w-full md:w-[380px] flex-shrink-0 overflow-hidden">
          <div className="overflow-y-auto h-full">
            {emailList.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400 p-8">
                <Inbox className="h-12 w-12 mb-3" />
                <p className="text-sm">No emails yet</p>
              </div>
            ) : (
              <motion.div variants={staggerContainer} initial="hidden" animate="visible">
                {emailList.map((email) => (
                  <motion.div
                    key={email.id}
                    variants={listItem}
                    transition={springSmooth}
                    className={`flex items-start gap-3 p-3 border-b cursor-pointer transition-colors ${
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
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p
                          className={`text-sm truncate ${!email.isRead ? 'font-semibold text-gray-900' : 'text-gray-700'}`}
                        >
                          {email.direction === 'inbound'
                            ? (email.fromName ?? email.fromAddress)
                            : `To: ${email.toAddress}`}
                        </p>
                        <span className="text-xs text-gray-400 flex-shrink-0 ml-2">
                          {formatDate(email.createdAt)}
                        </span>
                      </div>
                      <p
                        className={`text-sm truncate ${!email.isRead ? 'font-medium' : 'text-gray-600'}`}
                      >
                        {email.subject}
                      </p>
                      <p className="text-xs text-gray-400 truncate">{getSnippet(email)}</p>
                    </div>
                    <button
                      onClick={(e) => handleToggleStar(email, e)}
                      className="pt-1 flex-shrink-0"
                    >
                      {email.isStarred ? (
                        <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
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
              <div className="flex items-center justify-between p-3 border-t">
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
        <Card className="flex-1 overflow-hidden hidden md:block">
          {selectedEmail ? (
            <div className="h-full flex flex-col">
              {/* Detail header */}
              <div className="p-4 border-b flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
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
                    <span className="text-xs text-gray-400">
                      {new Date(selectedEmail.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <h2 className="text-lg font-semibold text-gray-900">{selectedEmail.subject}</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    <span className="font-medium">From:</span>{' '}
                    {selectedEmail.fromName
                      ? `${selectedEmail.fromName} <${selectedEmail.fromAddress}>`
                      : selectedEmail.fromAddress}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">To:</span> {selectedEmail.toAddress}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      handleToggleStar(selectedEmail, { stopPropagation: () => {} } as React.MouseEvent)
                    }
                  >
                    {selectedEmail.isStarred ? (
                      <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                    ) : (
                      <StarOff className="h-4 w-4 text-gray-400" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setComposeForm({
                        toAddress: selectedEmail.direction === 'inbound' ? selectedEmail.fromAddress : selectedEmail.toAddress,
                        subject: selectedEmail.subject.startsWith('Re:')
                          ? selectedEmail.subject
                          : `Re: ${selectedEmail.subject}`,
                        textBody: '',
                      })
                      setShowCompose(true)
                    }}
                  >
                    <ArrowLeft className="h-4 w-4 rotate-[135deg]" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
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
                  <div
                    className="prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{
                      __html: DOMPurify.sanitize(selectedEmail.htmlBody),
                    }}
                  />
                ) : (
                  <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans">
                    {selectedEmail.textBody ?? '(No content)'}
                  </pre>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <Mail className="h-16 w-16 mb-3" />
              <p className="text-sm">Select an email to read</p>
            </div>
          )}
        </Card>
      </motion.div>

      {/* Compose Dialog */}
      <Dialog open={showCompose} onOpenChange={setShowCompose}>
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
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCompose(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSend}
              disabled={
                sending || !composeForm.toAddress || !composeForm.subject || !composeForm.textBody
              }
              className="bg-rose-500 hover:bg-rose-600"
            >
              {sending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
              Send
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}
