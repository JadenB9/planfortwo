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

// Dedupe by rounded coordinate (4 decimals ≈ 11m) + label prefix.
function dedupeResults(results: GeocodeResult[]): GeocodeResult[] {
  const seen = new Set<string>()
  const out: GeocodeResult[] = []
  for (const r of results) {
    const key = `${r.lat.toFixed(4)},${r.lng.toFixed(4)}|${r.label.slice(0, 40).toLowerCase()}`
    if (seen.has(key)) continue
    seen.add(key)
    out.push(r)
  }
  return out
}

// Query Nominatim + Photon in parallel and merge whichever succeed. Fires
// both at the same time instead of Nominatim-first so we aren't starved
// when Nominatim only finds a road and Photon would have found the POI.
async function geocodeParallel(query: string): Promise<GeocodeResult[]> {
  const [nom, pho] = await Promise.allSettled([fetchNominatim(query), fetchPhoton(query)])
  const merged: GeocodeResult[] = []
  if (nom.status === 'fulfilled') merged.push(...nom.value)
  else console.warn('[geocode] nominatim failed:', nom.reason?.message ?? nom.reason)
  if (pho.status === 'fulfilled') merged.push(...pho.value)
  else console.warn('[geocode] photon failed:', pho.reason?.message ?? pho.reason)
  return dedupeResults(merged).slice(0, 8)
}

// Build a list of progressively simpler variants of the raw query. Real
// user input often contains parts that break OSM-backed geocoders:
//  - Chicago-style fractional housenumbers ("2S541 Winfield Rd")
//  - Punctuation-heavy POI names ("St. James Farm Forest Preserve")
//  - Long comma-tailed full addresses
// Stripping those parts lets the geocoder at least find the street/city.
function buildQueryVariants(raw: string): string[] {
  const variants: string[] = []
  const seen = new Set<string>()
  const push = (s: string) => {
    const trimmed = s
      .trim()
      .replace(/\s{2,}/g, ' ')
      .replace(/\s*,\s*/g, ', ')
      .replace(/,\s*,/g, ',')
      .replace(/^,|,$/g, '')
      .trim()
    if (trimmed.length < 3) return
    const key = trimmed.toLowerCase()
    if (seen.has(key)) return
    seen.add(key)
    variants.push(trimmed)
  }

  push(raw)

  // 1) Strip Chicago-style fractional housenumbers (e.g. 2S541, 1N200)
  push(raw.replace(/\b\d+[NSEW]\d+\b/gi, ''))

  // 2) Strip punctuation — periods and extra commas
  push(raw.replace(/[.]/g, ' ').replace(/\s{2,}/g, ' '))

  // 3) Drop the first comma-separated segment (usually the POI name that
  //    the geocoder doesn't know) — keep street + city + state
  const segments = raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
  if (segments.length >= 2) push(segments.slice(1).join(', '))

  // 4) Keep only the first segment (just the POI name) — Photon's
  //    place-name index is surprisingly good at this
  if (segments.length >= 2) push(segments[0]!)

  // 5) First segment + last two (name + city + state)
  if (segments.length >= 3) {
    const last2 = segments.slice(-2).join(', ')
    push(`${segments[0]}, ${last2}`)
  }

  // 6) Strip common qualifiers that confuse indexes
  push(raw.replace(/\s+(forest\s+preserve|preserve|park|farm|center|centre)\b/gi, ''))

  // 7) Strip all housenumbers entirely, leaving just the street + city + state
  push(raw.replace(/\b\d+[NSEW]?\d*\s+(?=[A-Za-z])/gi, ''))

  return variants
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

    // Strategy: fire Nominatim + Photon in parallel on the original query,
    // merge/dedupe their results. If that's empty, try progressively
    // simpler variants of the query (strip Chicago fractional housenumbers,
    // drop POI name segment, etc.) until something matches. This handles
    // queries like "St. James Farm Forest Preserve, 2S541 Winfield Rd,
    // Warrenville, IL 60555" that neither provider finds on its own with
    // the full string.
    const variants = buildQueryVariants(query)
    for (const variant of variants) {
      try {
        const hits = await geocodeParallel(variant)
        if (hits.length > 0) return hits
      } catch (err) {
        console.warn('[geocode] variant failed:', variant, err)
      }
    }
    return []
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
