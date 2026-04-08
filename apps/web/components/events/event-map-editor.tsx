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
import { Crop, Loader2, MapPin, Save, Search, Spline, X } from 'lucide-react'
import { toast } from 'sonner'
import type {
  GeocodeResult,
  MapCenter,
  MapCropBox,
  MapLineOverlay,
  MapOverlaysData,
  MapStyle,
  WeddingEvent,
} from '@planfortwo/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { api } from '@/lib/api'

// ── Leaflet icon fix (bundlers don't resolve Leaflet's default marker) ──
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
const DEFAULT_CROP: MapCropBox = { x: 10, y: 10, width: 80, height: 80 }
const MIN_CROP_SIZE = 15
const SEARCH_DEBOUNCE_MS = 350

type Tool = 'pan' | 'line'

interface EventMapEditorProps {
  event: WeddingEvent
  weddingId: string
  getToken: () => Promise<string | null>
  onSaved: (updated: WeddingEvent) => void
}

// ── Leaflet bridge — expose map instance + recenter for restored state ──
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

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v))
}

// Load an <img> element from a data URL.
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Failed to decode captured image'))
    img.src = src
  })
}

// Crop a PNG data URL to a rectangle expressed in 0-100 percent coords.
async function cropDataUrl(dataUrl: string, crop: MapCropBox): Promise<string> {
  const img = await loadImage(dataUrl)
  const srcX = Math.round((crop.x / 100) * img.naturalWidth)
  const srcY = Math.round((crop.y / 100) * img.naturalHeight)
  const srcW = Math.round((crop.width / 100) * img.naturalWidth)
  const srcH = Math.round((crop.height / 100) * img.naturalHeight)
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, srcW)
  canvas.height = Math.max(1, srcH)
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas 2D context unavailable')
  ctx.drawImage(img, srcX, srcY, srcW, srcH, 0, 0, srcW, srcH)
  return canvas.toDataURL('image/png')
}

