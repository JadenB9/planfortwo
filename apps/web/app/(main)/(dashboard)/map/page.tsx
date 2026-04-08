'use client'

import { useState, useEffect, useCallback } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useAuth } from '@clerk/nextjs'
import { motion } from 'framer-motion'
import { MapPin } from 'lucide-react'
import { springSmooth } from '@/lib/animations'
import { useWedding } from '@/hooks/use-wedding'
import { api } from '@/lib/api'
import type { WeddingEvent } from '@planfortwo/types'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

const EventMapEditor = dynamic(
  () => import('@/components/events/event-map-editor').then((m) => m.EventMapEditor),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center py-12">
        <div className="border-wedding-200 border-t-wedding-600 h-6 w-6 animate-spin rounded-full border-2" />
      </div>
    ),
  },
)

export default function MapPage() {
  const { getToken } = useAuth()
  const { data: weddingData, loading: weddingLoading } = useWedding()
  const weddingId = weddingData?.wedding.id ?? null

  const [events, setEvents] = useState<WeddingEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null)

  const loadEvents = useCallback(async () => {
    if (!weddingId) return
    try {
      const token = await getToken()
      if (!token) return
      const { data } = await api.events.list(weddingId, token)
      setEvents(data)
      // Default to the first event with a saved map, otherwise the first event
      const withMap = data.find((e) => e.mapImageUrl)
      setSelectedEventId((prev) => prev ?? withMap?.id ?? data[0]?.id ?? null)
    } catch {
      toast.error('Failed to load events')
    } finally {
      setLoading(false)
    }
  }, [weddingId, getToken])

  useEffect(() => {
    void loadEvents()
  }, [loadEvents])

  const selectedEvent = events.find((e) => e.id === selectedEventId) ?? null
  const isLoading = weddingLoading || loading

  return (
    <motion.div
      className="mx-auto max-w-6xl"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ...springSmooth }}
    >
      <div className="mb-8">
        <h1 className="text-foreground font-serif text-3xl font-bold">Map</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Build a map for each event. Search the venue, frame the view, drop labeled boxes for
          things like the ceremony or parking, and sketch colored routes. Every saved map shows up
          on your wedding website&apos;s Map section.
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="border-wedding-200 border-t-wedding-600 h-8 w-8 animate-spin rounded-full border-4" />
        </div>
      ) : events.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="bg-wedding-50 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full">
              <MapPin className="text-wedding-600 h-8 w-8" />
            </div>
            <h2 className="text-foreground font-serif text-xl font-semibold">No events yet</h2>
            <p className="text-muted-foreground mx-auto mt-2 max-w-md text-sm">
              Each event gets its own map so guests know exactly where to go. Add a ceremony,
              reception, or anything else on the Events page, then come back here to build the maps.
            </p>
            <Button asChild className="mt-6">
              <Link href="/events">Go to Events</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {events.length > 1 && (
            <div className="border-border bg-muted/30 flex flex-wrap items-center gap-3 rounded-lg border p-3">
              <span className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
                Editing map for
              </span>
              <div className="flex flex-wrap gap-2">
                {events.map((e) => {
                  const active = e.id === selectedEventId
                  const hasMap = !!e.mapImageUrl
                  return (
                    <button
                      key={e.id}
                      type="button"
                      onClick={() => setSelectedEventId(e.id)}
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition ${
                        active
                          ? 'bg-wedding-600 text-white shadow-sm'
                          : 'bg-background text-foreground hover:bg-muted'
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          hasMap
                            ? active
                              ? 'bg-white'
                              : 'bg-wedding-500'
                            : active
                              ? 'bg-white/50'
                              : 'bg-muted-foreground/40'
                        }`}
                        aria-label={hasMap ? 'Has saved map' : 'No map yet'}
                      />
                      {e.name}
                    </button>
                  )
                })}
              </div>
              <span className="text-muted-foreground ml-auto text-[11px]">
                {events.filter((e) => e.mapImageUrl).length} / {events.length} events have a saved
                map
              </span>
            </div>
          )}

          {selectedEvent && weddingId && (
            <EventMapEditor
              key={selectedEvent.id}
              event={selectedEvent}
              weddingId={weddingId}
              getToken={getToken}
              onSaved={(updated) => {
                setEvents((prev) => prev.map((e) => (e.id === updated.id ? updated : e)))
              }}
            />
          )}
        </div>
      )}
    </motion.div>
  )
}
