'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@clerk/nextjs'
import { motion } from 'framer-motion'
import { springSmooth, staggerContainer, fadeInUp } from '@/lib/animations'
import { useWedding } from '@/hooks/use-wedding'
import { api } from '@/lib/api'
import type { RegistryLink, CashFund, Gift, ThankYouStatus } from '@planfortwo/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Pencil } from 'lucide-react'
import { toast } from 'sonner'

type Tab = 'links' | 'funds' | 'gifts'

const TABS: { key: Tab; label: string }[] = [
  { key: 'links', label: 'Registry Links' },
  { key: 'funds', label: 'Cash Funds' },
  { key: 'gifts', label: 'Gift Tracker' },
]

const THANK_YOU_COLORS: Record<ThankYouStatus, string> = {
  not_started: 'bg-gray-100 text-gray-700',
  drafted: 'bg-amber-100 text-amber-700',
  sent: 'bg-green-100 text-green-700',
}

export default function RegistryPage() {
  const { getToken } = useAuth()
  const { data: weddingData, loading: weddingLoading } = useWedding()
  const weddingId = weddingData?.wedding.id ?? null

  const [activeTab, setActiveTab] = useState<Tab>('links')
  const [links, setLinks] = useState<RegistryLink[]>([])
  const [funds, setFunds] = useState<CashFund[]>([])
  const [gifts, setGifts] = useState<Gift[]>([])
  const [loading, setLoading] = useState(true)
  const [showLinkForm, setShowLinkForm] = useState(false)
  const [showFundForm, setShowFundForm] = useState(false)
  const [showGiftForm, setShowGiftForm] = useState(false)
  const [linkForm, setLinkForm] = useState({ storeName: '', url: '', logoUrl: '' })
  const [fundForm, setFundForm] = useState({ name: '', description: '', goalAmount: '' })
  const [giftForm, setGiftForm] = useState({
    guestName: '',
    description: '',
    estimatedValue: '',
    notes: '',
  })
  const [editingFund, setEditingFund] = useState<CashFund | null>(null)
  const [editingGift, setEditingGift] = useState<Gift | null>(null)

  const loadAll = useCallback(async () => {
    if (!weddingId) return
    try {
      const token = await getToken()
      if (!token) return
      const [linksRes, fundsRes, giftsRes] = await Promise.all([
        api.registry.listLinks(weddingId, token),
        api.registry.listFunds(weddingId, token),
        api.registry.listGifts(weddingId, token),
      ])
      setLinks(linksRes.data)
      setFunds(fundsRes.data)
      setGifts(giftsRes.data)
    } catch {
      toast.error('Failed to load registry data')
    } finally {
      setLoading(false)
    }
  }, [weddingId, getToken])

  useEffect(() => {
    void loadAll()
  }, [loadAll])

  const handleAddLink = async () => {
    if (!weddingId || !linkForm.storeName.trim() || !linkForm.url.trim()) return
    try {
      const token = await getToken()
      if (!token) return
      await api.registry.createLink(
        {
          weddingId,
          storeName: linkForm.storeName.trim(),
          url: linkForm.url.trim(),
          logoUrl: linkForm.logoUrl || undefined,
        },
        token,
      )
      toast.success('Registry link added')
      setLinkForm({ storeName: '', url: '', logoUrl: '' })
      setShowLinkForm(false)
      void loadAll()
    } catch {
      toast.error('Failed to add registry link')
    }
  }

  const handleDeleteLink = async (id: string) => {
    if (!weddingId) return
    try {
      const token = await getToken()
      if (!token) return
      await api.registry.deleteLink(id, weddingId, token)
      toast.success('Registry link removed')
      void loadAll()
    } catch {
      toast.error('Failed to delete registry link')
    }
  }

  const handleSaveFund = async () => {
    if (!weddingId || !fundForm.name.trim() || !fundForm.goalAmount) return
    try {
      const token = await getToken()
      if (!token) return
      if (editingFund) {
        await api.registry.updateFund(
          editingFund.id,
          weddingId,
          {
            name: fundForm.name.trim(),
            description: fundForm.description || undefined,
            goalAmount: parseFloat(fundForm.goalAmount),
          },
          token,
        )
        toast.success('Cash fund updated')
      } else {
        await api.registry.createFund(
          {
            weddingId,
            name: fundForm.name.trim(),
            description: fundForm.description || undefined,
            goalAmount: parseFloat(fundForm.goalAmount),
          },
          token,
        )
        toast.success('Cash fund created')
      }
      setFundForm({ name: '', description: '', goalAmount: '' })
      setEditingFund(null)
      setShowFundForm(false)
      void loadAll()
    } catch {
      toast.error('Failed to save cash fund')
    }
  }

  const handleToggleFundActive = async (fund: CashFund) => {
    if (!weddingId) return
    try {
      const token = await getToken()
      if (!token) return
      await api.registry.updateFund(fund.id, weddingId, { isActive: !fund.isActive }, token)
      toast.success(fund.isActive ? 'Fund closed' : 'Fund reopened')
      void loadAll()
    } catch {
      toast.error('Failed to update fund status')
    }
  }

  const openEditFund = (fund: CashFund) => {
    setEditingFund(fund)
    setFundForm({
      name: fund.name,
      description: fund.description ?? '',
      goalAmount: fund.goalAmount.toString(),
    })
    setShowFundForm(true)
  }

  const handleDeleteFund = async (id: string) => {
    if (!weddingId) return
    try {
      const token = await getToken()
      if (!token) return
      await api.registry.deleteFund(id, weddingId, token)
      toast.success('Cash fund deleted')
      void loadAll()
    } catch {
      toast.error('Failed to delete cash fund')
    }
  }

  const handleSaveGift = async () => {
    if (!weddingId || !giftForm.description.trim()) return
    try {
      const token = await getToken()
      if (!token) return
      if (editingGift) {
        await api.registry.updateGift(
          editingGift.id,
          weddingId,
          {
            description: giftForm.description.trim(),
            notes: giftForm.notes || undefined,
          },
          token,
        )
      } else {
        await api.registry.createGift(
          {
            weddingId,
            guestName: giftForm.guestName || undefined,
            description: giftForm.description.trim(),
            estimatedValue: giftForm.estimatedValue
              ? parseFloat(giftForm.estimatedValue)
              : undefined,
          },
          token,
        )
      }
      toast.success(editingGift ? 'Gift updated' : 'Gift logged')
      setGiftForm({ guestName: '', description: '', estimatedValue: '', notes: '' })
      setEditingGift(null)
      setShowGiftForm(false)
      void loadAll()
    } catch {
      toast.error('Failed to save gift')
    }
  }

  const handleUpdateThankYou = async (gift: Gift, status: ThankYouStatus) => {
    if (!weddingId) return
    try {
      const token = await getToken()
      if (!token) return
      await api.registry.updateGift(gift.id, weddingId, { thankYouStatus: status }, token)
      toast.success('Thank-you status updated')
      void loadAll()
    } catch {
      toast.error('Failed to update thank-you status')
    }
  }

  const handleDeleteGift = async (id: string) => {
    if (!weddingId) return
    try {
      const token = await getToken()
      if (!token) return
      await api.registry.deleteGift(id, weddingId, token)
      toast.success('Gift deleted')
      void loadAll()
    } catch {
      toast.error('Failed to delete gift')
    }
  }

  const isLoading = weddingLoading || loading

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="border-wedding-200 border-t-wedding-600 h-8 w-8 animate-spin rounded-full border-4" />
      </div>
    )
  }

  return (
    <motion.div
      className="mx-auto max-w-6xl"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ...springSmooth }}
    >
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl font-bold text-gray-900">Registry</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage your registries, cash funds, and gift tracking.
          </p>
        </div>
        <Button
          onClick={() => {
            if (activeTab === 'links') setShowLinkForm(true)
            else if (activeTab === 'funds') {
              setEditingFund(null)
              setFundForm({ name: '', description: '', goalAmount: '' })
              setShowFundForm(true)
            } else {
              setEditingGift(null)
              setGiftForm({ guestName: '', description: '', estimatedValue: '', notes: '' })
              setShowGiftForm(true)
            }
          }}
        >
          {activeTab === 'links'
            ? 'Add Registry'
            : activeTab === 'funds'
              ? 'Create Fund'
              : 'Log Gift'}
        </Button>
      </div>

      <div className="mb-6 border-b border-gray-200">
        <nav className="-mb-px flex gap-6">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`border-b-2 pb-3 text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? 'border-wedding-600 text-wedding-600'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === 'links' &&
        (links.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
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
                    d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                  />
                </svg>
              </div>
              <h2 className="font-serif text-xl font-semibold text-gray-900">No Registry Links</h2>
              <p className="mx-auto mt-2 max-w-md text-sm text-gray-600">
                Add links to your external registries so guests can find them easily.
              </p>
              <Button className="mt-6" onClick={() => setShowLinkForm(true)}>
                Add Registry Link
              </Button>
            </CardContent>
          </Card>
        ) : (
          <motion.div
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
          >
            {links.map((link) => (
              <motion.div key={link.id} variants={fadeInUp}>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">{link.storeName}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-wedding-600 text-sm hover:underline"
                    >
                      Visit Registry
                    </a>
                    <p className="mt-1 text-xs text-gray-500">{link.clickCount} clicks</p>
                    <button
                      onClick={() => handleDeleteLink(link.id)}
                      className="mt-3 text-xs text-red-500 hover:text-red-700"
                    >
                      Remove
                    </button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        ))}

      {activeTab === 'funds' &&
        (funds.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
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
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h2 className="font-serif text-xl font-semibold text-gray-900">No Cash Funds</h2>
              <p className="mx-auto mt-2 max-w-md text-sm text-gray-600">
                Create cash funds for your honeymoon, house, or anything else.
              </p>
              <Button
                className="mt-6"
                onClick={() => {
                  setEditingFund(null)
                  setFundForm({ name: '', description: '', goalAmount: '' })
                  setShowFundForm(true)
                }}
              >
                Create First Fund
              </Button>
            </CardContent>
          </Card>
        ) : (
          <motion.div
            className="grid gap-4 sm:grid-cols-2"
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
          >
            {funds.map((fund) => {
              const pct =
                fund.goalAmount > 0
                  ? Math.min(100, (fund.currentAmount / fund.goalAmount) * 100)
                  : 0
              return (
                <motion.div key={fund.id} variants={fadeInUp}>
                  <Card>
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-base">{fund.name}</CardTitle>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openEditFund(fund)}
                            className="text-gray-400 hover:text-gray-600"
                            title="Edit fund"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <Badge variant={fund.isActive ? 'default' : 'secondary'}>
                            {fund.isActive ? 'Active' : 'Closed'}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {fund.description && (
                        <p className="mb-3 text-sm text-gray-600">{fund.description}</p>
                      )}
                      <div className="flex items-end justify-between text-sm">
                        <span className="font-semibold text-gray-900">
                          ${fund.currentAmount.toLocaleString()}
                        </span>
                        <span className="text-gray-500">
                          of ${fund.goalAmount.toLocaleString()}
                        </span>
                      </div>
                      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-gray-100">
                        <div
                          className="bg-wedding-500 h-full rounded-full transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <p className="mt-1 text-xs text-gray-500">{Math.round(pct)}% funded</p>
                      <div className="mt-3 flex items-center gap-3">
                        <button
                          onClick={() => handleToggleFundActive(fund)}
                          className={`text-xs font-medium ${
                            fund.isActive
                              ? 'text-amber-600 hover:text-amber-700'
                              : 'text-green-600 hover:text-green-700'
                          }`}
                        >
                          {fund.isActive ? 'Close Fund' : 'Reopen Fund'}
                        </button>
                        <button
                          onClick={() => handleDeleteFund(fund.id)}
                          className="text-xs text-red-500 hover:text-red-700"
                        >
                          Delete
                        </button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </motion.div>
        ))}

      {activeTab === 'gifts' &&
        (gifts.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
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
                    d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7"
                  />
                </svg>
              </div>
              <h2 className="font-serif text-xl font-semibold text-gray-900">No Gifts Logged</h2>
              <p className="mx-auto mt-2 max-w-md text-sm text-gray-600">
                Track gifts you receive and manage thank-you notes.
              </p>
              <Button
                className="mt-6"
                onClick={() => {
                  setEditingGift(null)
                  setGiftForm({ guestName: '', description: '', estimatedValue: '', notes: '' })
                  setShowGiftForm(true)
                }}
              >
                Log a Gift
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {gifts.map((gift) => (
              <Card key={gift.id}>
                <CardContent className="flex items-center justify-between py-4">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{gift.description}</p>
                    <div className="mt-1 flex items-center gap-3 text-xs text-gray-500">
                      {gift.guestName && <span>From: {gift.guestName}</span>}
                      {gift.estimatedValue != null && (
                        <span>${gift.estimatedValue.toLocaleString()}</span>
                      )}
                      {gift.receivedAt && (
                        <span>Received {new Date(gift.receivedAt).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <select
                      value={gift.thankYouStatus}
                      onChange={(e) => handleUpdateThankYou(gift, e.target.value as ThankYouStatus)}
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${THANK_YOU_COLORS[gift.thankYouStatus]}`}
                    >
                      <option value="not_started">Not Started</option>
                      <option value="drafted">Drafted</option>
                      <option value="sent">Sent</option>
                    </select>
                    <button
                      onClick={() => handleDeleteGift(gift.id)}
                      className="text-xs text-red-500 hover:text-red-700"
                    >
                      Delete
                    </button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ))}

      <Dialog open={showLinkForm} onOpenChange={setShowLinkForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Registry Link</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="rl-name">Store Name</Label>
              <Input
                id="rl-name"
                value={linkForm.storeName}
                onChange={(e) => setLinkForm({ ...linkForm, storeName: e.target.value })}
                placeholder="e.g., Amazon, Crate & Barrel"
              />
            </div>
            <div>
              <Label htmlFor="rl-url">URL</Label>
              <Input
                id="rl-url"
                value={linkForm.url}
                onChange={(e) => setLinkForm({ ...linkForm, url: e.target.value })}
                placeholder="https://..."
              />
            </div>
            <div>
              <Label htmlFor="rl-logo">Logo URL (optional)</Label>
              <Input
                id="rl-logo"
                value={linkForm.logoUrl}
                onChange={(e) => setLinkForm({ ...linkForm, logoUrl: e.target.value })}
                placeholder="https://..."
              />
            </div>
            <Button onClick={handleAddLink} className="w-full">
              Add Registry
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={showFundForm}
        onOpenChange={(open) => {
          if (!open) {
            setEditingFund(null)
            setShowFundForm(false)
          } else setShowFundForm(true)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingFund ? 'Edit Cash Fund' : 'Create Cash Fund'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="cf-name">Fund Name</Label>
              <Input
                id="cf-name"
                value={fundForm.name}
                onChange={(e) => setFundForm({ ...fundForm, name: e.target.value })}
                placeholder="e.g., Honeymoon Fund"
              />
            </div>
            <div>
              <Label htmlFor="cf-desc">Description</Label>
              <Textarea
                id="cf-desc"
                value={fundForm.description}
                onChange={(e) => setFundForm({ ...fundForm, description: e.target.value })}
                rows={2}
                placeholder="Tell guests what this fund is for"
              />
            </div>
            <div>
              <Label htmlFor="cf-goal">Goal Amount ($)</Label>
              <Input
                id="cf-goal"
                type="number"
                value={fundForm.goalAmount}
                onChange={(e) => setFundForm({ ...fundForm, goalAmount: e.target.value })}
                placeholder="5000"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setEditingFund(null)
                setShowFundForm(false)
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveFund}
              disabled={!fundForm.name.trim() || !fundForm.goalAmount}
            >
              {editingFund ? 'Save Changes' : 'Create Fund'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={showGiftForm}
        onOpenChange={(open) => {
          if (!open) {
            setEditingGift(null)
            setShowGiftForm(false)
          } else setShowGiftForm(true)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingGift ? 'Edit Gift' : 'Log a Gift'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="g-guest">From (Guest Name)</Label>
              <Input
                id="g-guest"
                value={giftForm.guestName}
                onChange={(e) => setGiftForm({ ...giftForm, guestName: e.target.value })}
                placeholder="Guest name"
              />
            </div>
            <div>
              <Label htmlFor="g-desc">Description</Label>
              <Input
                id="g-desc"
                value={giftForm.description}
                onChange={(e) => setGiftForm({ ...giftForm, description: e.target.value })}
                placeholder="What was the gift?"
              />
            </div>
            <div>
              <Label htmlFor="g-val">Estimated Value ($)</Label>
              <Input
                id="g-val"
                type="number"
                value={giftForm.estimatedValue}
                onChange={(e) => setGiftForm({ ...giftForm, estimatedValue: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="g-notes">Notes</Label>
              <Textarea
                id="g-notes"
                value={giftForm.notes}
                onChange={(e) => setGiftForm({ ...giftForm, notes: e.target.value })}
                rows={2}
              />
            </div>
            <Button onClick={handleSaveGift} className="w-full">
              {editingGift ? 'Save Changes' : 'Log Gift'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}
