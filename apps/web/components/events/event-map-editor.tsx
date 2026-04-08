'use client'

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from 'react'
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { toPng } from 'html-to-image'
import { Loader2, MapPin, Plus, Save, Search, X } from 'lucide-react'
import { toast } from 'sonner'
import type { MapCenter, MapOverlay, MapStyle, WeddingEvent } from '@planfortwo/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { api } from '@/lib/api'

// Fix Leaflet's default icon URLs for bundlers (Webpack/Turbopack don't resolve them)
const DEFAULT_ICON = L.icon({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

const TILE_LAYERS: Record<
  MapStyle,
  { url: string; attribution: string; maxZoom: number; subdomains?: string[] }
> = {
  street: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '© OpenStreetMap contributors',
    maxZoom: 19,
    subdomains: ['a', 'b', 'c'],
  },
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles © Esri — World Imagery',
    maxZoom: 19,
  },
}

const PRESET_COLORS = ['#dc2626', '#ea580c', '#d97706', '#16a34a', '#0ea5e9', '#7c3aed', '#db2777']

interface EventMapEditorProps {
  event: WeddingEvent
  weddingId: string
  getToken: () => Promise<string | null>
  onSaved: (updated: WeddingEvent) => void
}

interface SearchResult {
  display_name: string
  lat: string
  lon: string
}

