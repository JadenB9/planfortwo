'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@clerk/nextjs'
import { motion } from 'framer-motion'
import { springSmooth, fadeInUp, staggerContainer } from '@/lib/animations'
import { api } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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

type Tab = 'outline' | 'vows' | 'processional'

const TABS: { key: Tab; label: string }[] = [
  { key: 'outline', label: 'Ceremony Outline' },
  { key: 'vows', label: 'Vow Workspace' },
  { key: 'processional', label: 'Processional Order' },
]

const MOMENT_LABELS: Record<string, string> = {
  prelude: 'Prelude',
  processional: 'Processional',
  welcome: 'Welcome',
  reading: 'Reading',
  vows: 'Vows',
  ring_exchange: 'Ring Exchange',
  unity_ceremony: 'Unity Ceremony',
  pronouncement: 'Pronouncement',
  recessional: 'Recessional',
  other: 'Other',
}

const MOMENT_OPTIONS = Object.entries(MOMENT_LABELS).map(([value, label]) => ({ value, label }))

interface OutlineItem {
  id: string
  weddingId: string
  moment: string
  title: string
  description: string | null
  duration: number | null
  sortOrder: number
  createdAt: Date
}

interface ProcessionalEntry {
  id: string
  weddingId: string
  name: string
  role: string | null
  sortOrder: number
}

