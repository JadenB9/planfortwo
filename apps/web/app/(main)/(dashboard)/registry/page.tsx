'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useAuth } from '@clerk/nextjs'
import { motion, AnimatePresence } from 'framer-motion'
import { springSmooth, staggerGrid, staggerContainer, fadeInUp, scaleIn } from '@/lib/animations'
import { useWedding } from '@/hooks/use-wedding'
import { api } from '@/lib/api'
import type { RegistryLink, CashFund, Gift, ThankYouStatus } from '@planfortwo/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  ShoppingCart,
  Target,
  Box,
  Home,
  Heart,
  Palette,
  Plus,
  ExternalLink,
  Trash2,
  Pencil,
  Gift as GiftIcon,
  Banknote,
  Plane,
  DollarSign,
  Check,
  Link2,
  ChefHat,
  Bath,
  Armchair,
  Share2,
  Copy,
  Eye,
} from 'lucide-react'
import { toast } from 'sonner'
import type { LucideIcon } from 'lucide-react'
import { openRegistryLink } from '@/components/registry/registry-viewer'
import { useTabParam } from '@/hooks/use-tab-param'

// ── Types ──

type Tab = 'links' | 'funds' | 'gifts'
const VALID_REGISTRY_TABS: Tab[] = ['links', 'funds', 'gifts']

interface PopularStore {
  name: string
  color: string
  icon: LucideIcon
}

// ── Constants ──

const TABS: { key: Tab; label: string; icon: LucideIcon }[] = [
  { key: 'links', label: 'Registry Links', icon: Link2 },
  { key: 'funds', label: 'Cash Funds', icon: DollarSign },
  { key: 'gifts', label: 'Gift Tracker', icon: GiftIcon },
]

const POPULAR_STORES: PopularStore[] = [
  { name: 'Amazon', color: '#FF9900', icon: ShoppingCart },
  { name: 'Target', color: '#CC0000', icon: Target },
  { name: 'Crate & Barrel', color: '#1a1a1a', icon: Box },
  { name: 'Pottery Barn', color: '#6B4226', icon: Home },
  { name: 'Williams Sonoma', color: '#2C3E50', icon: ChefHat },
  { name: 'Bed Bath & Beyond', color: '#003DA5', icon: Bath },
  { name: 'Zola', color: '#0066FF', icon: Heart },
  { name: 'West Elm', color: '#333333', icon: Armchair },
  { name: 'Etsy', color: '#F56400', icon: Palette },
]

const STORE_COLOR_MAP: Record<string, string> = Object.fromEntries(
  POPULAR_STORES.map((s) => [s.name.toLowerCase(), s.color]),
)

function getStoreColor(storeName: string): string {
  return STORE_COLOR_MAP[storeName.toLowerCase()] ?? '#6B7280'
}

function getFundIcon(name: string): LucideIcon {
  const lower = name.toLowerCase()
  if (lower.includes('honeymoon') || lower.includes('travel') || lower.includes('trip'))
    return Plane
  if (lower.includes('house') || lower.includes('home') || lower.includes('apartment')) return Home
  return Banknote
}

const THANK_YOU_STEPS: { status: ThankYouStatus; label: string }[] = [
  { status: 'not_started', label: 'Not Started' },
  { status: 'drafted', label: 'Drafted' },
  { status: 'sent', label: 'Sent' },
]

function getThankYouLevel(status: ThankYouStatus): number {
  if (status === 'sent') return 3
  if (status === 'drafted') return 2
  return 0
}

// ── Component ──

export default function RegistryPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-20">
          <div className="border-wedding-200 border-t-wedding-600 h-8 w-8 animate-spin rounded-full border-4" />
        </div>
      }
    >
      <RegistryPageInner />
    </Suspense>
  )
}

