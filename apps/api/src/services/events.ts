import { eq, and, asc } from 'drizzle-orm'
import { db, events, timelineEntries } from '@planfortwo/db'
import type {
  CreateEventInput,
  UpdateEventInput,
  CreateTimelineEntryInput,
  UpdateTimelineEntryInput,
  SetEventMapInput,
} from '@planfortwo/validators'
import type { GeocodeResult } from '@planfortwo/types'
import { storageClient } from '@planfortwo/storage'
import { activityService } from './activity.js'

// ─── Geocode proxy ───────────────────────────────────────────────────────
// The browser cannot hit Nominatim/Photon directly because the Next.js
// middleware sets a CSP with `connect-src 'self' <apiOrigin>` that blocks
// third-party fetches. The API proxies the search server-side so we can
// (a) attach a proper User-Agent header that Nominatim requires, and
// (b) fall back to Photon if Nominatim returns empty. Both services are
// free and CORS-agnostic from server-side Node.

const GEOCODE_UA = 'PlanForTwo/1.0 (https://planfortwo.com; contact: jadenbutler@cedarville.edu)'
const GEOCODE_TIMEOUT_MS = 6000

interface NominatimHit {
  display_name: string
  lat: string
  lon: string
}

interface PhotonFeature {
  geometry: { coordinates: [number, number] }
  properties: {
    name?: string
    housenumber?: string
    street?: string
    city?: string
    state?: string
    country?: string
    postcode?: string
  }
}

function formatPhotonLabel(f: PhotonFeature): string {
  const p = f.properties
  const streetLine = [p.housenumber, p.street].filter(Boolean).join(' ')
  const line1 = streetLine || p.name || ''
  const line2 = [p.city, p.state, p.postcode].filter(Boolean).join(', ')
  const parts = [line1, line2, p.country].filter(Boolean)
  return parts.length > 0 ? parts.join(' · ') : p.name || 'Unknown location'
}

async function fetchNominatim(query: string): Promise<GeocodeResult[]> {
  const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=5&addressdetails=1&q=${encodeURIComponent(query)}`
  const res = await fetch(url, {
    headers: { 'User-Agent': GEOCODE_UA, Accept: 'application/json' },
    signal: AbortSignal.timeout(GEOCODE_TIMEOUT_MS),
  })
  if (!res.ok) throw new Error(`Nominatim HTTP ${res.status}`)
  const data = (await res.json()) as NominatimHit[]
  return data.map((r) => ({
    label: r.display_name,
    lat: parseFloat(r.lat),
    lng: parseFloat(r.lon),
    source: 'nominatim' as const,
  }))
}

async function fetchPhoton(query: string): Promise<GeocodeResult[]> {
  const url = `https://photon.komoot.io/api/?limit=6&q=${encodeURIComponent(query)}`
  const res = await fetch(url, {
    headers: { 'User-Agent': GEOCODE_UA, Accept: 'application/json' },
    signal: AbortSignal.timeout(GEOCODE_TIMEOUT_MS),
  })
  if (!res.ok) throw new Error(`Photon HTTP ${res.status}`)
  const data = (await res.json()) as { features: PhotonFeature[] }
  return data.features.map((f) => ({
    label: formatPhotonLabel(f),
    lat: f.geometry.coordinates[1],
    lng: f.geometry.coordinates[0],
    source: 'photon' as const,
  }))
}

