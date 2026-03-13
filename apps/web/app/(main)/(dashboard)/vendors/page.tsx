'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@clerk/nextjs'
import { motion } from 'framer-motion'
import { springSmooth, staggerContainer, fadeInUp } from '@/lib/animations'
import { useWedding } from '@/hooks/use-wedding'
import { api } from '@/lib/api'
import type { Vendor, VendorCategory, VendorStatus, VendorCommunication } from '@planfortwo/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import { toast } from 'sonner'

const VENDOR_CATEGORIES: { value: VendorCategory; label: string }[] = [
  { value: 'venue', label: 'Venue' },
  { value: 'catering', label: 'Catering' },
  { value: 'photography', label: 'Photography' },
  { value: 'videography', label: 'Videography' },
  { value: 'dj', label: 'DJ' },
  { value: 'band', label: 'Band' },
  { value: 'florist', label: 'Florist' },
  { value: 'cake', label: 'Cake' },
  { value: 'officiant', label: 'Officiant' },
  { value: 'hair_makeup', label: 'Hair & Makeup' },
  { value: 'transportation', label: 'Transportation' },
  { value: 'stationery', label: 'Stationery' },
  { value: 'rentals', label: 'Rentals' },
  { value: 'lighting', label: 'Lighting' },
  { value: 'planner', label: 'Planner' },
  { value: 'other', label: 'Other' },
]

const STATUS_COLORS: Record<VendorStatus, string> = {
  researching: 'bg-gray-100 text-gray-700',
  contacted: 'bg-blue-100 text-blue-700',
  booked: 'bg-wedding-100 text-wedding-700',
  confirmed: 'bg-green-100 text-green-700',
  declined: 'bg-red-100 text-red-700',
}