function RegistryPageInner() {
  const { getToken } = useAuth()
  const { data: weddingData, loading: weddingLoading } = useWedding()
  const weddingId = weddingData?.wedding.id ?? null

  const [activeTab, setActiveTab] = useTabParam<Tab>('tab', 'links', VALID_REGISTRY_TABS)
  const [links, setLinks] = useState<RegistryLink[]>([])
  const [funds, setFunds] = useState<CashFund[]>([])
  const [gifts, setGifts] = useState<Gift[]>([])
  const [loading, setLoading] = useState(true)

  // Dialog states
  const [showLinkForm, setShowLinkForm] = useState(false)
  const [showFundForm, setShowFundForm] = useState(false)
  const [showGiftForm, setShowGiftForm] = useState(false)

  // Form states
  const [linkForm, setLinkForm] = useState({ storeName: '', url: '' })
  const [fundForm, setFundForm] = useState({ name: '', description: '', goalAmount: '' })
  const [giftForm, setGiftForm] = useState({
    guestName: '',
    description: '',
    estimatedValue: '',
    notes: '',
  })

  // Edit states
  const [editingFund, setEditingFund] = useState<CashFund | null>(null)
  const [editingGift, setEditingGift] = useState<Gift | null>(null)

  // ── Data Loading ──

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

  // ── Registry Link Handlers ──

  const openAddLinkForStore = (storeName: string) => {
    setLinkForm({ storeName, url: '' })
    setShowLinkForm(true)
  }

  const openAddLinkCustom = () => {
    setLinkForm({ storeName: '', url: '' })
    setShowLinkForm(true)
  }

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
        },
        token,
      )
      toast.success('Registry link added')
      setLinkForm({ storeName: '', url: '' })
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

  const handleCopyLink = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url)
      toast.success('Link copied to clipboard')
    } catch {
      toast.error('Failed to copy link')
    }
  }

  // ── Cash Fund Handlers ──

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

  const openCreateFund = () => {
    setEditingFund(null)
    setFundForm({ name: '', description: '', goalAmount: '' })
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

  // ── Gift Handlers ──

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

  const openEditGift = (gift: Gift) => {
    setEditingGift(gift)
    setGiftForm({
      guestName: gift.guestName ?? '',
      description: gift.description,
      estimatedValue: gift.estimatedValue?.toString() ?? '',
      notes: gift.notes ?? '',
    })
    setShowGiftForm(true)
  }

  const openLogGift = () => {
    setEditingGift(null)
    setGiftForm({ guestName: '', description: '', estimatedValue: '', notes: '' })
    setShowGiftForm(true)
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

  // ── Loading State ──

  const isLoading = weddingLoading || loading

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="border-wedding-200 border-t-wedding-600 h-8 w-8 animate-spin rounded-full border-4" />
      </div>
    )
  }

  // ── Stats ──

  const totalGiftsValue = gifts.reduce((sum, g) => sum + (g.estimatedValue ?? 0), 0)
  const thankYouSent = gifts.filter((g) => g.thankYouStatus === 'sent').length
  const totalFundsRaised = funds.reduce((sum, f) => sum + f.currentAmount, 0)

  // ── Render ──

  return (
    <motion.div
      className="mx-auto max-w-6xl"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ...springSmooth }}
    >
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-serif text-3xl font-bold text-gray-900">Registry</h1>
            <p className="mt-1 text-sm text-gray-600">
              Manage your registries, cash funds, and gift tracking.
            </p>
          </div>
          <Button
            onClick={() => {
              if (activeTab === 'links') openAddLinkCustom()
              else if (activeTab === 'funds') openCreateFund()
              else openLogGift()
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            {activeTab === 'links'
              ? 'Add Registry'
              : activeTab === 'funds'
                ? 'Create Fund'
                : 'Log Gift'}
          </Button>
        </div>

        {/* Quick Stats */}
        {(links.length > 0 || funds.length > 0 || gifts.length > 0) && (
          <motion.div
            className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4"
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
          >
            <motion.div variants={fadeInUp}>
              <Card>
                <CardContent className="px-4 py-3">
                  <p className="text-xs font-medium text-gray-500">Registries</p>
                  <p className="text-2xl font-bold text-gray-900">{links.length}</p>
                </CardContent>
              </Card>
            </motion.div>
            <motion.div variants={fadeInUp}>
              <Card>
                <CardContent className="px-4 py-3">
                  <p className="text-xs font-medium text-gray-500">Funds Raised</p>
                  <p className="text-2xl font-bold text-gray-900">
                    ${totalFundsRaised.toLocaleString()}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
            <motion.div variants={fadeInUp}>
              <Card>
                <CardContent className="px-4 py-3">
                  <p className="text-xs font-medium text-gray-500">Gifts Value</p>
                  <p className="text-2xl font-bold text-gray-900">
                    ${totalGiftsValue.toLocaleString()}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
            <motion.div variants={fadeInUp}>
              <Card>
                <CardContent className="px-4 py-3">
                  <p className="text-xs font-medium text-gray-500">Thank Yous Sent</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {thankYouSent}
                    <span className="text-sm font-normal text-gray-400"> / {gifts.length}</span>
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="-mb-px flex gap-6">
          {TABS.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 border-b-2 pb-3 text-sm font-medium transition-colors ${
                  activeTab === tab.key
                    ? 'border-wedding-600 text-wedding-600'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            )
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'links' && (
          <motion.div
            key="links"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25, ...springSmooth }}
          >
            <LinksTab
              links={links}
              onAddStore={openAddLinkForStore}
              onAddCustom={openAddLinkCustom}
              onDelete={handleDeleteLink}
              onCopy={handleCopyLink}
              onView={(link) => openRegistryLink(link.url)}
            />
          </motion.div>
        )}

        {activeTab === 'funds' && (
          <motion.div
            key="funds"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25, ...springSmooth }}
          >
            <FundsTab
              funds={funds}
              onCreate={openCreateFund}
              onEdit={openEditFund}
              onToggle={handleToggleFundActive}
              onDelete={handleDeleteFund}
            />
          </motion.div>
        )}

        {activeTab === 'gifts' && (
          <motion.div
            key="gifts"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25, ...springSmooth }}
          >
            <GiftsTab
              gifts={gifts}
              onLog={openLogGift}
              onEdit={openEditGift}
              onUpdateThankYou={handleUpdateThankYou}
              onDelete={handleDeleteGift}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Dialogs ── */}

      {/* Add Registry Link */}
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
              <Label htmlFor="rl-url">Registry URL</Label>
              <Input
                id="rl-url"
                value={linkForm.url}
                onChange={(e) => setLinkForm({ ...linkForm, url: e.target.value })}
                placeholder="https://..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLinkForm(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAddLink}
              disabled={!linkForm.storeName.trim() || !linkForm.url.trim()}
            >
              Add Registry
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create/Edit Cash Fund */}
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

      {/* Log/Edit Gift */}
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
                disabled={!!editingGift}
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
            {!editingGift && (
              <div>
                <Label htmlFor="g-val">Estimated Value ($)</Label>
                <Input
                  id="g-val"
                  type="number"
                  value={giftForm.estimatedValue}
                  onChange={(e) => setGiftForm({ ...giftForm, estimatedValue: e.target.value })}
                />
              </div>
            )}
            <div>
              <Label htmlFor="g-notes">Notes</Label>
              <Textarea
                id="g-notes"
                value={giftForm.notes}
                onChange={(e) => setGiftForm({ ...giftForm, notes: e.target.value })}
                rows={2}
                placeholder="Personal notes about this gift"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setEditingGift(null)
                setShowGiftForm(false)
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveGift} disabled={!giftForm.description.trim()}>
              {editingGift ? 'Save Changes' : 'Log Gift'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}

