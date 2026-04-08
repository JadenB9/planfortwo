'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { useAuth } from '@clerk/nextjs'
import { ExternalLink, MapPin } from 'lucide-react'
import type { MapSectionContent, WeddingEvent } from '@planfortwo/types'
import { api } from '@/lib/api'

interface MapSectionEditorProps {
  content: MapSectionContent
  onChange: (content: MapSectionContent) => void
  weddingId: string
}

export function MapSectionEditor({ content, onChange, weddingId }: MapSectionEditorProps) {
  const { getToken } = useAuth()
  const [events, setEvents] = useState<WeddingEvent[]>([])
  const [loading, setLoading] = useState(true)

  const message = content.message ?? ''
  const showAddresses = content.showAddresses ?? true
  const selectedEventIds = content.selectedEventIds ?? null
  // Explicit mode: "all" shows every event with a saved map, "selected"
  // limits the list to whatever is in `selectedEventIds`. We store "all"
  // as `selectedEventIds === null` and "selected" as an array (possibly
  // empty while the user is still picking).
  const mode: 'all' | 'selected' = selectedEventIds === null ? 'all' : 'selected'

  const loadEvents = useCallback(async () => {
    if (!weddingId) return
    try {
      const token = await getToken()
      if (!token) return
      const { data } = await api.events.list(weddingId, token)
      setEvents(data)
    } catch {
      // Non-fatal — editor still works without events
    } finally {
      setLoading(false)
    }
  }, [weddingId, getToken])

  useEffect(() => {
    void loadEvents()
  }, [loadEvents])

  const eventsWithMaps = events.filter((e) => e.mapImageUrl)

  const setMode = (next: 'all' | 'selected') => {
    onChange({ ...content, selectedEventIds: next === 'all' ? null : (selectedEventIds ?? []) })
  }

  const toggleEvent = (id: string) => {
    const current = selectedEventIds ?? []
    const next = current.includes(id) ? current.filter((x) => x !== id) : [...current, id]
    onChange({ ...content, selectedEventIds: next })
  }

  return (
    <div className="space-y-5">
      <div>
        <label className="text-foreground text-sm font-medium">Intro message</label>
        <textarea
          value={message}
          onChange={(e) => onChange({ ...content, message: e.target.value })}
          rows={3}
          placeholder="Help guests find the venue and parking."
          className="border-border mt-1 block w-full rounded-md border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="flex items-center gap-2 text-sm font-medium">
          <input
            type="checkbox"
            checked={showAddresses}
            onChange={(e) => onChange({ ...content, showAddresses: e.target.checked })}
            className="h-4 w-4"
          />
          Show full addresses below each map
        </label>
      </div>

      <div>
        <div className="flex items-center justify-between">
          <h4 className="text-foreground text-sm font-medium">Maps to display</h4>
          <Link
            href="/events"
            className="text-wedding-600 hover:text-wedding-700 inline-flex items-center gap-1 text-xs font-medium"
          >
            Manage in Events <ExternalLink className="h-3 w-3" />
          </Link>
        </div>

        {loading ? (
          <p className="text-muted-foreground mt-3 text-sm">Loading events…</p>
        ) : eventsWithMaps.length === 0 ? (
          <div className="border-border bg-muted/40 mt-3 rounded-lg border border-dashed p-6 text-center">
            <MapPin className="text-muted-foreground mx-auto mb-2 h-6 w-6" />
            <p className="text-foreground text-sm font-medium">No event maps yet</p>
            <p className="text-muted-foreground mt-1 text-xs">
              Open an event in the{' '}
              <Link href="/events" className="text-wedding-600 hover:text-wedding-700 underline">
                Events page
              </Link>{' '}
              and use the Map tab to design and save a map. It will appear here automatically.
            </p>
          </div>
        ) : (
          <div className="mt-3 space-y-3">
            {/* Explicit mode toggle so it's obvious whether the site shows
                every event map or only a curated subset. */}
            <div className="border-border bg-background flex flex-col gap-2 rounded-md border p-3 text-sm">
              <label className="flex cursor-pointer items-start gap-3">
                <input
                  type="radio"
                  name="map-mode"
                  checked={mode === 'all'}
                  onChange={() => setMode('all')}
                  className="mt-0.5 h-4 w-4"
                />
                <div>
                  <div className="text-foreground font-medium">
                    Show all event maps ({eventsWithMaps.length})
                  </div>
                  <div className="text-muted-foreground text-xs">
                    Every event with a saved map appears on the site, in the order you arranged them
                    on the Events page.
                  </div>
                </div>
              </label>
              <label className="flex cursor-pointer items-start gap-3">
                <input
                  type="radio"
                  name="map-mode"
                  checked={mode === 'selected'}
                  onChange={() => setMode('selected')}
                  className="mt-0.5 h-4 w-4"
                />
                <div>
                  <div className="text-foreground font-medium">Only show the events I pick</div>
                  <div className="text-muted-foreground text-xs">
                    Useful if you want guests to see just the ceremony and reception.
                  </div>
                </div>
              </label>
            </div>

            {mode === 'selected' && (
              <div className="space-y-2">
                {eventsWithMaps.map((e) => {
                  const checked = selectedEventIds?.includes(e.id) ?? false
                  return (
                    <label
                      key={e.id}
                      className="border-border bg-background hover:bg-muted/40 flex cursor-pointer items-center gap-3 rounded-md border px-3 py-2 text-sm transition"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleEvent(e.id)}
                        className="h-4 w-4"
                      />
                      <div className="flex-1">
                        <div className="text-foreground font-medium">{e.name}</div>
                        {e.address && (
                          <div className="text-muted-foreground text-xs">{e.address}</div>
                        )}
                      </div>
                      {e.mapImageUrl && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={e.mapImageUrl}
                          alt=""
                          className="h-10 w-14 rounded object-cover"
                        />
                      )}
                    </label>
                  )
                })}
                {selectedEventIds && selectedEventIds.length === 0 && (
                  <p className="text-xs text-amber-600">
                    Pick at least one event or your Map section will show an empty state.
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
