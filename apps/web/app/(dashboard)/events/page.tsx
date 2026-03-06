'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@clerk/nextjs'
import { motion } from 'framer-motion'
import { springSmooth, staggerContainer, fadeInUp } from '@/lib/animations'
import { useWedding } from '@/hooks/use-wedding'
import { api } from '@/lib/api'
import type { WeddingEvent, TimelineEntry, EventType } from '@planfortwo/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { toast } from 'sonner'

const EVENT_TYPES: { value: EventType; label: string }[] = [
  { value: 'ceremony', label: 'Ceremony' },
  { value: 'reception', label: 'Reception' },
  { value: 'rehearsal_dinner', label: 'Rehearsal Dinner' },
  { value: 'bridal_shower', label: 'Bridal Shower' },
  { value: 'bachelor_party', label: 'Bachelor Party' },
  { value: 'bachelorette_party', label: 'Bachelorette Party' },
  { value: 'engagement_party', label: 'Engagement Party' },
  { value: 'brunch', label: 'Brunch' },
  { value: 'other', label: 'Other' },
]

export default function EventsPage() {
  const { getToken } = useAuth()
  const { data: weddingData, loading: weddingLoading } = useWedding()
  const weddingId = weddingData?.wedding.id ?? null

  const [events, setEvents] = useState<WeddingEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingEvent, setEditingEvent] = useState<WeddingEvent | null>(null)
  const [selectedEvent, setSelectedEvent] = useState<WeddingEvent | null>(null)
  const [timeline, setTimeline] = useState<TimelineEntry[]>([])
  const [showTimelineForm, setShowTimelineForm] = useState(false)
  const [editingTimeline, setEditingTimeline] = useState<TimelineEntry | null>(null)
  const [form, setForm] = useState({
    name: '',
    type: 'ceremony' as EventType,
    date: '',
    startTime: '',
    endTime: '',
    venue: '',
    address: '',
    description: '',
    dressCode: '',
  })
  const [tlForm, setTlForm] = useState({ time: '', title: '', description: '', duration: '' })

  const loadEvents = useCallback(async () => {
    if (!weddingId) return
    try {
      const token = await getToken()
      if (!token) return
      const { data } = await api.events.list(weddingId, token)
      setEvents(data)
    } catch {
      toast.error('Failed to load events')
    } finally {
      setLoading(false)
    }
  }, [weddingId, getToken])

  useEffect(() => {
    void loadEvents()
  }, [loadEvents])

  const loadTimeline = useCallback(
    async (eventId: string) => {
      try {
        const token = await getToken()
        if (!token) return
        const { data } = await api.events.listTimeline(eventId, weddingId!, token)
        setTimeline(data)
      } catch {
        toast.error('Failed to load timeline')
      }
    },
    [getToken, weddingId],
  )

  const resetForm = () => {
    setForm({
      name: '',
      type: 'ceremony',
      date: '',
      startTime: '',
      endTime: '',
      venue: '',
      address: '',
      description: '',
      dressCode: '',
    })
    setEditingEvent(null)
  }

  const handleSave = async () => {
    if (!weddingId || !form.name.trim()) return
    try {
      const token = await getToken()
      if (!token) return
      const payload = {
        weddingId,
        name: form.name.trim(),
        type: form.type,
        date: form.date || undefined,
        startTime: form.startTime || undefined,
        endTime: form.endTime || undefined,
        venue: form.venue || undefined,
        address: form.address || undefined,
        description: form.description || undefined,
        dressCode: form.dressCode || undefined,
      }
      if (editingEvent) {
        await api.events.update(editingEvent.id, weddingId, payload, token)
        toast.success('Event updated')
      } else {
        await api.events.create(payload, token)
        toast.success('Event created')
      }
      resetForm()
      setShowForm(false)
      void loadEvents()
    } catch {
      toast.error('Failed to save event')
    }
  }

  const handleDelete = async (id: string) => {
    if (!weddingId) return
    try {
      const token = await getToken()
      if (!token) return
      await api.events.delete(id, weddingId, token)
      toast.success('Event deleted')
      if (selectedEvent?.id === id) {
        setSelectedEvent(null)
        setTimeline([])
      }
      void loadEvents()
    } catch {
      toast.error('Failed to delete event')
    }
  }

  const handleAddTimeline = async () => {
    if (!selectedEvent || !tlForm.time.trim() || !tlForm.title.trim()) return
    try {
      const token = await getToken()
      if (!token) return
      if (editingTimeline) {
        await api.events.updateTimelineEntry(
          editingTimeline.id,
          weddingId!,
          {
            time: tlForm.time,
            title: tlForm.title.trim(),
            description: tlForm.description || undefined,
            duration: tlForm.duration ? parseInt(tlForm.duration) : undefined,
          },
          token,
        )
      } else {
        await api.events.createTimelineEntry(
          selectedEvent.id,
          {
            eventId: selectedEvent.id,
            time: tlForm.time,
            title: tlForm.title.trim(),
            description: tlForm.description || undefined,
            duration: tlForm.duration ? parseInt(tlForm.duration) : undefined,
          },
          token,
        )
      }
      toast.success(editingTimeline ? 'Timeline entry updated' : 'Timeline entry added')
      setTlForm({ time: '', title: '', description: '', duration: '' })
      setEditingTimeline(null)
      setShowTimelineForm(false)
      void loadTimeline(selectedEvent.id)
    } catch {
      toast.error('Failed to save timeline entry')
    }
  }

  const handleDeleteTimeline = async (entryId: string) => {
    if (!selectedEvent) return
    try {
      const token = await getToken()
      if (!token) return
      await api.events.deleteTimelineEntry(entryId, weddingId!, token)
      toast.success('Timeline entry removed')
      void loadTimeline(selectedEvent.id)
    } catch {
      toast.error('Failed to delete timeline entry')
    }
  }

  const openEdit = (event: WeddingEvent) => {
    setEditingEvent(event)
    setForm({
      name: event.name,
      type: event.type,
      date: event.date ? (new Date(event.date).toISOString().split('T')[0] ?? '') : '',
      startTime: event.startTime ?? '',
      endTime: event.endTime ?? '',
      venue: event.venue ?? '',
      address: event.address ?? '',
      description: event.description ?? '',
      dressCode: event.dressCode ?? '',
    })
    setShowForm(true)
  }

  const selectEvent = (event: WeddingEvent) => {
    setSelectedEvent(event)
    void loadTimeline(event.id)
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
          <h1 className="font-serif text-3xl font-bold text-gray-900">Events</h1>
          <p className="mt-1 text-sm text-gray-600">Plan and organize all your wedding events.</p>
        </div>
        <Button
          onClick={() => {
            resetForm()
            setShowForm(true)
          }}
        >
          Add Event
        </Button>
      </div>

      {selectedEvent ? (
        <div>
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setSelectedEvent(null)
                  setTimeline([])
                }}
                className="text-wedding-600 hover:text-wedding-700 text-sm"
              >
                &larr; Back
              </button>
              <h2 className="font-serif text-xl font-semibold text-gray-900">
                {selectedEvent.name}
              </h2>
              <Badge variant="secondary">
                {EVENT_TYPES.find((t) => t.value === selectedEvent.type)?.label ??
                  selectedEvent.type}
              </Badge>
            </div>
            <Button
              onClick={() => {
                setEditingTimeline(null)
                setTlForm({ time: '', title: '', description: '', duration: '' })
                setShowTimelineForm(true)
              }}
              variant="outline"
            >
              Add Timeline Entry
            </Button>
          </div>

          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="grid gap-4 sm:grid-cols-2">
                {selectedEvent.date && (
                  <div>
                    <span className="text-xs font-medium text-gray-500">Date</span>
                    <p className="text-sm">{new Date(selectedEvent.date).toLocaleDateString()}</p>
                  </div>
                )}
                {selectedEvent.startTime && (
                  <div>
                    <span className="text-xs font-medium text-gray-500">Time</span>
                    <p className="text-sm">
                      {selectedEvent.startTime}
                      {selectedEvent.endTime ? ` - ${selectedEvent.endTime}` : ''}
                    </p>
                  </div>
                )}
                {selectedEvent.venue && (
                  <div>
                    <span className="text-xs font-medium text-gray-500">Venue</span>
                    <p className="text-sm">{selectedEvent.venue}</p>
                  </div>
                )}
                {selectedEvent.address && (
                  <div>
                    <span className="text-xs font-medium text-gray-500">Address</span>
                    <p className="text-sm">{selectedEvent.address}</p>
                  </div>
                )}
                {selectedEvent.dressCode && (
                  <div>
                    <span className="text-xs font-medium text-gray-500">Dress Code</span>
                    <p className="text-sm">{selectedEvent.dressCode}</p>
                  </div>
                )}
              </div>
              {selectedEvent.description && (
                <p className="mt-4 text-sm text-gray-600">{selectedEvent.description}</p>
              )}
            </CardContent>
          </Card>

          <h3 className="mb-3 font-serif text-lg font-semibold text-gray-900">Timeline</h3>
          {timeline.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-sm text-gray-500">
                  No timeline entries yet. Add entries to plan the event flow.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {timeline
                .sort((a, b) => a.time.localeCompare(b.time))
                .map((entry) => (
                  <Card key={entry.id}>
                    <CardContent className="flex items-center justify-between py-3">
                      <div className="flex items-center gap-4">
                        <span className="text-wedding-600 font-mono text-sm font-medium">
                          {entry.time}
                        </span>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{entry.title}</p>
                          {entry.description && (
                            <p className="text-xs text-gray-500">{entry.description}</p>
                          )}
                        </div>
                        {entry.duration && <Badge variant="secondary">{entry.duration} min</Badge>}
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setEditingTimeline(entry)
                            setTlForm({
                              time: entry.time,
                              title: entry.title,
                              description: entry.description ?? '',
                              duration: entry.duration?.toString() ?? '',
                            })
                            setShowTimelineForm(true)
                          }}
                          className="text-wedding-600 hover:text-wedding-700 text-xs"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteTimeline(entry.id)}
                          className="text-xs text-red-500 hover:text-red-700"
                        >
                          Remove
                        </button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          )}
        </div>
      ) : events.length === 0 ? (
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
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
            <h2 className="font-serif text-xl font-semibold text-gray-900">No Events Yet</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-gray-600">
              Add your ceremony, reception, rehearsal dinner, and other events.
            </p>
            <Button
              className="mt-6"
              onClick={() => {
                resetForm()
                setShowForm(true)
              }}
            >
              Add Your First Event
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
          {events.map((event) => (
            <motion.div key={event.id} variants={fadeInUp}>
              <Card
                className="cursor-pointer transition-shadow hover:shadow-md"
                onClick={() => selectEvent(event)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-base">{event.name}</CardTitle>
                    <Badge variant="secondary">
                      {EVENT_TYPES.find((t) => t.value === event.type)?.label ?? event.type}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {event.date && (
                    <p className="text-sm text-gray-600">
                      {new Date(event.date).toLocaleDateString()}
                    </p>
                  )}
                  {event.startTime && (
                    <p className="text-xs text-gray-500">
                      {event.startTime}
                      {event.endTime ? ` - ${event.endTime}` : ''}
                    </p>
                  )}
                  {event.venue && <p className="mt-1 text-sm text-gray-600">{event.venue}</p>}
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        openEdit(event)
                      }}
                      className="text-wedding-600 hover:text-wedding-700 text-xs"
                    >
                      Edit
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDelete(event.id)
                      }}
                      className="text-xs text-red-500 hover:text-red-700"
                    >
                      Delete
                    </button>
                  </div>
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
            <DialogTitle>{editingEvent ? 'Edit Event' : 'Add Event'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="e-name">Event Name</Label>
              <Input
                id="e-name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g., Wedding Ceremony"
              />
            </div>
            <div>
              <Label htmlFor="e-type">Type</Label>
              <select
                id="e-type"
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value as EventType })}
                className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm"
              >
                {EVENT_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label htmlFor="e-date">Date</Label>
                <Input
                  id="e-date"
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="e-start">Start</Label>
                <Input
                  id="e-start"
                  type="time"
                  value={form.startTime}
                  onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="e-end">End</Label>
                <Input
                  id="e-end"
                  type="time"
                  value={form.endTime}
                  onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="e-venue">Venue</Label>
              <Input
                id="e-venue"
                value={form.venue}
                onChange={(e) => setForm({ ...form, venue: e.target.value })}
                placeholder="Venue name"
              />
            </div>
            <div>
              <Label htmlFor="e-address">Address</Label>
              <Input
                id="e-address"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                placeholder="Full address"
              />
            </div>
            <div>
              <Label htmlFor="e-dress">Dress Code</Label>
              <Input
                id="e-dress"
                value={form.dressCode}
                onChange={(e) => setForm({ ...form, dressCode: e.target.value })}
                placeholder="e.g., Black tie"
              />
            </div>
            <div>
              <Label htmlFor="e-desc">Description</Label>
              <Textarea
                id="e-desc"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={3}
              />
            </div>
            <Button onClick={handleSave} className="w-full">
              {editingEvent ? 'Save Changes' : 'Add Event'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={showTimelineForm}
        onOpenChange={(open) => {
          if (!open) {
            setEditingTimeline(null)
            setTlForm({ time: '', title: '', description: '', duration: '' })
          }
          setShowTimelineForm(open)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingTimeline ? 'Edit Timeline Entry' : 'Add Timeline Entry'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="tl-time">Time</Label>
              <Input
                id="tl-time"
                type="time"
                value={tlForm.time}
                onChange={(e) => setTlForm({ ...tlForm, time: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="tl-title">Title</Label>
              <Input
                id="tl-title"
                value={tlForm.title}
                onChange={(e) => setTlForm({ ...tlForm, title: e.target.value })}
                placeholder="e.g., First Dance"
              />
            </div>
            <div>
              <Label htmlFor="tl-desc">Description</Label>
              <Input
                id="tl-desc"
                value={tlForm.description}
                onChange={(e) => setTlForm({ ...tlForm, description: e.target.value })}
                placeholder="Optional details"
              />
            </div>
            <div>
              <Label htmlFor="tl-dur">Duration (minutes)</Label>
              <Input
                id="tl-dur"
                type="number"
                value={tlForm.duration}
                onChange={(e) => setTlForm({ ...tlForm, duration: e.target.value })}
              />
            </div>
            <Button onClick={handleAddTimeline} className="w-full">
              {editingTimeline ? 'Save Changes' : 'Add Entry'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}