// ── Links Tab ──

function LinksTab({
  links,
  onAddStore,
  onAddCustom,
  onDelete,
  onCopy,
  onView,
}: {
  links: RegistryLink[]
  onAddStore: (name: string) => void
  onAddCustom: () => void
  onDelete: (id: string) => void
  onCopy: (url: string) => void
  onView: (link: RegistryLink) => void
}) {
  return (
    <div className="space-y-8">
      {/* Popular Stores Grid */}
      <div>
        <h2 className="font-serif text-lg font-semibold text-gray-900">Popular Stores</h2>
        <p className="mt-1 text-sm text-gray-500">
          Quick-add a registry from a popular store, or add a custom one.
        </p>
        <motion.div
          className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5"
          variants={staggerGrid}
          initial="hidden"
          animate="visible"
        >
          {POPULAR_STORES.map((store) => {
            const Icon = store.icon
            return (
              <motion.button
                key={store.name}
                variants={fadeInUp}
                onClick={() => onAddStore(store.name)}
                className="group flex flex-col items-center gap-2.5 rounded-xl border border-gray-100 bg-white p-4 shadow-sm transition-all hover:border-gray-200 hover:shadow-md"
              >
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-full text-white transition-transform group-hover:scale-110"
                  style={{ backgroundColor: store.color }}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <span className="text-xs font-medium text-gray-700">{store.name}</span>
              </motion.button>
            )
          })}
          <motion.button
            variants={fadeInUp}
            onClick={onAddCustom}
            className="group flex flex-col items-center gap-2.5 rounded-xl border border-dashed border-gray-300 bg-white p-4 transition-all hover:border-gray-400 hover:shadow-md"
          >
            <div className="bg-wedding-50 text-wedding-600 flex h-12 w-12 items-center justify-center rounded-full transition-transform group-hover:scale-110">
              <Plus className="h-5 w-5" />
            </div>
            <span className="text-xs font-medium text-gray-500">Custom</span>
          </motion.button>
        </motion.div>
      </div>

      {/* Existing Registry Links */}
      {links.length === 0 ? (
        <motion.div variants={scaleIn} initial="hidden" animate="visible">
          <Card>
            <CardContent className="py-12 text-center">
              <div className="bg-wedding-50 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full">
                <Link2 className="text-wedding-600 h-8 w-8" />
              </div>
              <h2 className="font-serif text-xl font-semibold text-gray-900">
                No Registry Links Yet
              </h2>
              <p className="mx-auto mt-2 max-w-md text-sm text-gray-600">
                Click a store above to add your first registry link, or add a custom one.
              </p>
            </CardContent>
          </Card>
        </motion.div>
      ) : (
        <div>
          <h2 className="font-serif text-lg font-semibold text-gray-900">
            Your Registries ({links.length})
          </h2>
          <motion.div
            className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
            variants={staggerGrid}
            initial="hidden"
            animate="visible"
          >
            {links.map((link) => {
              const color = getStoreColor(link.storeName)
              return (
                <motion.div
                  key={link.id}
                  variants={fadeInUp}
                  whileHover={{ y: -4, boxShadow: '0 12px 24px rgba(0,0,0,0.1)' }}
                  className="cursor-default"
                >
                  <Card className="overflow-hidden">
                    <CardContent className="p-0">
                      <div className="flex items-start gap-4 p-4">
                        <div
                          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-lg font-bold text-white"
                          style={{ backgroundColor: color }}
                        >
                          {link.storeName.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="truncate font-semibold text-gray-900">{link.storeName}</h3>
                          <div className="mt-0.5 flex items-center gap-3">
                            <button
                              onClick={() => onView(link)}
                              className="text-wedding-600 hover:text-wedding-700 inline-flex items-center gap-1 text-sm font-medium"
                            >
                              <Eye className="h-3 w-3" />
                              View Inline
                            </button>
                            <a
                              href={link.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600"
                            >
                              New Tab
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          </div>
                          <p className="mt-1 text-xs text-gray-400">
                            {link.clickCount} click{link.clickCount !== 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center justify-end gap-1 border-t border-gray-50 bg-gray-50/50 px-4 py-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2 text-gray-500 hover:text-gray-700"
                          onClick={() => onCopy(link.url)}
                        >
                          <Copy className="mr-1 h-3.5 w-3.5" />
                          Copy
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2 text-gray-500 hover:text-gray-700"
                          onClick={() => {
                            void navigator.share?.({ url: link.url, title: link.storeName })
                          }}
                        >
                          <Share2 className="mr-1 h-3.5 w-3.5" />
                          Share
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2 text-red-400 hover:text-red-600"
                          onClick={() => onDelete(link.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </motion.div>
        </div>
      )}
    </div>
  )
}

// ── Funds Tab ──

function FundsTab({
  funds,
  onCreate,
  onEdit,
  onToggle,
  onDelete,
}: {
  funds: CashFund[]
  onCreate: () => void
  onEdit: (fund: CashFund) => void
  onToggle: (fund: CashFund) => void
  onDelete: (id: string) => void
}) {
  if (funds.length === 0) {
    return (
      <motion.div variants={scaleIn} initial="hidden" animate="visible">
        <Card>
          <CardContent className="py-12 text-center">
            <div className="bg-wedding-50 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full">
              <Banknote className="text-wedding-600 h-8 w-8" />
            </div>
            <h2 className="font-serif text-xl font-semibold text-gray-900">No Cash Funds</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-gray-600">
              Create funds for your honeymoon, house, or any goal.
            </p>
            <Button className="mt-6" onClick={onCreate}>
              <Plus className="mr-2 h-4 w-4" />
              Create First Fund
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  return (
    <motion.div
      className="grid gap-4 sm:grid-cols-2"
      variants={staggerGrid}
      initial="hidden"
      animate="visible"
    >
      {funds.map((fund) => {
        const pct =
          fund.goalAmount > 0 ? Math.min(100, (fund.currentAmount / fund.goalAmount) * 100) : 0
        const FundIcon = getFundIcon(fund.name)

        return (
          <motion.div key={fund.id} variants={fadeInUp}>
            <Card className="overflow-hidden">
              <CardContent className="p-0">
                <div className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="bg-wedding-50 text-wedding-600 flex h-11 w-11 items-center justify-center rounded-xl">
                        <FundIcon className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{fund.name}</h3>
                        {fund.description && (
                          <p className="mt-0.5 text-sm text-gray-500">{fund.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onEdit(fund)}
                        className="rounded-md p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                        title="Edit fund"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <Badge
                        variant={fund.isActive ? 'default' : 'secondary'}
                        className="cursor-pointer"
                        onClick={() => onToggle(fund)}
                      >
                        {fund.isActive ? 'Active' : 'Closed'}
                      </Badge>
                    </div>
                  </div>

                  {/* Progress */}
                  <div className="mt-5">
                    <div className="flex items-end justify-between text-sm">
                      <span className="font-semibold text-gray-900">
                        ${fund.currentAmount.toLocaleString()}{' '}
                        <span className="font-normal text-gray-400">raised</span>
                      </span>
                      <span className="text-gray-500">
                        of ${fund.goalAmount.toLocaleString()} goal
                      </span>
                    </div>
                    <div className="mt-2 h-3 w-full overflow-hidden rounded-full bg-gray-100">
                      <motion.div
                        className="bg-wedding-500 h-full rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={springSmooth}
                      />
                    </div>
                    <p className="mt-1.5 text-xs font-medium text-gray-500">
                      {Math.round(pct)}% of goal
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between border-t border-gray-50 bg-gray-50/50 px-5 py-2.5">
                  <button
                    onClick={() => onToggle(fund)}
                    className={`text-xs font-medium ${
                      fund.isActive
                        ? 'text-amber-600 hover:text-amber-700'
                        : 'text-green-600 hover:text-green-700'
                    }`}
                  >
                    {fund.isActive ? 'Close Fund' : 'Reopen Fund'}
                  </button>
                  <button
                    onClick={() => onDelete(fund.id)}
                    className="rounded-md p-1.5 text-red-400 transition-colors hover:bg-red-50 hover:text-red-600"
                    title="Delete fund"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )
      })}
    </motion.div>
  )
}

// ── Gifts Tab ──

function GiftsTab({
  gifts,
  onLog,
  onEdit,
  onUpdateThankYou,
  onDelete,
}: {
  gifts: Gift[]
  onLog: () => void
  onEdit: (gift: Gift) => void
  onUpdateThankYou: (gift: Gift, status: ThankYouStatus) => void
  onDelete: (id: string) => void
}) {
  if (gifts.length === 0) {
    return (
      <motion.div variants={scaleIn} initial="hidden" animate="visible">
        <Card>
          <CardContent className="py-12 text-center">
            <div className="bg-wedding-50 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full">
              <GiftIcon className="text-wedding-600 h-8 w-8" />
            </div>
            <h2 className="font-serif text-xl font-semibold text-gray-900">No Gifts Logged</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-gray-600">
              Track gifts you receive and manage thank-you notes.
            </p>
            <Button className="mt-6" onClick={onLog}>
              <Plus className="mr-2 h-4 w-4" />
              Log a Gift
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  return (
    <motion.div
      className="grid gap-4 sm:grid-cols-2"
      variants={staggerGrid}
      initial="hidden"
      animate="visible"
    >
      {gifts.map((gift) => {
        const level = getThankYouLevel(gift.thankYouStatus)

        return (
          <motion.div key={gift.id} variants={fadeInUp}>
            <Card className="overflow-hidden">
              <CardContent className="p-0">
                <div className="p-5">
                  <div className="flex items-start gap-3">
                    <div className="bg-wedding-50 text-wedding-600 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg">
                      <GiftIcon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-gray-900">{gift.description}</h3>
                      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-500">
                        {gift.guestName && <span>From {gift.guestName}</span>}
                        {gift.estimatedValue != null && (
                          <span className="font-medium text-gray-700">
                            ${gift.estimatedValue.toLocaleString()}
                          </span>
                        )}
                        {gift.receivedAt && (
                          <span className="text-xs text-gray-400">
                            {new Date(gift.receivedAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                      {gift.notes && (
                        <p className="mt-2 text-xs italic text-gray-400">{gift.notes}</p>
                      )}
                    </div>
                  </div>

                  {/* Thank-You Progress Dots */}
                  <div className="mt-4">
                    <p className="mb-2 text-xs font-medium text-gray-500">Thank-You Status</p>
                    <div className="flex items-center gap-2">
                      {THANK_YOU_STEPS.map((step, idx) => {
                        const stepNum = idx === 0 ? 0 : idx === 1 ? 2 : 3
                        const isActive = level >= stepNum
                        const isCurrent = gift.thankYouStatus === step.status

                        let dotColor = 'bg-gray-200'
                        if (isActive && step.status === 'sent') dotColor = 'bg-green-500'
                        else if (isActive && step.status === 'drafted') dotColor = 'bg-amber-400'
                        else if (isActive && step.status === 'not_started') dotColor = 'bg-gray-300'

                        return (
                          <button
                            key={step.status}
                            onClick={() => onUpdateThankYou(gift, step.status)}
                            className="group flex items-center gap-1.5"
                            title={step.label}
                          >
                            <div className="relative">
                              <div
                                className={`h-3.5 w-3.5 rounded-full transition-all ${dotColor} ${
                                  isCurrent ? 'ring-2 ring-offset-1' : ''
                                } ${
                                  isCurrent && step.status === 'sent'
                                    ? 'ring-green-300'
                                    : isCurrent && step.status === 'drafted'
                                      ? 'ring-amber-300'
                                      : isCurrent
                                        ? 'ring-gray-300'
                                        : ''
                                } group-hover:scale-125`}
                              >
                                {isActive && step.status === 'sent' && (
                                  <Check className="absolute inset-0 m-auto h-2 w-2 text-white" />
                                )}
                              </div>
                            </div>
                            <span
                              className={`text-xs ${
                                isCurrent ? 'font-medium text-gray-700' : 'text-gray-400'
                              }`}
                            >
                              {step.label}
                            </span>
                            {idx < THANK_YOU_STEPS.length - 1 && (
                              <div className="ml-1 h-px w-4 bg-gray-200" />
                            )}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-1 border-t border-gray-50 bg-gray-50/50 px-4 py-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2 text-gray-500 hover:text-gray-700"
                    onClick={() => onEdit(gift)}
                  >
                    <Pencil className="mr-1 h-3.5 w-3.5" />
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2 text-red-400 hover:text-red-600"
                    onClick={() => onDelete(gift.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )
      })}
    </motion.div>
  )
}