function MapBridge({ setMap, center }: { setMap: (map: L.Map) => void; center: MapCenter | null }) {
  const map = useMap()
  useEffect(() => {
    setMap(map)
    if (center) {
      map.setView([center.lat, center.lng], center.zoom, { animate: false })
    }
    // Force tile redraw after mount so html-to-image captures fully painted tiles
    setTimeout(() => map.invalidateSize(), 100)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return null
}

export function EventMapEditor({ event, weddingId, getToken, onSaved }: EventMapEditorProps) {
  const captureRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)

  const [style, setStyle] = useState<MapStyle>(event.mapStyle ?? 'street')
  const [overlays, setOverlays] = useState<MapOverlay[]>(event.mapOverlays ?? [])
  const [selectedColor, setSelectedColor] = useState<string>(PRESET_COLORS[0]!)
  const [selectedOverlayId, setSelectedOverlayId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState(event.address ?? '')
  const [searching, setSearching] = useState(false)
  const [results, setResults] = useState<SearchResult[]>([])
  const [markerPos, setMarkerPos] = useState<[number, number] | null>(null)
  const [saving, setSaving] = useState(false)
  const [clearing, setClearing] = useState(false)

  const initialCenter: [number, number] = useMemo(() => {
    if (event.mapCenter) return [event.mapCenter.lat, event.mapCenter.lng]
    return [40.7128, -74.006] // NYC fallback
  }, [event.mapCenter])
  const initialZoom = event.mapCenter?.zoom ?? 13

  const setMapInstance = useCallback((map: L.Map) => {
    mapInstanceRef.current = map
  }, [])

  const handleSearch = useCallback(async () => {
    const query = searchQuery.trim()
    if (!query) return
    setSearching(true)
    setResults([])
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&limit=5&q=${encodeURIComponent(query)}`
      const res = await fetch(url, { headers: { Accept: 'application/json' } })
      if (!res.ok) throw new Error('Search failed')
      const data = (await res.json()) as SearchResult[]
      setResults(data)
      if (data.length === 0) toast.info('No locations found')
    } catch (err) {
      console.error('Geocode error:', err)
      toast.error('Search failed — try again')
    } finally {
      setSearching(false)
    }
  }, [searchQuery])

  const selectResult = useCallback((r: SearchResult) => {
    const lat = parseFloat(r.lat)
    const lng = parseFloat(r.lon)
    setMarkerPos([lat, lng])
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([lat, lng], 16, { animate: true })
    }
    setResults([])
  }, [])

  const addOverlay = useCallback(() => {
    const id = (
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `o_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
    ) as string
    const overlay: MapOverlay = {
      id,
      x: 35,
      y: 35,
      width: 30,
      height: 14,
      color: selectedColor,
      text: 'Label',
    }
    setOverlays((prev) => [...prev, overlay])
    setSelectedOverlayId(id)
  }, [selectedColor])

  const updateOverlay = useCallback((id: string, updates: Partial<MapOverlay>) => {
    setOverlays((prev) => prev.map((o) => (o.id === id ? { ...o, ...updates } : o)))
  }, [])

  const deleteOverlay = useCallback((id: string) => {
    setOverlays((prev) => prev.filter((o) => o.id !== id))
    setSelectedOverlayId((prev) => (prev === id ? null : prev))
  }, [])

  const handleSave = useCallback(async () => {
    if (!captureRef.current) return
    setSaving(true)
    try {
      // Wait a tick so any in-flight tile loads paint
      await new Promise((r) => setTimeout(r, 250))
      const dataUrl = await toPng(captureRef.current, {
        cacheBust: true,
        pixelRatio: 2,
        skipFonts: true,
      })

      const map = mapInstanceRef.current
      const center: MapCenter = map
        ? { lat: map.getCenter().lat, lng: map.getCenter().lng, zoom: map.getZoom() }
        : { lat: initialCenter[0], lng: initialCenter[1], zoom: initialZoom }

      const token = await getToken()
      if (!token) {
        toast.error('Please sign in again')
        return
      }
      const { data: updated } = await api.events.setMap(
        event.id,
        weddingId,
        {
          imageDataUrl: dataUrl,
          overlays,
          center,
          style,
        },
        token,
      )
      toast.success('Map saved')
      onSaved(updated)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to save map'
      console.error('Map save error:', err)
      toast.error(msg)
    } finally {
      setSaving(false)
    }
  }, [event.id, weddingId, overlays, style, initialCenter, initialZoom, getToken, onSaved])

  const handleClear = useCallback(async () => {
    setClearing(true)
    try {
      const token = await getToken()
      if (!token) return
      const { data: updated } = await api.events.clearMap(event.id, weddingId, token)
      setOverlays([])
      setMarkerPos(null)
      toast.success('Map cleared')
      onSaved(updated)
    } catch {
      toast.error('Failed to clear map')
    } finally {
      setClearing(false)
    }
  }, [event.id, weddingId, getToken, onSaved])

  return (
    <div className="space-y-4">
      {/* Search bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                void handleSearch()
              }
            }}
            placeholder="Search venue address (e.g. 350 5th Ave, New York)"
            className="pl-9"
          />
          <Search className="text-muted-foreground absolute left-2.5 top-2.5 h-4 w-4" />
        </div>
        <Button type="button" onClick={() => void handleSearch()} disabled={searching}>
          {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Search'}
        </Button>
      </div>

      {results.length > 0 && (
        <div className="border-border bg-background max-h-48 overflow-y-auto rounded-md border">
          {results.map((r, i) => (
            <button
              key={`${r.lat}-${r.lon}-${i}`}
              type="button"
              onClick={() => selectResult(r)}
              className="hover:bg-muted flex w-full items-start gap-2 border-b px-3 py-2 text-left text-sm last:border-b-0"
            >
              <MapPin className="text-muted-foreground mt-0.5 h-4 w-4 shrink-0" />
              <span className="text-foreground">{r.display_name}</span>
            </button>
          ))}
        </div>
      )}

      {/* Toolbar */}
      <div className="border-border bg-muted/40 flex flex-wrap items-center gap-3 rounded-lg border px-3 py-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setStyle('street')}
            className={`rounded-md px-2.5 py-1 text-xs font-medium transition ${
              style === 'street'
                ? 'bg-wedding-600 text-white'
                : 'bg-background text-foreground hover:bg-muted'
            }`}
          >
            Street
          </button>
          <button
            type="button"
            onClick={() => setStyle('satellite')}
            className={`rounded-md px-2.5 py-1 text-xs font-medium transition ${
              style === 'satellite'
                ? 'bg-wedding-600 text-white'
                : 'bg-background text-foreground hover:bg-muted'
            }`}
          >
            Satellite
          </button>
        </div>

        <div className="bg-border h-6 w-px" />

        <div className="flex items-center gap-1.5">
          {PRESET_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => {
                setSelectedColor(c)
                if (selectedOverlayId) updateOverlay(selectedOverlayId, { color: c })
              }}
              aria-label={`Color ${c}`}
              className={`h-5 w-5 rounded-full border-2 transition ${
                selectedColor === c ? 'border-foreground scale-110' : 'border-transparent'
              }`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>

        <div className="bg-border h-6 w-px" />

        <Button type="button" size="sm" variant="outline" onClick={addOverlay}>
          <Plus className="mr-1 h-3.5 w-3.5" />
          Add Box
        </Button>

        <div className="ml-auto flex items-center gap-2">
          {(event.mapImageUrl || overlays.length > 0) && (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => void handleClear()}
              disabled={clearing}
            >
              {clearing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Clear'}
            </Button>
          )}
          <Button type="button" size="sm" onClick={() => void handleSave()} disabled={saving}>
            {saving ? (
              <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
            ) : (
              <Save className="mr-1 h-3.5 w-3.5" />
            )}
            Save Map
          </Button>
        </div>
      </div>

      {/* Map + overlay canvas */}
      <div
        ref={captureRef}
        className="border-border relative overflow-hidden rounded-xl border"
        style={{ height: 480 }}
      >
        <MapContainer
          center={initialCenter}
          zoom={initialZoom}
          scrollWheelZoom
          style={{ height: '100%', width: '100%' }}
        >
          <MapBridge setMap={setMapInstance} center={event.mapCenter ?? null} />
          <TileLayer
            key={style}
            url={TILE_LAYERS[style].url}
            attribution={TILE_LAYERS[style].attribution}
            maxZoom={TILE_LAYERS[style].maxZoom}
            {...(TILE_LAYERS[style].subdomains
              ? { subdomains: TILE_LAYERS[style].subdomains }
              : {})}
            crossOrigin=""
          />
          {markerPos && <Marker position={markerPos} icon={DEFAULT_ICON} />}
        </MapContainer>

        {/* Overlay layer — sits above the map */}
        <div className="pointer-events-none absolute inset-0">
          {overlays.map((o) => (
            <OverlayBox
              key={o.id}
              overlay={o}
              selected={selectedOverlayId === o.id}
              onSelect={() => {
                setSelectedOverlayId(o.id)
                setSelectedColor(o.color)
              }}
              onChange={(updates) => updateOverlay(o.id, updates)}
              onDelete={() => deleteOverlay(o.id)}
              containerRef={captureRef}
            />
          ))}
        </div>
      </div>

      <p className="text-muted-foreground text-xs">
        Search for the venue, frame the map, and drop colored boxes with labels. The saved snapshot
        will appear in your wedding website&apos;s Map section.
      </p>
    </div>
  )
}

interface OverlayBoxProps {
  overlay: MapOverlay
  selected: boolean
  onSelect: () => void
  onChange: (updates: Partial<MapOverlay>) => void
  onDelete: () => void
  containerRef: React.RefObject<HTMLDivElement | null>
}

function OverlayBox({
  overlay,
  selected,
  onSelect,
  onChange,
  onDelete,
  containerRef,
}: OverlayBoxProps) {
  const [editingText, setEditingText] = useState(false)

  const beginDrag = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>, mode: 'move' | 'resize') => {
      if (editingText) return
      e.stopPropagation()
      e.preventDefault()
      onSelect()
      const startX = e.clientX
      const startY = e.clientY
      const startOverlay = { ...overlay }
      const container = containerRef.current
      if (!container) return
      const rect = container.getBoundingClientRect()

      const onMove = (ev: PointerEvent) => {
        const dx = ((ev.clientX - startX) / rect.width) * 100
        const dy = ((ev.clientY - startY) / rect.height) * 100
        if (mode === 'move') {
          onChange({
            x: clamp(startOverlay.x + dx, 0, 100 - startOverlay.width),
            y: clamp(startOverlay.y + dy, 0, 100 - startOverlay.height),
          })
        } else {
          onChange({
            width: clamp(startOverlay.width + dx, 6, 100 - startOverlay.x),
            height: clamp(startOverlay.height + dy, 6, 100 - startOverlay.y),
          })
        }
      }
      const onUp = () => {
        window.removeEventListener('pointermove', onMove)
        window.removeEventListener('pointerup', onUp)
      }
      window.addEventListener('pointermove', onMove)
      window.addEventListener('pointerup', onUp)
    },
    [editingText, overlay, onChange, onSelect, containerRef],
  )

  return (
    <div
      className="pointer-events-auto absolute"
      style={{
        left: `${overlay.x}%`,
        top: `${overlay.y}%`,
        width: `${overlay.width}%`,
        height: `${overlay.height}%`,
      }}
      onPointerDown={(e) => beginDrag(e, 'move')}
    >
      <div
        className={`flex h-full w-full items-center justify-center rounded-md border-2 px-2 text-center text-xs font-semibold leading-tight text-white shadow-md transition ${
          selected ? 'ring-2 ring-white ring-offset-2' : ''
        }`}
        style={{ backgroundColor: overlay.color, borderColor: overlay.color }}
      >
        {editingText ? (
          <input
            autoFocus
            value={overlay.text}
            onChange={(e) => onChange({ text: e.target.value.slice(0, 120) })}
            onBlur={() => setEditingText(false)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === 'Escape') setEditingText(false)
              e.stopPropagation()
            }}
            onPointerDown={(e) => e.stopPropagation()}
            className="w-full bg-transparent text-center text-white outline-none placeholder:text-white/60"
          />
        ) : (
          <span
            onDoubleClick={(e) => {
              e.stopPropagation()
              setEditingText(true)
            }}
            className="truncate"
          >
            {overlay.text || 'Label'}
          </span>
        )}
      </div>

      {selected && (
        <>
          {/* Delete button */}
          <button
            type="button"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation()
              onDelete()
            }}
            className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-white text-red-500 shadow ring-1 ring-black/10"
            aria-label="Delete box"
          >
            <X className="h-3 w-3" />
          </button>
          {/* Resize handle */}
          <div
            onPointerDown={(e) => beginDrag(e, 'resize')}
            className="absolute -bottom-1 -right-1 h-3 w-3 cursor-se-resize rounded-sm bg-white shadow ring-1 ring-black/10"
          />
        </>
      )}
    </div>
  )
}

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v))
}
