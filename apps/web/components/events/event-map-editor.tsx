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
import { Loader2, MapPin, Plus, Save, Search, Spline, Square, X } from 'lucide-react'
import { toast } from 'sonner'
import type {
  MapBoxOverlay,
  MapCenter,
  MapLineOverlay,
  MapOverlay,
  MapStyle,
  WeddingEvent,
} from '@planfortwo/types'
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
const DEFAULT_STROKE_WIDTH = 4

type Tool = 'pan' | 'line'

interface EventMapEditorProps {
  event: WeddingEvent
  weddingId: string
  getToken: () => Promise<string | null>
  onSaved: (updated: WeddingEvent) => void
}

interface PhotonFeature {
  geometry: { coordinates: [number, number]; type: 'Point' }
  properties: {
    name?: string
    housenumber?: string
    street?: string
    city?: string
    state?: string
    country?: string
    postcode?: string
    osm_id?: number
  }
}

interface SearchResult {
  label: string
  lat: number
  lng: number
  key: string
}

function formatPhoton(f: PhotonFeature, idx: number): SearchResult {
  const p = f.properties
  const line1 = [p.housenumber, p.street].filter(Boolean).join(' ') || p.name || ''
  const line2 = [p.city, p.state, p.postcode].filter(Boolean).join(', ')
  const line3 = p.country ?? ''
  const label = [line1, line2, line3].filter(Boolean).join(' · ')
  return {
    label: label || p.name || 'Unknown location',
    lat: f.geometry.coordinates[1],
    lng: f.geometry.coordinates[0],
    key: `${f.geometry.coordinates[0]}-${f.geometry.coordinates[1]}-${p.osm_id ?? idx}`,
  }
}