export function EventMapEditor({ event, weddingId, getToken, onSaved }: EventMapEditorProps) {
  const captureRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)

  const initialOverlays: MapOverlaysData = useMemo(
    () => event.mapOverlays ?? { cropBox: null, lines: [] },
    [event.mapOverlays],
  )

  const [style, setStyle] = useState<MapStyle>(event.mapStyle ?? 'street')
  const [cropBox, setCropBox] = useState<MapCropBox | null>(initialOverlays.cropBox)
  const [lines, setLines] = useState<MapLineOverlay[]>(initialOverlays.lines)
  const [selectedColor, setSelectedColor] = useState<string>(PRESET_COLORS[0]!)
  const [selectedLineId, setSelectedLineId] = useState<string | null>(null)
  const [tool, setTool] = useState<Tool>('pan')
  const [pendingLine, setPendingLine] = useState<{ x: number; y: number }[]>([])
  const [cursor, setCursor] = useState<{ x: number; y: number } | null>(null)

  // Search state
  const [searchQuery, setSearchQuery] = useState(event.address ?? '')
  const [searching, setSearching] = useState(false)
  const [results, setResults] = useState<GeocodeResult[]>([])
  const [showResults, setShowResults] = useState(false)
  const [markerPos, setMarkerPos] = useState<[number, number] | null>(null)

  // Capture state — used to temporarily hide chrome during html-to-image
  const [capturing, setCapturing] = useState(false)
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

  // ── Geocode (through our Hono API so CSP + User-Agent are handled) ──────
  const abortRef = useRef<AbortController | null>(null)
  const runSearch = useCallback(
    async (query: string, opts: { keepDropdown?: boolean } = {}) => {
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
        const token = await getToken()
        if (!token) {
          toast.error('Please sign in again')
          return
        }
        if (controller.signal.aborted) return
        const { data } = await api.events.geocode(trimmed, token)
        if (controller.signal.aborted) return
        setResults(data)
        setShowResults(opts.keepDropdown ?? true)
        if (data.length === 0) {
          toast.info('No locations found — try a more specific query')
        }
      } catch (err) {
        if ((err as Error).name === 'AbortError') return
        console.error('Geocode error:', err)
        toast.error('Search failed — try again')
      } finally {
        if (!controller.signal.aborted) setSearching(false)
      }
    },
    [getToken],
  )

  // Debounced typeahead
  useEffect(() => {
    if (!searchQuery.trim()) {
      setResults([])
      return
    }
    const timer = setTimeout(() => {
      void runSearch(searchQuery)
    }, SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [searchQuery, runSearch])

  const selectResult = useCallback((r: GeocodeResult) => {
    setMarkerPos([r.lat, r.lng])
    setSearchQuery(r.label)
    setShowResults(false)
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([r.lat, r.lng], 17, { animate: true })
    }
  }, [])

  // ── Crop frame ───────────────────────────────────────────────────────────
  const addCrop = useCallback(() => {
    setCropBox((prev) => prev ?? { ...DEFAULT_CROP })
  }, [])
  const removeCrop = useCallback(() => setCropBox(null), [])

  const updateCrop = useCallback((updates: Partial<MapCropBox>) => {
    setCropBox((prev) => (prev ? { ...prev, ...updates } : prev))
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
      setCursor(null)
      setTool('pan')
      return
    }
    const line: MapLineOverlay = {
      id: makeId(),
      color: selectedColor,
      strokeWidth: DEFAULT_STROKE_WIDTH,
      points: pendingLine,
    }
    setLines((prev) => [...prev, line])
    setSelectedLineId(line.id)
    setPendingLine([])
    setCursor(null)
    setTool('pan')
  }, [pendingLine, selectedColor])

  const cancelPendingLine = useCallback(() => {
    setPendingLine([])
    setCursor(null)
    setTool('pan')
  }, [])

  const deleteLine = useCallback((id: string) => {
    setLines((prev) => prev.filter((l) => l.id !== id))
    setSelectedLineId((prev) => (prev === id ? null : prev))
  }, [])

  const updateLineColor = useCallback((id: string, color: string) => {
    setLines((prev) => prev.map((l) => (l.id === id ? { ...l, color } : l)))
  }, [])

  // Keyboard shortcuts
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

  // Read coordinates from the element that received the event (the drawing
  // capture layer), NOT the captureRef. Any border/padding/transform on
  // ancestor elements can make their bounding rects disagree — using
  // currentTarget guarantees clicks land exactly where the user pressed.
  const pointFromEvent = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>): { x: number; y: number } | null => {
      const el = e.currentTarget
      if (!el) return null
      const rect = el.getBoundingClientRect()
      if (rect.width === 0 || rect.height === 0) return null
      return {
        x: ((e.clientX - rect.left) / rect.width) * 100,
        y: ((e.clientY - rect.top) / rect.height) * 100,
      }
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

  // Apply current palette colour to the selected line (if any)
  const applyColor = useCallback(
    (c: string) => {
      setSelectedColor(c)
      if (selectedLineId) updateLineColor(selectedLineId, c)
    },
    [selectedLineId, updateLineColor],
  )

  // ── Save / Clear ─────────────────────────────────────────────────────────
  const handleSave = useCallback(async () => {
    if (!captureRef.current) return
    setSaving(true)
    let stage = 'start'
    try {
      // Hide editor chrome (crop outline, line handles) during capture so
      // the saved image is clean. html-to-image reads live DOM styles.
      setCapturing(true)
      await new Promise((r) => setTimeout(r, 150))

      stage = 'capture'
      // Capture at a modest pixel ratio to keep the PNG under the API's
      // 10 MB body limit even when the user has the whole satellite view
      // inside the crop frame.
      const fullDataUrl = await toPng(captureRef.current, {
        cacheBust: true,
        pixelRatio: 1.5,
        skipFonts: true,
      })
      setCapturing(false)

      stage = 'crop'
      const croppedDataUrl = cropBox ? await cropDataUrl(fullDataUrl, cropBox) : fullDataUrl

      // Back-of-envelope payload size check — base64 ~= raw * 4/3
      const approxBytes = Math.floor((croppedDataUrl.length * 3) / 4)
      if (approxBytes > 9 * 1024 * 1024) {
        throw new Error(
          `Captured image is ${Math.round(approxBytes / 1024 / 1024)} MB — too large. Try a smaller crop box.`,
        )
      }

      const map = mapInstanceRef.current
      const center: MapCenter = map
        ? { lat: map.getCenter().lat, lng: map.getCenter().lng, zoom: map.getZoom() }
        : { lat: initialCenter[0], lng: initialCenter[1], zoom: initialZoom }

      const token = await getToken()
      if (!token) {
        toast.error('Please sign in again')
        return
      }
      stage = 'upload'
      const overlays: MapOverlaysData = { cropBox, lines }
      const { data: updated } = await api.events.setMap(
        event.id,
        weddingId,
        { imageDataUrl: croppedDataUrl, overlays, center, style },
        token,
      )
      toast.success('Map saved')
      onSaved(updated)
    } catch (err) {
      const baseMsg = err instanceof Error ? err.message : String(err)
      console.error(`Map save error at stage "${stage}":`, err)
      toast.error(`Save failed (${stage}): ${baseMsg.slice(0, 200)}`)
    } finally {
      setCapturing(false)
      setSaving(false)
    }
  }, [event.id, weddingId, cropBox, lines, style, initialCenter, initialZoom, getToken, onSaved])

  const handleClear = useCallback(async () => {
    setClearing(true)
    try {
      const token = await getToken()
      if (!token) return
      const { data: updated } = await api.events.clearMap(event.id, weddingId, token)
      setCropBox(null)
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

  const isDrawingLine = tool === 'line'
  const linePreviewPoints = cursor ? [...pendingLine, cursor] : pendingLine

  return (
    <div className="space-y-4">
      {/* Search bar with manual Search button AND typeahead dropdown */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Input
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setShowResults(true)
            }}
            onFocus={() => results.length > 0 && setShowResults(true)}
            onBlur={() => setTimeout(() => setShowResults(false), 160)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                void runSearch(searchQuery, { keepDropdown: true })
              }
            }}
            placeholder="Start typing a venue or address..."
            className="pl-9"
          />
          <Search className="text-muted-foreground absolute left-2.5 top-2.5 h-4 w-4" />
          {searching && (
            <Loader2 className="text-muted-foreground absolute right-2.5 top-2.5 h-4 w-4 animate-spin" />
          )}

          {showResults && results.length > 0 && (
            <div className="border-border bg-background absolute left-0 right-0 top-full z-[1100] mt-1 max-h-64 overflow-y-auto rounded-md border shadow-lg">
              {results.map((r, i) => (
                <button
                  key={`${r.lat}-${r.lng}-${i}`}
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
        <Button
          type="button"
          onClick={() => void runSearch(searchQuery, { keepDropdown: true })}
          disabled={searching || searchQuery.trim().length < 3}
        >
          {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Search'}
        </Button>
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

        {cropBox ? (
          <Button type="button" size="sm" variant="outline" onClick={removeCrop}>
            <Crop className="mr-1 h-3.5 w-3.5" />
            Remove Crop
          </Button>
        ) : (
          <Button type="button" size="sm" variant="outline" onClick={addCrop}>
            <Crop className="mr-1 h-3.5 w-3.5" />
            Set Crop Frame
          </Button>
        )}
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
          {(event.mapImageUrl || cropBox || lines.length > 0) && (
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
          if (tool === 'pan') setSelectedLineId(null)
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

        {/* SVG layer for lines — above Leaflet panes via z-index 650 */}
        <svg
          className="pointer-events-none absolute inset-0"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          style={{ zIndex: 650 }}
        >
          {lines.map((line) => {
            const isSelected = selectedLineId === line.id
            const pts = line.points.map((p) => `${p.x},${p.y}`).join(' ')
            return (
              <g key={line.id} className="pointer-events-auto cursor-pointer">
                {/* Wide transparent hit area */}
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
                    setSelectedLineId(line.id)
                    setSelectedColor(line.color)
                  }}
                />
                {isSelected && !capturing && (
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

          {/* Pending line preview (hidden during capture) */}
          {!capturing && pendingLine.length > 0 && (
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

        {/* Crop frame — thin black border, transparent centre. Hidden during capture. */}
        {cropBox && !capturing && (
          <CropFrame crop={cropBox} onChange={updateCrop} containerRef={captureRef} />
        )}

        {/* Floating delete button for the currently selected line */}
        {!capturing && selectedLineId && (
          <LineDeleteControl
            line={lines.find((l) => l.id === selectedLineId)}
            onDelete={() => selectedLineId && deleteLine(selectedLineId)}
          />
        )}

        {/* Line drawing capture layer — only active in line mode */}
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
        Search for the venue, frame the area with the crop box, and draw colored routes. Only the
        contents inside the crop box are saved — the outline itself is hidden. If you skip the crop
        box the full map is captured.
      </p>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────
// Crop frame: thin black outline, transparent interior, drag + resize
// ─────────────────────────────────────────────────────────────────────────

interface CropFrameProps {
  crop: MapCropBox
  onChange: (updates: Partial<MapCropBox>) => void
  containerRef: React.RefObject<HTMLDivElement | null>
}

function CropFrame({ crop, onChange, containerRef }: CropFrameProps) {
  const beginDrag = useCallback(
    (
      e: ReactPointerEvent<HTMLDivElement>,
      mode: 'move' | 'resize-nw' | 'resize-ne' | 'resize-sw' | 'resize-se',
    ) => {
      e.stopPropagation()
      e.preventDefault()
      const startX = e.clientX
      const startY = e.clientY
      const start = { ...crop }
      const container = containerRef.current
      if (!container) return
      const rect = container.getBoundingClientRect()

      const onMove = (ev: PointerEvent) => {
        const dxPct = ((ev.clientX - startX) / rect.width) * 100
        const dyPct = ((ev.clientY - startY) / rect.height) * 100
        if (mode === 'move') {
          onChange({
            x: clamp(start.x + dxPct, 0, 100 - start.width),
            y: clamp(start.y + dyPct, 0, 100 - start.height),
          })
          return
        }
        let nx = start.x
        let ny = start.y
        let nw = start.width
        let nh = start.height
        if (mode === 'resize-se') {
          nw = clamp(start.width + dxPct, MIN_CROP_SIZE, 100 - start.x)
          nh = clamp(start.height + dyPct, MIN_CROP_SIZE, 100 - start.y)
        } else if (mode === 'resize-sw') {
          const newX = clamp(start.x + dxPct, 0, start.x + start.width - MIN_CROP_SIZE)
          nw = start.x + start.width - newX
          nx = newX
          nh = clamp(start.height + dyPct, MIN_CROP_SIZE, 100 - start.y)
        } else if (mode === 'resize-ne') {
          nw = clamp(start.width + dxPct, MIN_CROP_SIZE, 100 - start.x)
          const newY = clamp(start.y + dyPct, 0, start.y + start.height - MIN_CROP_SIZE)
          nh = start.y + start.height - newY
          ny = newY
        } else if (mode === 'resize-nw') {
          const newX = clamp(start.x + dxPct, 0, start.x + start.width - MIN_CROP_SIZE)
          const newY = clamp(start.y + dyPct, 0, start.y + start.height - MIN_CROP_SIZE)
          nw = start.x + start.width - newX
          nh = start.y + start.height - newY
          nx = newX
          ny = newY
        }
        onChange({ x: nx, y: ny, width: nw, height: nh })
      }
      const onUp = () => {
        window.removeEventListener('pointermove', onMove)
        window.removeEventListener('pointerup', onUp)
      }
      window.addEventListener('pointermove', onMove)
      window.addEventListener('pointerup', onUp)
    },
    [crop, onChange, containerRef],
  )

  const handleStyle: React.CSSProperties = {
    background: '#000000',
    border: '1px solid #ffffff',
    borderRadius: 2,
  }

  return (
    <div
      className="pointer-events-auto absolute"
      style={{
        left: `${crop.x}%`,
        top: `${crop.y}%`,
        width: `${crop.width}%`,
        height: `${crop.height}%`,
        border: '1.5px solid #000000',
        boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.15)',
        cursor: 'move',
        zIndex: 670,
      }}
      onPointerDown={(e) => beginDrag(e, 'move')}
    >
      {/* Corner handles */}
      <div
        onPointerDown={(e) => beginDrag(e, 'resize-nw')}
        className="absolute h-2.5 w-2.5 cursor-nwse-resize"
        style={{ left: -5, top: -5, ...handleStyle }}
      />
      <div
        onPointerDown={(e) => beginDrag(e, 'resize-ne')}
        className="absolute h-2.5 w-2.5 cursor-nesw-resize"
        style={{ right: -5, top: -5, ...handleStyle }}
      />
      <div
        onPointerDown={(e) => beginDrag(e, 'resize-sw')}
        className="absolute h-2.5 w-2.5 cursor-nesw-resize"
        style={{ left: -5, bottom: -5, ...handleStyle }}
      />
      <div
        onPointerDown={(e) => beginDrag(e, 'resize-se')}
        className="absolute h-2.5 w-2.5 cursor-nwse-resize"
        style={{ right: -5, bottom: -5, ...handleStyle }}
      />
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────
// Floating delete button for the currently-selected line
// ─────────────────────────────────────────────────────────────────────────

function LineDeleteControl({
  line,
  onDelete,
}: {
  line: MapLineOverlay | undefined
  onDelete: () => void
}) {
  if (!line) return null
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