export default function CeremonyPage() {
  const { getToken } = useAuth()
  const [weddingId, setWeddingId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<Tab>('outline')

  const [outlines, setOutlines] = useState<OutlineItem[]>([])
  const [vowContent, setVowContent] = useState('')
  const [vowSaving, setVowSaving] = useState(false)
  const [processional, setProcessional] = useState<ProcessionalEntry[]>([])

  const [showOutlineDialog, setShowOutlineDialog] = useState(false)
  const [editingOutline, setEditingOutline] = useState<OutlineItem | null>(null)
  const [outlineForm, setOutlineForm] = useState({ moment: 'welcome', title: '', description: '', duration: '' })

  const [showProcessionalDialog, setShowProcessionalDialog] = useState(false)
  const [processionalForm, setProcessionalForm] = useState({ name: '', role: '' })

  const loadData = useCallback(async () => {
    try {
      const token = await getToken()
      if (!token) return
      const { data: dashData } = await api.weddings.mine(token)
      const wId = dashData.wedding.id
      setWeddingId(wId)

      const [outlinesRes, vowRes, processRes] = await Promise.all([
        api.ceremony.listOutlines(wId, token),
        api.ceremony.getVow(wId, token),
        api.ceremony.listProcessional(wId, token),
      ])
      setOutlines(outlinesRes.data)
      if (vowRes.data) setVowContent(vowRes.data.content)
      setProcessional(processRes.data)
    } catch {
      /* silent */
    } finally {
      setLoading(false)
    }
  }, [getToken])

  useEffect(() => { void loadData() }, [loadData])

  const handleSaveOutline = useCallback(async () => {
    if (!weddingId) return
    try {
      const token = await getToken()
      if (!token) return
      if (editingOutline) {
        await api.ceremony.updateOutline(editingOutline.id, weddingId, {
          moment: outlineForm.moment as 'welcome',
          title: outlineForm.title,
          description: outlineForm.description || null,
          duration: outlineForm.duration ? parseInt(outlineForm.duration) : null,
        }, token)
      } else {
        await api.ceremony.createOutline({
          weddingId,
          moment: outlineForm.moment as 'welcome',
          title: outlineForm.title,
          description: outlineForm.description || null,
          duration: outlineForm.duration ? parseInt(outlineForm.duration) : null,
        }, token)
      }
      setShowOutlineDialog(false)
      setEditingOutline(null)
      setOutlineForm({ moment: 'welcome', title: '', description: '', duration: '' })
      void loadData()
    } catch { /* silent */ }
  }, [weddingId, getToken, editingOutline, outlineForm, loadData])

  const handleDeleteOutline = useCallback(async (id: string) => {
    if (!weddingId) return
    try {
      const token = await getToken()
      if (!token) return
      await api.ceremony.deleteOutline(id, weddingId, token)
      void loadData()
    } catch { /* silent */ }
  }, [weddingId, getToken, loadData])

  const handleSaveVow = useCallback(async () => {
    if (!weddingId) return
    setVowSaving(true)
    try {
      const token = await getToken()
      if (!token) return
      await api.ceremony.upsertVow(weddingId, { content: vowContent }, token)
    } catch { /* silent */ }
    finally { setVowSaving(false) }
  }, [weddingId, getToken, vowContent])

  const handleSaveProcessional = useCallback(async () => {
    if (!weddingId) return
    try {
      const token = await getToken()
      if (!token) return
      await api.ceremony.createProcessional({
        weddingId,
        name: processionalForm.name,
        role: processionalForm.role || null,
      }, token)
      setShowProcessionalDialog(false)
      setProcessionalForm({ name: '', role: '' })
      void loadData()
    } catch { /* silent */ }
  }, [weddingId, getToken, processionalForm, loadData])

  const handleDeleteProcessional = useCallback(async (id: string) => {
    if (!weddingId) return
    try {
      const token = await getToken()
      if (!token) return
      await api.ceremony.deleteProcessional(id, weddingId, token)
      void loadData()
    } catch { /* silent */ }
  }, [weddingId, getToken, loadData])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-wedding-200 border-t-wedding-600" />
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
      <div className="mb-8">
        <h1 className="font-serif text-3xl font-bold text-gray-900">Ceremony</h1>
        <p className="mt-1 text-sm text-gray-600">Plan your ceremony outline, write your vows, and organize the processional.</p>
      </div>

      <div className="border-b border-gray-200">
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

      <div className="mt-6">
        {activeTab === 'outline' && (
          <div>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-serif text-lg font-semibold text-gray-900">Ceremony Moments</h2>
              <Button onClick={() => {
                setEditingOutline(null)
                setOutlineForm({ moment: 'welcome', title: '', description: '', duration: '' })
                setShowOutlineDialog(true)
              }}>
                Add Moment
              </Button>
            </div>
            {outlines.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-sm text-gray-500">No ceremony moments yet. Add your first one to start building your outline.</p>
                </CardContent>
              </Card>
            ) : (
              <motion.div className="space-y-3" variants={staggerContainer} initial="hidden" animate="visible">
                {outlines.sort((a, b) => a.sortOrder - b.sortOrder).map((item) => (
                  <motion.div key={item.id} variants={fadeInUp}>
                    <Card>
                      <CardContent className="flex items-center justify-between py-4">
                        <div className="flex items-center gap-4">
                          <Badge variant="secondary">{MOMENT_LABELS[item.moment] ?? item.moment}</Badge>
                          <div>
                            <p className="font-medium text-gray-900">{item.title}</p>
                            {item.description && <p className="mt-0.5 text-sm text-gray-500">{item.description}</p>}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {item.duration && (
                            <span className="text-xs text-gray-400">{item.duration} min</span>
                          )}
                          <Button variant="ghost" size="sm" onClick={() => {
                            setEditingOutline(item)
                            setOutlineForm({
                              moment: item.moment,
                              title: item.title,
                              description: item.description ?? '',
                              duration: item.duration?.toString() ?? '',
                            })
                            setShowOutlineDialog(true)
                          }}>
                            Edit
                          </Button>
                          <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700" onClick={() => handleDeleteOutline(item.id)}>
                            Delete
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </div>
        )}

        {activeTab === 'vows' && (
          <Card>
            <CardHeader>
              <CardTitle>Your Vows</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-sm text-gray-500">Write and refine your wedding vows here. Only you can see this until you choose to reveal them.</p>
              <Textarea
                rows={12}
                value={vowContent}
                onChange={(e) => setVowContent(e.target.value)}
                placeholder="Write your vows here..."
                className="mb-4 font-serif"
              />
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">{vowContent.length} characters</span>
                <Button onClick={handleSaveVow} disabled={vowSaving}>
                  {vowSaving ? 'Saving...' : 'Save Vows'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === 'processional' && (
          <div>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-serif text-lg font-semibold text-gray-900">Processional Order</h2>
              <Button onClick={() => {
                setProcessionalForm({ name: '', role: '' })
                setShowProcessionalDialog(true)
              }}>
                Add Entry
              </Button>
            </div>
            {processional.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-sm text-gray-500">No processional entries yet. Add who walks down the aisle and in what order.</p>
                </CardContent>
              </Card>
            ) : (
              <motion.div className="space-y-2" variants={staggerContainer} initial="hidden" animate="visible">
                {processional.sort((a, b) => a.sortOrder - b.sortOrder).map((entry, idx) => (
                  <motion.div key={entry.id} variants={fadeInUp}>
                    <Card>
                      <CardContent className="flex items-center justify-between py-3">
                        <div className="flex items-center gap-3">
                          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-wedding-100 text-xs font-semibold text-wedding-700">{idx + 1}</span>
                          <div>
                            <p className="font-medium text-gray-900">{entry.name}</p>
                            {entry.role && <p className="text-xs text-gray-500">{entry.role}</p>}
                          </div>
                        </div>
                        <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700" onClick={() => handleDeleteProcessional(entry.id)}>
                          Remove
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </div>
        )}
      </div>

      <Dialog open={showOutlineDialog} onOpenChange={setShowOutlineDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingOutline ? 'Edit Moment' : 'Add Ceremony Moment'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Moment Type</Label>
              <select
                value={outlineForm.moment}
                onChange={(e) => setOutlineForm({ ...outlineForm, moment: e.target.value })}
                className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm"
              >
                {MOMENT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div>
              <Label>Title</Label>
              <Input value={outlineForm.title} onChange={(e) => setOutlineForm({ ...outlineForm, title: e.target.value })} placeholder="e.g. Bride's Entrance" />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea value={outlineForm.description} onChange={(e) => setOutlineForm({ ...outlineForm, description: e.target.value })} placeholder="Optional notes..." rows={3} />
            </div>
            <div>
              <Label>Duration (minutes)</Label>
              <Input type="number" value={outlineForm.duration} onChange={(e) => setOutlineForm({ ...outlineForm, duration: e.target.value })} placeholder="5" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowOutlineDialog(false)}>Cancel</Button>
            <Button onClick={handleSaveOutline} disabled={!outlineForm.title}>{editingOutline ? 'Update' : 'Add'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showProcessionalDialog} onOpenChange={setShowProcessionalDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Processional Entry</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Name</Label>
              <Input value={processionalForm.name} onChange={(e) => setProcessionalForm({ ...processionalForm, name: e.target.value })} placeholder="e.g. Flower Girl" />
            </div>
            <div>
              <Label>Role</Label>
              <Input value={processionalForm.role} onChange={(e) => setProcessionalForm({ ...processionalForm, role: e.target.value })} placeholder="e.g. Maid of Honor" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowProcessionalDialog(false)}>Cancel</Button>
            <Button onClick={handleSaveProcessional} disabled={!processionalForm.name}>Add</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}