export default function VendorsPage() {
  const { getToken } = useAuth()
  const { data: weddingData, loading: weddingLoading } = useWedding()
  const weddingId = weddingData?.wedding.id ?? null

  const [vendors, setVendors] = useState<Vendor[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null)
  const [filterCategory, setFilterCategory] = useState('')
  const [form, setForm] = useState({
    name: '',
    category: 'venue' as VendorCategory,
    status: 'researching' as VendorStatus,
    contactName: '',
    email: '',
    phone: '',
    website: '',
    cost: '',
    notes: '',
  })

  const [communications, setCommunications] = useState<VendorCommunication[]>([])
  const [showCommForm, setShowCommForm] = useState(false)
  const [commForm, setCommForm] = useState({
    type: 'email',
    subject: '',
    content: '',
    contactDate: new Date().toISOString().split('T')[0] ?? '',
  })

  const loadVendors = useCallback(async () => {
    if (!weddingId) return
    try {
      const token = await getToken()
      if (!token) return
      const { data } = await api.vendors.list(weddingId, token)
      setVendors(data)
    } catch {
      toast.error('Failed to load vendors')
    } finally {
      setLoading(false)
    }
  }, [weddingId, getToken])

  useEffect(() => {
    void loadVendors()
  }, [loadVendors])

  const resetForm = () => {
    setForm({
      name: '',
      category: 'venue',
      status: 'researching',
      contactName: '',
      email: '',
      phone: '',
      website: '',
      cost: '',
      notes: '',
    })
    setEditingVendor(null)
  }

  const handleSave = async () => {
    if (!weddingId || !form.name.trim()) return
    try {
      const token = await getToken()
      if (!token) return
      const payload = {
        weddingId,
        name: form.name.trim(),
        category: form.category,
        status: form.status,
        contactName: form.contactName || undefined,
        email: form.email || undefined,
        phone: form.phone || undefined,
        website: form.website || undefined,
        cost: form.cost ? parseFloat(form.cost) : undefined,
        notes: form.notes || undefined,
      }
      if (editingVendor) {
        await api.vendors.update(editingVendor.id, weddingId, payload, token)
        toast.success('Vendor updated')
      } else {
        await api.vendors.create(payload, token)
        toast.success('Vendor added')
      }
      resetForm()
      setShowForm(false)
      void loadVendors()
    } catch {
      toast.error('Failed to save vendor')
    }
  }

  const handleDelete = async (id: string) => {
    if (!weddingId) return
    try {
      const token = await getToken()
      if (!token) return
      await api.vendors.delete(id, weddingId, token)
      toast.success('Vendor deleted')
      void loadVendors()
    } catch {
      toast.error('Failed to delete vendor')
    }
  }

  const loadCommunications = useCallback(
    async (vendorId: string) => {
      if (!weddingId) return
      try {
        const token = await getToken()
        if (!token) return
        const { data } = await api.vendors.listCommunications(vendorId, weddingId, token)
        setCommunications(data)
      } catch {
        toast.error('Failed to load communications')
      }
    },
    [weddingId, getToken],
  )

  const handleAddCommunication = async () => {
    if (!weddingId || !editingVendor) return
    try {
      const token = await getToken()
      if (!token) return
      await api.vendors.addCommunication(
        editingVendor.id,
        weddingId,
        {
          vendorId: editingVendor.id,
          type: commForm.type,
          subject: commForm.subject || undefined,
          content: commForm.content || undefined,
          contactDate: commForm.contactDate,
        },
        token,
      )
      toast.success('Communication logged')
      setShowCommForm(false)
      setCommForm({
        type: 'email',
        subject: '',
        content: '',
        contactDate: new Date().toISOString().split('T')[0] ?? '',
      })
      void loadCommunications(editingVendor.id)
    } catch {
      toast.error('Failed to log communication')
    }
  }

  const openEdit = (vendor: Vendor) => {
    setEditingVendor(vendor)
    setForm({
      name: vendor.name,
      category: vendor.category,
      status: vendor.status,
      contactName: vendor.contactName ?? '',
      email: vendor.email ?? '',
      phone: vendor.phone ?? '',
      website: vendor.website ?? '',
      cost: vendor.cost?.toString() ?? '',
      notes: vendor.notes ?? '',
    })
    setCommunications([])
    void loadCommunications(vendor.id)
    setShowForm(true)
  }

  const filteredVendors = filterCategory
    ? vendors.filter((v) => v.category === filterCategory)
    : vendors

  const totalCost = vendors.reduce((sum, v) => sum + (v.cost ?? 0), 0)

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
          <h1 className="font-serif text-3xl font-bold text-gray-900">Vendors</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage your wedding vendors and track costs.
            {vendors.length > 0 && (
              <span className="text-wedding-600 ml-2 font-medium">
                Total: ${totalCost.toLocaleString()}
              </span>
            )}
          </p>
        </div>
        <Button
          onClick={() => {
            resetForm()
            setShowForm(true)
          }}
        >
          Add Vendor
        </Button>
      </div>

      {vendors.length > 0 && (
        <div className="mb-6 flex flex-wrap gap-2">
          <button
            onClick={() => setFilterCategory('')}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              !filterCategory
                ? 'bg-wedding-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All ({vendors.length})
          </button>
          {VENDOR_CATEGORIES.filter((c) => vendors.some((v) => v.category === c.value)).map(
            (cat) => (
              <button
                key={cat.value}
                onClick={() => setFilterCategory(cat.value)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  filterCategory === cat.value
                    ? 'bg-wedding-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {cat.label} ({vendors.filter((v) => v.category === cat.value).length})
              </button>
            ),
          )}
        </div>
      )}

      {filteredVendors.length === 0 ? (
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
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
            </div>
            <h2 className="font-serif text-xl font-semibold text-gray-900">No Vendors Yet</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-gray-600">
              Start adding your wedding vendors to keep track of contacts, costs, and booking
              status.
            </p>
            <Button
              className="mt-6"
              onClick={() => {
                resetForm()
                setShowForm(true)
              }}
            >
              Add Your First Vendor
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
          {filteredVendors.map((vendor) => (
            <motion.div key={vendor.id} variants={fadeInUp}>
              <Card
                className="cursor-pointer transition-shadow hover:shadow-md"
                onClick={() => openEdit(vendor)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-base">{vendor.name}</CardTitle>
                      <p className="mt-0.5 text-xs capitalize text-gray-500">
                        {VENDOR_CATEGORIES.find((c) => c.value === vendor.category)?.label ??
                          vendor.category}
                      </p>
                    </div>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[vendor.status]}`}
                    >
                      {vendor.status}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  {vendor.contactName && (
                    <p className="text-sm text-gray-600">{vendor.contactName}</p>
                  )}
                  {vendor.email && <p className="text-xs text-gray-500">{vendor.email}</p>}
                  {vendor.phone && <p className="text-xs text-gray-500">{vendor.phone}</p>}
                  {vendor.cost != null && vendor.cost > 0 && (
                    <p className="mt-2 text-sm font-semibold text-gray-900">
                      ${vendor.cost.toLocaleString()}
                    </p>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDelete(vendor.id)
                    }}
                    className="mt-3 text-xs text-red-500 hover:text-red-700"
                  >
                    Delete
                  </button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      )}

      <Dialog
        open={showForm}
        onOpenChange={(open) => {
          if (!open) {
            resetForm()
            setShowForm(false)
          } else setShowForm(true)
        }}
      >
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingVendor ? 'Edit Vendor' : 'Add Vendor'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="v-name">Vendor Name</Label>
              <Input
                id="v-name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g., Elegant Events"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="v-category">Category</Label>
                <select
                  id="v-category"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value as VendorCategory })}
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm"
                >
                  {VENDOR_CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="v-status">Status</Label>
                <select
                  id="v-status"
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value as VendorStatus })}
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm"
                >
                  <option value="researching">Researching</option>
                  <option value="contacted">Contacted</option>
                  <option value="booked">Booked</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="declined">Declined</option>
                </select>
              </div>
            </div>
            <div>
              <Label htmlFor="v-contact">Contact Name</Label>
              <Input
                id="v-contact"
                value={form.contactName}
                onChange={(e) => setForm({ ...form, contactName: e.target.value })}
                placeholder="Contact person"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="v-email">Email</Label>
                <Input
                  id="v-email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="email@example.com"
                />
              </div>
              <div>
                <Label htmlFor="v-phone">Phone</Label>
                <Input
                  id="v-phone"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="(555) 123-4567"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="v-website">Website</Label>
              <Input
                id="v-website"
                value={form.website}
                onChange={(e) => setForm({ ...form, website: e.target.value })}
                placeholder="https://..."
              />
            </div>
            <div>
              <Label htmlFor="v-cost">Cost ($)</Label>
              <Input
                id="v-cost"
                type="number"
                value={form.cost}
                onChange={(e) => setForm({ ...form, cost: e.target.value })}
                placeholder="0.00"
              />
            </div>
            <div>
              <Label htmlFor="v-notes">Notes</Label>
              <Textarea
                id="v-notes"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Additional notes..."
                rows={3}
              />
            </div>
            <Button onClick={handleSave} className="w-full">
              {editingVendor ? 'Save Changes' : 'Add Vendor'}
            </Button>

            {editingVendor && (
              <div className="border-t pt-4">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-gray-900">Communication Log</h3>
                  <Button variant="outline" size="sm" onClick={() => setShowCommForm(true)}>
                    Log Communication
                  </Button>
                </div>
                {communications.length === 0 ? (
                  <p className="py-4 text-center text-xs text-gray-400">
                    No communications logged yet.
                  </p>
                ) : (
                  <div className="max-h-48 space-y-2 overflow-y-auto">
                    {[...communications]
                      .sort(
                        (a, b) =>
                          new Date(b.contactDate).getTime() - new Date(a.contactDate).getTime(),
                      )
                      .map((comm) => (
                        <div
                          key={comm.id}
                          className="rounded-lg border border-gray-100 bg-gray-50 p-3"
                        >
                          <div className="flex items-center justify-between">
                            <span className="rounded-full border bg-white px-2 py-0.5 text-xs font-medium capitalize text-gray-700">
                              {comm.type}
                            </span>
                            <span className="text-xs text-gray-400">
                              {new Date(comm.contactDate).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })}
                            </span>
                          </div>
                          {comm.subject && (
                            <p className="mt-1 text-sm font-medium text-gray-800">{comm.subject}</p>
                          )}
                          {comm.content && (
                            <p className="mt-0.5 line-clamp-2 text-xs text-gray-500">
                              {comm.content}
                            </p>
                          )}
                        </div>
                      ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Log Communication Dialog */}
      <Dialog open={showCommForm} onOpenChange={setShowCommForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Log Communication</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="comm-type">Type</Label>
              <select
                id="comm-type"
                value={commForm.type}
                onChange={(e) => setCommForm({ ...commForm, type: e.target.value })}
                className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="email">Email</option>
                <option value="phone">Phone</option>
                <option value="meeting">Meeting</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <Label htmlFor="comm-subject">Subject</Label>
              <Input
                id="comm-subject"
                value={commForm.subject}
                onChange={(e) => setCommForm({ ...commForm, subject: e.target.value })}
                placeholder="e.g., Discussed floral arrangements"
              />
            </div>
            <div>
              <Label htmlFor="comm-content">Notes</Label>
              <Textarea
                id="comm-content"
                value={commForm.content}
                onChange={(e) => setCommForm({ ...commForm, content: e.target.value })}
                placeholder="Details about this communication..."
                rows={4}
              />
            </div>
            <div>
              <Label htmlFor="comm-contactDate">Date</Label>
              <Input
                id="comm-contactDate"
                type="date"
                value={commForm.contactDate}
                onChange={(e) => setCommForm({ ...commForm, contactDate: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCommForm(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddCommunication} disabled={!commForm.contactDate}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}
