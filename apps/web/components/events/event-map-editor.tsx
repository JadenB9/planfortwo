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
import { Crop, Loader2, MapPin, MapPinned, Save, Search, Spline, Square, X } from 'lucide-react'
import { toast } from 'sonner'
import type {
  GeocodeResult,
  MapBoxOverlay,
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
const DEFAULT_BOX_SIZE = { width: 22, height: 10 }
const MIN_CROP_SIZE = 15
const MIN_BOX_SIZE = 4
const SEARCH_DEBOUNCE_MS = 350

// Ensure overlays loaded from the DB have every field the editor expects —
// the `boxes` array was added after the initial release, so existing rows
// may be missing it entirely.
function normalizeOverlays(raw: MapOverlaysData | null | undefined): MapOverlaysData {
  if (!raw) return { cropBox: null, lines: [], boxes: [] }
  return {
    cropBox: raw.cropBox ?? null,
    lines: Array.isArray(raw.lines) ? raw.lines : [],
    boxes: Array.isArray(raw.boxes) ? raw.boxes : [],
  }
}

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

// Draw a rounded rectangle path onto a 2D canvas context.
function roundedRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  radius: number,
) {
  const r = Math.min(radius, w / 2, h / 2)
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + r)
  ctx.lineTo(x + w, y + h - r)
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  ctx.lineTo(x + r, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
}

// Load a tile image with `crossOrigin="anonymous"` so the resulting canvas
// stays CORS-clean when we call toDataURL(). Resolves to null on error
// (we'd rather skip a missing tile than fail the whole capture).
function loadTileCors(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => resolve(null)
    img.src = src
  })
}