export const eventService = {
  async list(weddingId: string) {
    return db
      .select()
      .from(events)
      .where(eq(events.weddingId, weddingId))
      .orderBy(asc(events.sortOrder))
  },

  async getById(eventId: string, weddingId: string) {
    const [event] = await db
      .select()
      .from(events)
      .where(and(eq(events.id, eventId), eq(events.weddingId, weddingId)))
    return event ?? null
  },

  async create(data: CreateEventInput, userId: string) {
    const [event] = await db
      .insert(events)
      .values({
        weddingId: data.weddingId,
        name: data.name,
        description: data.description,
        date: data.date ? new Date(data.date) : undefined,
        startTime: data.startTime,
        endTime: data.endTime,
        venue: data.venue,
        address: data.address,
        dressCode: data.dressCode,
      })
      .returning()

    if (event) {
      await activityService.log({
        weddingId: data.weddingId,
        userId,
        action: 'event_created',
        entityType: 'event',
        entityId: event.id,
        metadata: { type: 'event', name: data.name },
      })
    }

    return event!
  },

  async update(eventId: string, weddingId: string, data: UpdateEventInput) {
    const updateData: Record<string, unknown> = {}
    if (data.name !== undefined) updateData.name = data.name
    if (data.description !== undefined) updateData.description = data.description
    if (data.date !== undefined) updateData.date = data.date ? new Date(data.date) : null
    if (data.startTime !== undefined) updateData.startTime = data.startTime
    if (data.endTime !== undefined) updateData.endTime = data.endTime
    if (data.venue !== undefined) updateData.venue = data.venue
    if (data.address !== undefined) updateData.address = data.address
    if (data.dressCode !== undefined) updateData.dressCode = data.dressCode

    const [updated] = await db
      .update(events)
      .set(updateData)
      .where(and(eq(events.id, eventId), eq(events.weddingId, weddingId)))
      .returning()
    return updated ?? null
  },

  async delete(eventId: string, weddingId: string) {
    const [deleted] = await db
      .delete(events)
      .where(and(eq(events.id, eventId), eq(events.weddingId, weddingId)))
      .returning()
    return !!deleted
  },

  async listTimeline(eventId: string) {
    return db
      .select()
      .from(timelineEntries)
      .where(eq(timelineEntries.eventId, eventId))
      .orderBy(asc(timelineEntries.sortOrder))
  },

  async createTimelineEntry(data: CreateTimelineEntryInput) {
    const [entry] = await db
      .insert(timelineEntries)
      .values({
        eventId: data.eventId,
        weddingId: data.weddingId,
        time: data.time,
        title: data.title,
        description: data.description,
        responsiblePerson: data.responsiblePerson,
        location: data.location,
        notes: data.notes,
      })
      .returning()
    return entry!
  },

  async updateTimelineEntry(entryId: string, weddingId: string, data: UpdateTimelineEntryInput) {
    const [_entry] = await db
      .select({ weddingId: timelineEntries.weddingId })
      .from(timelineEntries)
      .where(eq(timelineEntries.id, entryId))
    if (!_entry || _entry.weddingId !== weddingId) return null

    const updateData: Record<string, unknown> = {}
    if (data.time !== undefined) updateData.time = data.time
    if (data.title !== undefined) updateData.title = data.title
    if (data.description !== undefined) updateData.description = data.description
    if (data.responsiblePerson !== undefined) updateData.responsiblePerson = data.responsiblePerson
    if (data.location !== undefined) updateData.location = data.location
    if (data.notes !== undefined) updateData.notes = data.notes
    if (data.sortOrder !== undefined) updateData.sortOrder = data.sortOrder

    const [updated] = await db
      .update(timelineEntries)
      .set(updateData)
      .where(eq(timelineEntries.id, entryId))
      .returning()
    return updated ?? null
  },

  async deleteTimelineEntry(entryId: string, weddingId: string) {
    const [_entry] = await db
      .select({ weddingId: timelineEntries.weddingId })
      .from(timelineEntries)
      .where(eq(timelineEntries.id, entryId))
    if (!_entry || _entry.weddingId !== weddingId) return
    await db.delete(timelineEntries).where(eq(timelineEntries.id, entryId))
  },

  async setMap(eventId: string, weddingId: string, data: SetEventMapInput) {
    const existing = await this.getById(eventId, weddingId)
    if (!existing) return null

    // Decode base64 PNG payload
    const base64 = data.imageDataUrl.slice('data:image/png;base64,'.length)
    const buffer = Buffer.from(base64, 'base64')

    // Defense in depth: enforce max size after decode
    const MAX_BYTES = 4 * 1024 * 1024
    if (buffer.byteLength > MAX_BYTES) {
      throw new Error('Map image exceeds 4 MB')
    }

    // PNG magic bytes: 89 50 4E 47 0D 0A 1A 0A
    const PNG_MAGIC = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
    if (buffer.byteLength < PNG_MAGIC.length || !buffer.subarray(0, 8).equals(PNG_MAGIC)) {
      throw new Error('Invalid PNG payload')
    }

    const r2Key = storageClient.buildEventMapKey(weddingId, eventId)
    await storageClient.uploadBuffer(r2Key, buffer, 'image/png')
    const url = await storageClient.getDownloadUrl(r2Key)

    const [updated] = await db
      .update(events)
      .set({
        mapImageUrl: url,
        mapImageKey: r2Key,
        mapOverlays: data.overlays,
        mapCenter: data.center,
        mapStyle: data.style,
      })
      .where(and(eq(events.id, eventId), eq(events.weddingId, weddingId)))
      .returning()
    return updated ?? null
  },

  async geocode(rawQuery: string): Promise<GeocodeResult[]> {
    const query = rawQuery.trim()
    if (query.length < 3) return []
    if (query.length > 200) return []

    // Try Nominatim first — richer address data for US housenumbers.
    try {
      const hits = await fetchNominatim(query)
      if (hits.length > 0) return hits
    } catch (err) {
      console.warn('[geocode] nominatim failed:', err instanceof Error ? err.message : err)
    }

    // Fallback to Photon — better for typos and international coverage.
    try {
      return await fetchPhoton(query)
    } catch (err) {
      console.warn('[geocode] photon failed:', err instanceof Error ? err.message : err)
      return []
    }
  },

  async clearMap(eventId: string, weddingId: string) {
    const existing = await this.getById(eventId, weddingId)
    if (!existing) return null

    if (existing.mapImageKey) {
      try {
        await storageClient.deleteObject(existing.mapImageKey)
      } catch (err) {
        // Best effort — log but continue clearing DB row
        console.error('Failed to delete map image from R2:', err)
      }
    }

    const [updated] = await db
      .update(events)
      .set({
        mapImageUrl: null,
        mapImageKey: null,
        mapOverlays: null,
        mapCenter: null,
        mapStyle: null,
      })
      .where(and(eq(events.id, eventId), eq(events.weddingId, weddingId)))
      .returning()
    return updated ?? null
  },
}