// Map bridge — exposes the Leaflet instance and recenters when restoring a saved map
function MapBridge({ setMap, center }: { setMap: (map: L.Map) => void; center: MapCenter | null }) {
  const map = useMap()
  useEffect(() => {
    setMap(map)
    if (center) {
      map.setView([center.lat, center.lng], center.zoom, { animate: false })
    }
    setTimeout(() => map.invalidateSize(), 100)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return null
}

function makeId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  return `o_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

// Split saved overlays into box + line lists, migrating legacy (pre-discriminated) records
function normalizeOverlays(raw: MapOverlay[] | null | undefined): {
  boxes: MapBoxOverlay[]
  lines: MapLineOverlay[]
} {
  const boxes: MapBoxOverlay[] = []
  const lines: MapLineOverlay[] = []
  for (const o of raw ?? []) {
    if ((o as MapOverlay).kind === 'line') {
      lines.push(o as MapLineOverlay)
    } else if ((o as MapOverlay).kind === 'box') {
      boxes.push(o as MapBoxOverlay)
    } else {
      // Legacy shape — assume it was a box
      const legacy = o as unknown as Omit<MapBoxOverlay, 'kind'>
      boxes.push({ kind: 'box', ...legacy })
    }
  }
  return { boxes, lines }
}

export function EventMapEditor({ event, weddingId, getToken, onSaved }: EventMapEditorProps) {
  const captureRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)

  const initial = useMemo(() => normalizeOverlays(event.mapOverlays), [event.mapOverlays])

  const [style, setStyle] = useState<MapStyle>(event.mapStyle ?? 'street')
  const [boxes, setBoxes] = useState<MapBoxOverlay[]>(initial.boxes)
  const [lines, setLines] = useState<MapLineOverlay[]>(initial.lines)
  const [selectedColor, setSelectedColor] = useState<string>(PRESET_COLORS[0]!)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [tool, setTool] = useState<Tool>('pan')
  const [pendingLine, setPendingLine] = useState<{ x: number; y: number }[]>([])
  const [cursor, setCursor] = useState<{ x: number; y: number } | null>(null)

  // Search state
  const [searchQuery, setSearchQuery] = useState(event.address ?? '')
  const [searching, setSearching] = useState(false)
  const [results, setResults] = useState<SearchResult[]>([])
  const [showResults, setShowResults] = useState(false)
  const [markerPos, setMarkerPos] = useState<[number, number] | null>(null)

  const [saving, setSaving] = useState(false)
  const [clearing, setClearing] = useState(false)

  const initialCenter: [number, number] = useMemo(() => {
    if (event.mapCenter) return [event.mapCenter.lat, event.mapCenter.lng]
    return [40.7128, -74.006]
  }, [event.mapCenter])
  const initialZoom = event.mapCenter?.zoom ?? 13

  const setMapInstance = useCallback((map: L.Map) => {
    mapInstanceRef.current = map
  }, [])

  // ── Search (Photon + debounced typeahead) ────────────────────────────────
  const abortRef = useRef<AbortController | null>(null)
  const runSearch = useCallback(async (query: string) => {
    const trimmed = query.trim()
    if (trimmed.length < 3) {
      setResults([])
      return
    }
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller
    setSearching(true)
    try {
      const url = `https://photon.komoot.io/api/?limit=6&q=${encodeURIComponent(trimmed)}`
      const res = await fetch(url, { signal: controller.signal })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = (await res.json()) as { features: PhotonFeature[] }
      if (controller.signal.aborted) return
      setResults(data.features.map(formatPhoton))
      setShowResults(true)
    } catch (err) {
      if ((err as Error).name === 'AbortError') return
      console.error('Geocode error:', err)
      toast.error('Search failed — try again')
    } finally {
      if (!controller.signal.aborted) setSearching(false)
    }
  }, [])

  // Debounce typeahead
  useEffect(() => {
    if (!searchQuery.trim()) {
      setResults([])
      return
    }
    const timer = setTimeout(() => {
      void runSearch(searchQuery)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery, runSearch])

  const selectResult = useCallback((r: SearchResult) => {
    setMarkerPos([r.lat, r.lng])
    setSearchQuery(r.label)
    setShowResults(false)
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([r.lat, r.lng], 17, { animate: true })
    }
  }, [])

  // ── Boxes ────────────────────────────────────────────────────────────────
  const addBox = useCallback(() => {
    const overlay: MapBoxOverlay = {
      kind: 'box',
      id: makeId(),
      x: 35,
      y: 35,
      width: 30,
      height: 14,
      color: selectedColor,
      text: 'Label',
    }
    setBoxes((prev) => [...prev, overlay])
    setSelectedId(overlay.id)
    setTool('pan')
  }, [selectedColor])

  const updateBox = useCallback((id: string, updates: Partial<MapBoxOverlay>) => {
    setBoxes((prev) => prev.map((b) => (b.id === id ? { ...b, ...updates } : b)))
  }, [])

  const deleteBox = useCallback((id: string) => {
    setBoxes((prev) => prev.filter((b) => b.id !== id))
    setSelectedId((prev) => (prev === id ? null : prev))
  }, [])

  // ── Lines (click-to-add polyline) ────────────────────────────────────────
  const toggleLineTool = useCallback(() => {
    setTool((t) => (t === 'line' ? 'pan' : 'line'))
    setPendingLine([])
    setCursor(null)
  }, [])

  const commitPendingLine = useCallback(() => {
    if (pendingLine.length < 2) {
      setPendingLine([])
      setTool('pan')
      return
    }
    const line: MapLineOverlay = {
      kind: 'line',
      id: makeId(),
      color: selectedColor,
      strokeWidth: DEFAULT_STROKE_WIDTH,
      points: pendingLine,
    }
    setLines((prev) => [...prev, line])
    setSelectedId(line.id)
    setPendingLine([])
    setCursor(null)
    setTool('pan')
  }, [pendingLine, selectedColor])

  const cancelPendingLine = useCallback(() => {
    setPendingLine([])
    setCursor(null)
    setTool('pan')
  }, [])

  const updateLine = useCallback((id: string, updates: Partial<MapLineOverlay>) => {
    setLines((prev) => prev.map((l) => (l.id === id ? { ...l, ...updates } : l)))
  }, [])

  const deleteLine = useCallback((id: string) => {
    setLines((prev) => prev.filter((l) => l.id !== id))
    setSelectedId((prev) => (prev === id ? null : prev))
  }, [])

  // Keyboard shortcuts for line drawing
  useEffect(() => {
    if (tool !== 'line') return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        cancelPendingLine()
      } else if (e.key === 'Enter') {
        e.preventDefault()
        commitPendingLine()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [tool, cancelPendingLine, commitPendingLine])

  const pointFromEvent = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>): { x: number; y: number } | null => {
      const el = captureRef.current
      if (!el) return null
      const rect = el.getBoundingClientRect()
      const x = ((e.clientX - rect.left) / rect.width) * 100
      const y = ((e.clientY - rect.top) / rect.height) * 100
      return { x, y }
    },
    [],
  )

  const handleDrawClick = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      const pt = pointFromEvent(e)
      if (!pt) return
      setPendingLine((prev) => [...prev, pt])
    },
    [pointFromEvent],
  )

  const handleDrawMove = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      if (pendingLine.length === 0) return
      const pt = pointFromEvent(e)
      if (pt) setCursor(pt)
    },
    [pendingLine.length, pointFromEvent],
  )

  // ── Save / Clear ─────────────────────────────────────────────────────────
  const handleSave = useCallback(async () => {
    if (!captureRef.current) return
    setSaving(true)
    try {
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
      const overlays: MapOverlay[] = [...boxes, ...lines]
      const { data: updated } = await api.events.setMap(
        event.id,
        weddingId,
        { imageDataUrl: dataUrl, overlays, center, style },
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
  }, [event.id, weddingId, boxes, lines, style, initialCenter, initialZoom, getToken, onSaved])

  const handleClear = useCallback(async () => {
    setClearing(true)
    try {
      const token = await getToken()
      if (!token) return
      const { data: updated } = await api.events.clearMap(event.id, weddingId, token)
      setBoxes([])
      setLines([])
      setMarkerPos(null)
      toast.success('Map cleared')
      onSaved(updated)
    } catch {
      toast.error('Failed to clear map')
    } finally {
      setClearing(false)
    }
  }, [event.id, weddingId, getToken, onSaved])

  // Selected-color synchronisation — apply to whichever shape is selected
  const applyColor = useCallback(
    (c: string) => {
      setSelectedColor(c)
      if (!selectedId) return
      if (boxes.some((b) => b.id === selectedId)) updateBox(selectedId, { color: c })
      else if (lines.some((l) => l.id === selectedId)) updateLine(selectedId, { color: c })
    },
    [selectedId, boxes, lines, updateBox, updateLine],
  )

  const isDrawingLine = tool === 'line'
  const linePreviewPoints = cursor ? [...pendingLine, cursor] : pendingLine

  return (
    <div className="space-y-4">
      {/* Search bar */}
      <div className="relative flex gap-2">
        <div className="relative flex-1">
          <Input
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setShowResults(true)
            }}
            onFocus={() => results.length > 0 && setShowResults(true)}
            onBlur={() => setTimeout(() => setShowResults(false), 150)}
            placeholder="Start typing a venue or address..."
            className="pl-9"
          />
          <Search className="text-muted-foreground absolute left-2.5 top-2.5 h-4 w-4" />
          {searching && (
            <Loader2 className="text-muted-foreground absolute right-2.5 top-2.5 h-4 w-4 animate-spin" />
          )}

          {showResults && results.length > 0 && (
            <div className="border-border bg-background absolute left-0 right-0 top-full z-[1100] mt-1 max-h-64 overflow-y-auto rounded-md border shadow-lg">
              {results.map((r) => (
                <button
                  key={r.key}
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault()
                    selectResult(r)
                  }}
                  className="hover:bg-muted flex w-full items-start gap-2 border-b px-3 py-2 text-left text-sm last:border-b-0"
                >
                  <MapPin className="text-muted-foreground mt-0.5 h-4 w-4 shrink-0" />
                  <span className="text-foreground">{r.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

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
              onClick={() => applyColor(c)}
              aria-label={`Color ${c}`}
              className={`h-5 w-5 rounded-full border-2 transition ${
                selectedColor === c ? 'border-foreground scale-110' : 'border-transparent'
              }`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>

        <div className="bg-border h-6 w-px" />

        <Button type="button" size="sm" variant="outline" onClick={addBox}>
          <Square className="mr-1 h-3.5 w-3.5" />
          Add Box
        </Button>
        <Button
          type="button"
          size="sm"
          variant={isDrawingLine ? 'default' : 'outline'}
          onClick={toggleLineTool}
        >
          <Spline className="mr-1 h-3.5 w-3.5" />
          {isDrawingLine ? 'Finish (Enter)' : 'Draw Line'}
        </Button>

        <div className="ml-auto flex items-center gap-2">
          {(event.mapImageUrl || boxes.length > 0 || lines.length > 0) && (
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

      {isDrawingLine && (
        <p className="text-muted-foreground flex items-center gap-2 text-xs">
          <Plus className="h-3 w-3" />
          Click to add points · <kbd className="bg-muted rounded border px-1">Enter</kbd> or
          double-click to finish · <kbd className="bg-muted rounded border px-1">Esc</kbd> to cancel
        </p>
      )}

      {/* Map + overlay canvas */}
      <div
        ref={captureRef}
        className="border-border relative overflow-hidden rounded-xl border"
        style={{ height: 480 }}
        onClick={() => {
          // Clicking the empty canvas deselects
          if (tool === 'pan') setSelectedId(null)
        }}
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

        {/* SVG layer for lines — sits above Leaflet panes via z-index 650 */}
        <svg
          className="pointer-events-none absolute inset-0"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          style={{ zIndex: 650 }}
        >
          {lines.map((line) => {
            const isSelected = selectedId === line.id
            const pts = line.points.map((p) => `${p.x},${p.y}`).join(' ')
            return (
              <g key={line.id} className="pointer-events-auto cursor-pointer">
                {/* Wide invisible hit area */}
                <polyline
                  points={pts}
                  stroke="transparent"
                  strokeWidth={12}
                  fill="none"
                  vectorEffect="non-scaling-stroke"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  onClick={(e) => {
                    e.stopPropagation()
                    setSelectedId(line.id)
                    setSelectedColor(line.color)
                  }}
                />
                {isSelected && (
                  <polyline
                    points={pts}
                    stroke="#ffffff"
                    strokeWidth={line.strokeWidth + 3}
                    fill="none"
                    vectorEffect="non-scaling-stroke"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                )}
                <polyline
                  points={pts}
                  stroke={line.color}
                  strokeWidth={line.strokeWidth}
                  fill="none"
                  vectorEffect="non-scaling-stroke"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </g>
            )
          })}

          {/* Pending line preview */}
          {pendingLine.length > 0 && (
            <>
              <polyline
                points={linePreviewPoints.map((p) => `${p.x},${p.y}`).join(' ')}
                stroke={selectedColor}
                strokeWidth={DEFAULT_STROKE_WIDTH}
                strokeDasharray="3 3"
                fill="none"
                vectorEffect="non-scaling-stroke"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {pendingLine.map((p, i) => (
                <circle
                  key={`pt-${i}`}
                  cx={p.x}
                  cy={p.y}
                  r={0.8}
                  fill={selectedColor}
                  vectorEffect="non-scaling-stroke"
                />
              ))}
            </>
          )}
        </svg>

        {/* Box overlay layer — z-index 650 */}
        <div className="pointer-events-none absolute inset-0" style={{ zIndex: 650 }}>
          {boxes.map((b) => (
            <BoxOverlay
              key={b.id}
              overlay={b}
              selected={selectedId === b.id}
              onSelect={() => {
                setSelectedId(b.id)
                setSelectedColor(b.color)
              }}
              onChange={(updates) => updateBox(b.id, updates)}
              onDelete={() => deleteBox(b.id)}
              containerRef={captureRef}
            />
          ))}
        </div>

        {/* Delete button for selected line (overlay, not inside SVG) */}
        {selectedId && lines.find((l) => l.id === selectedId) && (
          <LineControls
            line={lines.find((l) => l.id === selectedId)!}
            onDelete={() => deleteLine(selectedId)}
            containerRef={captureRef}
          />
        )}

        {/* Line drawing capture layer — only visible/clickable in line mode */}
        {isDrawingLine && (
          <div
            className="absolute inset-0"
            style={{ zIndex: 700, cursor: 'crosshair' }}
            onPointerDown={handleDrawClick}
            onPointerMove={handleDrawMove}
            onDoubleClick={(e) => {
              e.preventDefault()
              commitPendingLine()
            }}
          />
        )}
      </div>

      <p className="text-muted-foreground text-xs">
        Search for the venue, frame the map, and add colored boxes or draw routes. The saved
        snapshot will appear in your wedding website&apos;s Map section.
      </p>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────
// Box overlay component
// ─────────────────────────────────────────────────────────────────────────

interface BoxOverlayProps {
  overlay: MapBoxOverlay
  selected: boolean
  onSelect: () => void
  onChange: (updates: Partial<MapBoxOverlay>) => void
  onDelete: () => void
  containerRef: React.RefObject<HTMLDivElement | null>
}

function BoxOverlay({
  overlay,
  selected,
  onSelect,
  onChange,
  onDelete,
  containerRef,
}: BoxOverlayProps) {
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
          <div
            onPointerDown={(e) => beginDrag(e, 'resize')}
            className="absolute -bottom-1 -right-1 h-3 w-3 cursor-se-resize rounded-sm bg-white shadow ring-1 ring-black/10"
          />
        </>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────
// Line controls (floating delete button when a line is selected)
// ─────────────────────────────────────────────────────────────────────────

interface LineControlsProps {
  line: MapLineOverlay
  onDelete: () => void
  containerRef: React.RefObject<HTMLDivElement | null>
}

function LineControls({ line, onDelete }: LineControlsProps) {
  // Place control near the midpoint of the line
  const mid = line.points[Math.floor(line.points.length / 2)] ?? line.points[0]!
  return (
    <div
      className="pointer-events-auto absolute"
      style={{
        left: `${mid.x}%`,
        top: `${mid.y}%`,
        transform: 'translate(-50%, -50%)',
        zIndex: 680,
      }}
    >
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          onDelete()
        }}
        className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-red-500 shadow ring-1 ring-black/10 transition hover:scale-110"
        aria-label="Delete line"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v))
}