// Custom map capture pipeline. Bypasses html-to-image entirely because that
// library loads tile imagery through its own DOM-clone + foreignObject
// machinery, which inconsistently taints the canvas on certain tile
// providers. Instead we:
//   1. Create a canvas the exact size of the Leaflet map container.
//   2. Reload every visible .leaflet-tile-loaded <img> with
//      crossOrigin="anonymous" and drawImage() it at its live screen
//      position (relative to the map container).
//   3. Draw line and box overlays in 2D-context so they match whatever
//      the editor was showing.
// Returns a same-origin data URL that is always CORS-clean because every
// source image was fetched with explicit CORS.
async function captureMapToDataUrl({
  mapInstance,
  lines,
  boxes,
}: {
  mapInstance: L.Map
  lines: MapLineOverlay[]
  boxes: MapBoxOverlay[]
}): Promise<string> {
  const mapEl = mapInstance.getContainer()
  const mapRect = mapEl.getBoundingClientRect()
  const width = mapEl.clientWidth
  const height = mapEl.clientHeight
  const dpr = Math.min(window.devicePixelRatio || 1, 2)

  const canvas = document.createElement('canvas')
  canvas.width = Math.round(width * dpr)
  canvas.height = Math.round(height * dpr)
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas 2D context unavailable')
  ctx.scale(dpr, dpr)

  // Neutral base in case of missing tiles
  ctx.fillStyle = '#f3f4f6'
  ctx.fillRect(0, 0, width, height)

  // Gather all visible, already-loaded tile <img> elements across every
  // TileLayer that Leaflet has rendered inside this map.
  const tileElements = Array.from(
    mapEl.querySelectorAll<HTMLImageElement>('img.leaflet-tile.leaflet-tile-loaded'),
  )

  // Load each tile with CORS in parallel, then draw.
  await Promise.all(
    tileElements.map(async (tile) => {
      const src = tile.currentSrc || tile.src
      if (!src) return
      const corsImg = await loadTileCors(src)
      if (!corsImg) return
      const tileRect = tile.getBoundingClientRect()
      const x = tileRect.left - mapRect.left
      const y = tileRect.top - mapRect.top
      // The tile's on-screen size may be fractional because of Leaflet's
      // CSS transform; draw at float coords to avoid visible seams.
      ctx.drawImage(corsImg, x, y, tileRect.width, tileRect.height)
    }),
  )

  // Draw box overlays (underneath lines, same z-order as editor)
  for (const box of boxes) {
    const bx = (box.x / 100) * width
    const by = (box.y / 100) * height
    const bw = (box.width / 100) * width
    const bh = (box.height / 100) * height

    ctx.save()
    ctx.shadowColor = 'rgba(0, 0, 0, 0.25)'
    ctx.shadowBlur = 4
    ctx.shadowOffsetY = 1
    ctx.fillStyle = box.color
    roundedRectPath(ctx, bx, by, bw, bh, 6)
    ctx.fill()
    ctx.restore()

    if (box.label) {
      const fontSize = Math.max(10, Math.min(18, Math.round(bh * 0.32)))
      ctx.fillStyle = '#ffffff'
      ctx.font = `600 ${fontSize}px -apple-system, system-ui, "Segoe UI", sans-serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(box.label, bx + bw / 2, by + bh / 2, bw - 6)
    }
  }

  // Draw polyline overlays
  for (const line of lines) {
    if (line.points.length < 2) continue
    ctx.beginPath()
    ctx.strokeStyle = line.color
    ctx.lineWidth = line.strokeWidth
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    const first = line.points[0]!
    ctx.moveTo((first.x / 100) * width, (first.y / 100) * height)
    for (let i = 1; i < line.points.length; i++) {
      const pt = line.points[i]!
      ctx.lineTo((pt.x / 100) * width, (pt.y / 100) * height)
    }
    ctx.stroke()
  }

  return canvas.toDataURL('image/png')
}

type Tool = 'pan' | 'line' | 'pin'

export function EventMapEditor({ event, weddingId, getToken, onSaved }: EventMapEditorProps) {
  const captureRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)

  const initialOverlays: MapOverlaysData = useMemo(
    () => normalizeOverlays(event.mapOverlays),
    [event.mapOverlays],
  )

  const [style, setStyle] = useState<MapStyle>(event.mapStyle ?? 'street')
  const [cropBox, setCropBox] = useState<MapCropBox | null>(initialOverlays.cropBox)
  const [lines, setLines] = useState<MapLineOverlay[]>(initialOverlays.lines)
  const [boxes, setBoxes] = useState<MapBoxOverlay[]>(initialOverlays.boxes)
  const [selectedColor, setSelectedColor] = useState<string>(PRESET_COLORS[0]!)
  const [selectedLineId, setSelectedLineId] = useState<string | null>(null)
  const [selectedBoxId, setSelectedBoxId] = useState<string | null>(null)
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

  // ── Coordinate helpers ──────────────────────────────────────────────────
  // Detect "lat, lng" coordinate pairs in the search bar so the user can
  // paste exact coordinates from Apple Maps / Google Maps / a GPS app
  // instead of relying on the geocoder. Accepts "41.83225, -88.15740",
  // "41.83225° N, 88.15740° W", "41.83225N 88.15740W", etc.
  const parseCoordinates = useCallback((raw: string): [number, number] | null => {
    // Strip degree/compass chars so we can work with plain numbers
    const cleaned = raw.replace(/[°º]/g, '').replace(/\s+/g, ' ').trim()
    // Matches <signed float> [N/S] [,| ] <signed float> [E/W]
    const match = cleaned.match(
      /^(-?\d+(?:\.\d+)?)\s*([NS])?\s*[, ]\s*(-?\d+(?:\.\d+)?)\s*([EW])?$/i,
    )
    if (!match) return null
    let lat = parseFloat(match[1]!)
    let lng = parseFloat(match[3]!)
    if (Number.isNaN(lat) || Number.isNaN(lng)) return null
    if (match[2]?.toUpperCase() === 'S') lat = -Math.abs(lat)
    if (match[2]?.toUpperCase() === 'N') lat = Math.abs(lat)
    if (match[4]?.toUpperCase() === 'W') lng = -Math.abs(lng)
    if (match[4]?.toUpperCase() === 'E') lng = Math.abs(lng)
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null
    return [lat, lng]
  }, [])

  const jumpToCoordinates = useCallback((lat: number, lng: number, zoom: number = 17) => {
    setMarkerPos([lat, lng])
    setShowResults(false)
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([lat, lng], zoom, { animate: true })
    }
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
      // Short-circuit on raw coordinate input so "41.83225, -88.15740"
      // works without a geocode round-trip.
      const coords = parseCoordinates(trimmed)
      if (coords) {
        jumpToCoordinates(coords[0], coords[1])
        setResults([])
        toast.success(`Jumped to ${coords[0].toFixed(5)}, ${coords[1].toFixed(5)}`)
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
          toast.info('No locations found. Try a more specific query or paste raw lat, lng.')
        }
      } catch (err) {
        if ((err as Error).name === 'AbortError') return
        console.error('Geocode error:', err)
        toast.error('Search failed — try again')
      } finally {
        if (!controller.signal.aborted) setSearching(false)
      }
    },
    [getToken, parseCoordinates, jumpToCoordinates],
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

  // ── Pin (click-to-drop on the map) ───────────────────────────────────────
  const togglePinTool = useCallback(() => {
    setTool((t) => (t === 'pin' ? 'pan' : 'pin'))
    setPendingLine([])
    setCursor(null)
  }, [])

  // When a pin click is committed we need the lat/lng at that pixel. Leaflet
  // exposes containerPointToLatLng for exactly this, so we translate the
  // cursor position (relative to the capture div) into the map's own pixel
  // coordinate system and ask Leaflet to convert it.
  const handlePinDrop = useCallback((e: ReactPointerEvent<HTMLDivElement>) => {
    const map = mapInstanceRef.current
    const container = map?.getContainer()
    if (!map || !container) return
    const rect = container.getBoundingClientRect()
    const px = e.clientX - rect.left
    const py = e.clientY - rect.top
    const latlng = map.containerPointToLatLng([px, py])
    setMarkerPos([latlng.lat, latlng.lng])
    setSearchQuery(`${latlng.lat.toFixed(5)}, ${latlng.lng.toFixed(5)}`)
    setTool('pan')
    toast.success('Pin dropped')
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

  // ── Boxes (labeled annotation rectangles) ────────────────────────────────
  const addBox = useCallback(() => {
    const newBox: MapBoxOverlay = {
      id: makeId(),
      label: 'Label',
      color: selectedColor,
      x: 50 - DEFAULT_BOX_SIZE.width / 2,
      y: 50 - DEFAULT_BOX_SIZE.height / 2,
      width: DEFAULT_BOX_SIZE.width,
      height: DEFAULT_BOX_SIZE.height,
    }
    setBoxes((prev) => [...prev, newBox])
    setSelectedBoxId(newBox.id)
    setSelectedLineId(null)
  }, [selectedColor])

  const updateBox = useCallback((id: string, updates: Partial<MapBoxOverlay>) => {
    setBoxes((prev) => prev.map((b) => (b.id === id ? { ...b, ...updates } : b)))
  }, [])

  const deleteBox = useCallback((id: string) => {
    setBoxes((prev) => prev.filter((b) => b.id !== id))
    setSelectedBoxId((prev) => (prev === id ? null : prev))
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

  // Convert a pointer event into SVG viewBox coordinates (0-100 percentage
  // space) using the SVG's own screen-to-viewport transform. This is the
  // canonical SVG API — unlike percentage-of-bounding-rect, it stays
  // pixel-accurate under any combination of borders, padding, CSS
  // transforms, scroll, and preserveAspectRatio. Previously the points
  // landed a few pixels below the cursor on certain layouts.
  const pointFromEvent = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>): { x: number; y: number } | null => {
      const svg = svgRef.current
      if (!svg) return null
      const ctm = svg.getScreenCTM()
      if (!ctm) return null
      const pt = svg.createSVGPoint()
      pt.x = e.clientX
      pt.y = e.clientY
      const local = pt.matrixTransform(ctm.inverse())
      return { x: local.x, y: local.y }
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

  // Apply current palette colour to the currently-selected overlay (line or
  // box) so the palette doubles as a quick recolor tool.
  const applyColor = useCallback(
    (c: string) => {
      setSelectedColor(c)
      if (selectedLineId) updateLineColor(selectedLineId, c)
      if (selectedBoxId) updateBox(selectedBoxId, { color: c })
    },
    [selectedLineId, updateLineColor, selectedBoxId, updateBox],
  )

  // ── Save / Clear ─────────────────────────────────────────────────────────
  const handleSave = useCallback(async () => {
    if (!captureRef.current) return
    setSaving(true)
    let stage = 'start'
    try {
      // Hide editor chrome (crop outline, line handles, selection) during
      // capture so the live DOM doesn't include our drag UI when we query
      // tile positions in captureMapToDataUrl below.
      setCapturing(true)
      await new Promise((r) => setTimeout(r, 150))

      stage = 'capture'
      // Custom canvas composition — see captureMapToDataUrl() above for why
      // we don't use html-to-image. Each tile is re-fetched with an explicit
      // crossOrigin="anonymous" Image, drawn onto a fresh canvas, and then
      // the overlays are rendered in 2D-context. Guaranteed CORS-clean.
      const map = mapInstanceRef.current
      if (!map) throw new Error('Map is not ready yet')
      const fullDataUrl = await captureMapToDataUrl({
        mapInstance: map,
        lines,
        boxes,
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

      const center: MapCenter = {
        lat: map.getCenter().lat,
        lng: map.getCenter().lng,
        zoom: map.getZoom(),
      }

      const token = await getToken()
      if (!token) {
        toast.error('Please sign in again')
        return
      }
      stage = 'upload'
      const overlays: MapOverlaysData = { cropBox, lines, boxes }
      const { data: updated } = await api.events.setMap(
        event.id,
        weddingId,
        { imageDataUrl: croppedDataUrl, overlays, center, style },
        token,
      )
      toast.success('Map saved')
      onSaved(updated)
    } catch (err) {
      // Pull a readable message out of whatever we got — including bare
      // DOM Events (which stringify to "[object Event]").
      const baseMsg =
        err instanceof Error
          ? err.message
          : err && typeof err === 'object' && 'type' in err
            ? `Capture blocked (${(err as Event).type})`
            : String(err)
      console.error(`Map save error at stage "${stage}":`, err)
      toast.error(`Save failed (${stage}): ${baseMsg.slice(0, 240)}`)
    } finally {
      setCapturing(false)
      setSaving(false)
    }
  }, [event.id, weddingId, cropBox, lines, boxes, style, getToken, onSaved])

  const handleClear = useCallback(async () => {
    setClearing(true)
    try {
      const token = await getToken()
      if (!token) return
      const { data: updated } = await api.events.clearMap(event.id, weddingId, token)
      setCropBox(null)
      setLines([])
      setBoxes([])
      setSelectedLineId(null)
      setSelectedBoxId(null)
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
            placeholder="Venue, address, or coordinates (41.83225, -88.15740)"
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
        <Button type="button" size="sm" variant="outline" onClick={addBox}>
          <Square className="mr-1 h-3.5 w-3.5" />
          Add Box
        </Button>
        <Button
          type="button"
          size="sm"
          variant={tool === 'pin' ? 'default' : 'outline'}
          onClick={togglePinTool}
        >
          <MapPinned className="mr-1 h-3.5 w-3.5" />
          {tool === 'pin' ? 'Click map to drop pin' : 'Drop Pin'}
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
          if (tool === 'pan') {
            setSelectedLineId(null)
            setSelectedBoxId(null)
          }
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
          {/* The search-result marker is a cross-origin image from unpkg —
              hidden during capture so it doesn't leak into the saved PNG
              (the capture pipeline skips it anyway, but hiding it in the
              DOM also hides it behind the ongoing crop-frame preview). */}
          {markerPos && !capturing && <Marker position={markerPos} icon={DEFAULT_ICON} />}
        </MapContainer>

        {/* SVG layer for lines — above Leaflet panes via z-index 650. The
            svgRef is used by pointFromEvent() for pixel-accurate coordinate
            transforms via getScreenCTM(). */}
        <svg
          ref={svgRef}
          className="pointer-events-none absolute inset-0 h-full w-full"
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

        {/* Labeled annotation boxes — rendered below the crop frame so the
            crop frame still visually wraps around them, but above the Leaflet
            tile layers. The BoxOverlay component itself hides all handles
            and chrome while `capturing` is true so the saved PNG only shows
            the clean colored rectangle + label. */}
        {boxes.map((box) => (
          <BoxOverlay
            key={box.id}
            box={box}
            selected={selectedBoxId === box.id}
            capturing={capturing}
            containerRef={captureRef}
            onSelect={() => {
              setSelectedBoxId(box.id)
              setSelectedLineId(null)
              setSelectedColor(box.color)
            }}
            onChange={(updates) => updateBox(box.id, updates)}
            onDelete={() => deleteBox(box.id)}
          />
        ))}

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

        {/* Pin drop capture layer — only active in pin mode. Uses a
            separate layer so it can't interfere with pan/zoom or line
            drawing, and so the click always lands on something that knows
            about Leaflet. */}
        {tool === 'pin' && (
          <div
            className="absolute inset-0"
            style={{ zIndex: 700, cursor: 'crosshair' }}
            onPointerDown={(e) => {
              e.stopPropagation()
              handlePinDrop(e)
            }}
          />
        )}
      </div>

      <p className="text-muted-foreground text-xs">
        Search an address, paste coordinates like{' '}
        <code className="bg-muted rounded px-1">41.83225, -88.15740</code>, or hit Drop Pin and
        click anywhere on the map. Frame the area with the crop box, drop labeled boxes on spots
        like the ceremony or parking, and draw colored routes for how guests should walk or drive.
        Only whatever sits inside the crop frame is saved.
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

// ─────────────────────────────────────────────────────────────────────────
// Labeled annotation box: colored rectangle with centred label. When
// selected, shows resize handles, inline label editor, and a floating X.
// When `capturing` is true, ALL chrome is hidden so the saved PNG only
// shows the rectangle + text.
// ─────────────────────────────────────────────────────────────────────────

interface BoxOverlayProps {
  box: MapBoxOverlay
  selected: boolean
  capturing: boolean
  containerRef: React.RefObject<HTMLDivElement | null>
  onSelect: () => void
  onChange: (updates: Partial<MapBoxOverlay>) => void
  onDelete: () => void
}

function BoxOverlay({
  box,
  selected,
  capturing,
  containerRef,
  onSelect,
  onChange,
  onDelete,
}: BoxOverlayProps) {
  const [editingLabel, setEditingLabel] = useState(false)

  const beginDrag = useCallback(
    (
      e: ReactPointerEvent<HTMLElement>,
      mode: 'move' | 'resize-nw' | 'resize-ne' | 'resize-sw' | 'resize-se',
    ) => {
      e.stopPropagation()
      e.preventDefault()
      const startX = e.clientX
      const startY = e.clientY
      const start = { ...box }
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
          nw = clamp(start.width + dxPct, MIN_BOX_SIZE, 100 - start.x)
          nh = clamp(start.height + dyPct, MIN_BOX_SIZE, 100 - start.y)
        } else if (mode === 'resize-sw') {
          const newX = clamp(start.x + dxPct, 0, start.x + start.width - MIN_BOX_SIZE)
          nw = start.x + start.width - newX
          nx = newX
          nh = clamp(start.height + dyPct, MIN_BOX_SIZE, 100 - start.y)
        } else if (mode === 'resize-ne') {
          nw = clamp(start.width + dxPct, MIN_BOX_SIZE, 100 - start.x)
          const newY = clamp(start.y + dyPct, 0, start.y + start.height - MIN_BOX_SIZE)
          nh = start.y + start.height - newY
          ny = newY
        } else if (mode === 'resize-nw') {
          const newX = clamp(start.x + dxPct, 0, start.x + start.width - MIN_BOX_SIZE)
          const newY = clamp(start.y + dyPct, 0, start.y + start.height - MIN_BOX_SIZE)
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
    [box, onChange, containerRef],
  )

  // Scale label font size with box height so the label is always readable
  // but doesn't overflow on tiny boxes. Percentages are 0-100 of the frame,
  // so convert to a rough pixel size against the 480-tall container.
  const fontSize = Math.max(10, Math.min(18, Math.round((box.height / 100) * 480 * 0.32)))

  const handleStyle: React.CSSProperties = {
    background: '#ffffff',
    border: `1px solid ${box.color}`,
    borderRadius: 2,
  }

  return (
    <div
      className="absolute"
      style={{
        left: `${box.x}%`,
        top: `${box.y}%`,
        width: `${box.width}%`,
        height: `${box.height}%`,
        zIndex: 660,
        pointerEvents: 'auto',
      }}
      onPointerDown={(e) => {
        // Only start drag from the body, not from handles/input (which stop
        // propagation themselves)
        if (!capturing) {
          onSelect()
          beginDrag(e, 'move')
        }
      }}
      onDoubleClick={(e) => {
        e.stopPropagation()
        if (!capturing) setEditingLabel(true)
      }}
    >
      <div
        className="flex h-full w-full items-center justify-center rounded-md px-1.5 text-center"
        style={{
          backgroundColor: box.color,
          color: '#ffffff',
          cursor: capturing ? 'default' : 'move',
          boxShadow: capturing ? 'none' : '0 1px 3px rgba(0, 0, 0, 0.25)',
          border: selected && !capturing ? '2px solid #ffffff' : 'none',
          outline: selected && !capturing ? `2px solid ${box.color}` : 'none',
          fontWeight: 600,
          fontSize: `${fontSize}px`,
          lineHeight: 1.15,
          overflow: 'hidden',
          wordBreak: 'break-word',
        }}
      >
        {editingLabel && !capturing ? (
          <input
            autoFocus
            value={box.label}
            onChange={(e) => onChange({ label: e.target.value.slice(0, 80) })}
            onBlur={() => setEditingLabel(false)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === 'Escape') {
                e.preventDefault()
                setEditingLabel(false)
              }
            }}
            onPointerDown={(e) => e.stopPropagation()}
            className="w-full bg-transparent text-center text-white outline-none placeholder:text-white/70"
            style={{ fontSize: `${fontSize}px`, fontWeight: 600 }}
            placeholder="Label"
          />
        ) : (
          <span className="select-none">{box.label || ' '}</span>
        )}
      </div>

      {selected && !capturing && (
        <>
          {/* Corner resize handles */}
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

          {/* Floating delete button above the top-right corner */}
          <button
            type="button"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation()
              onDelete()
            }}
            className="absolute flex h-5 w-5 items-center justify-center rounded-full bg-white text-red-500 shadow ring-1 ring-black/10 transition hover:scale-110"
            style={{ right: -9, top: -9 }}
            aria-label="Delete box"
          >
            <X className="h-3 w-3" />
          </button>
        </>
      )}
    </div>
  )
}
