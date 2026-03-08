'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from '@clerk/nextjs'
import { motion } from 'framer-motion'
import { springSmooth, staggerContainer, fadeInUp } from '@/lib/animations'
import { useWedding } from '@/hooks/use-wedding'
import { api } from '@/lib/api'
import type { SeatingChart, Guest } from '@planfortwo/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import { Plus, Minus, RotateCcw, ArrowLeft, Trash2, GripVertical } from 'lucide-react'

const CANVAS_W = 3000
const CANVAS_H = 3000
const MIN_ZOOM = 0.15
const MAX_ZOOM = 3
const TABLE_COLOR = '#c2674a'
const TABLE_FILL = '#fdf8f6'
const SEAT_EMPTY = '#e5e7eb'

interface TableData {
  id: string
  chartId: string
  label: string
  tableType: string
  capacity: number
  posX: number
  posY: number
  rotation: number
  width: number
  height: number
  assignments: AssignmentData[]
}

interface AssignmentData {
  id: string
  tableId: string
  guestId: string | null
  guestName: string | null
  seatNumber: number | null
}

interface ChartData {
  id: string
  weddingId: string
  name: string
  status: string
  tables: TableData[]
  assignments: AssignmentData[]
}

function formatGuestName(
  assignment: AssignmentData | undefined,
  guestMap: Map<string, Guest>,
): string | null {
  if (!assignment) return null
  if (assignment.guestName) {
    const parts = assignment.guestName.trim().split(/\s+/)
    if (parts.length > 1) return `${parts[0]} ${parts[parts.length - 1]![0]}.`
    return parts[0] ?? null
  }
  if (assignment.guestId) {
    const guest = guestMap.get(assignment.guestId)
    if (guest) {
      const lastInitial = guest.lastName ? ` ${guest.lastName[0]}.` : ''
      return `${guest.firstName}${lastInitial}`
    }
  }
  return null
}

function getFullGuestName(
  assignment: AssignmentData | undefined,
  guestMap: Map<string, Guest>,
): string | null {
  if (!assignment) return null
  if (assignment.guestName) return assignment.guestName
  if (assignment.guestId) {
    const guest = guestMap.get(assignment.guestId)
    if (guest) return `${guest.firstName} ${guest.lastName ?? ''}`.trim()
  }
  return null
}

function getRoundRadius(capacity: number): number {
  return Math.max(35, 20 + capacity * 4)
}

function getSeatPositionsRound(
  capacity: number,
  cx: number,
  cy: number,
): { x: number; y: number; angle: number }[] {
  const radius = getRoundRadius(capacity)
  const nameRadius = radius + 14
  const seats: { x: number; y: number; angle: number }[] = []
  for (let i = 0; i < capacity; i++) {
    const angle = (2 * Math.PI * i) / capacity - Math.PI / 2
    seats.push({
      x: cx + nameRadius * Math.cos(angle),
      y: cy + nameRadius * Math.sin(angle),
      angle: (angle * 180) / Math.PI,
    })
  }
  return seats
}

function SeatPopover({
  x,
  y,
  assignment,
  guests,
  assignedGuestIds,
  guestMap,
  onAssign,
  onAssignCustom,
  onUnassign,
  onClose,
}: {
  x: number
  y: number
  assignment: AssignmentData | undefined
  guests: Guest[]
  assignedGuestIds: Set<string>
  guestMap: Map<string, Guest>
  onAssign: (guestId: string) => void
  onAssignCustom: (name: string) => void
  onUnassign: () => void
  onClose: () => void
}) {
  const [search, setSearch] = useState('')
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [onClose])

  const filtered = guests.filter((g) => {
    if (assignedGuestIds.has(g.id)) return false
    const name = `${g.firstName} ${g.lastName ?? ''}`.toLowerCase()
    return name.includes(search.toLowerCase())
  })

  if (assignment) {
    const fullName = getFullGuestName(assignment, guestMap) ?? 'Assigned Guest'
    return (
      <div
        ref={ref}
        style={{ left: x, top: y }}
        className="absolute z-50 w-52 rounded-lg border border-gray-200 bg-white p-3 shadow-lg"
      >
        <p className="text-sm font-medium text-gray-900">{fullName}</p>
        <button
          onClick={onUnassign}
          className="mt-2 text-xs font-medium text-red-600 hover:text-red-700"
        >
          Unassign
        </button>
      </div>
    )
  }

  return (
    <div
      ref={ref}
      style={{ left: x, top: y }}
      className="absolute z-50 w-56 rounded-lg border border-gray-200 bg-white p-2 shadow-lg"
    >
      <Input
        placeholder="Search guests or type a name..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && search.trim() && filtered.length === 0) {
            onAssignCustom(search.trim())
          }
        }}
        className="mb-2 h-8 text-xs"
        autoFocus
      />
      <div className="max-h-40 overflow-y-auto">
        {filtered.slice(0, 20).map((g) => (
          <button
            key={g.id}
            onClick={() => onAssign(g.id)}
            className="flex w-full items-center rounded px-2 py-1.5 text-left text-xs hover:bg-gray-50"
          >
            {g.firstName} {g.lastName ?? ''}
          </button>
        ))}
        {search.trim() && (
          <button
            onClick={() => onAssignCustom(search.trim())}
            className="text-wedding-600 hover:bg-wedding-50 flex w-full items-center rounded px-2 py-1.5 text-left text-xs font-medium"
          >
            + Add &quot;{search.trim()}&quot; as custom name
          </button>
        )}
      </div>
    </div>
  )
}

function RectAssignPopover({
  x,
  y,
  table,
  guests,
  assignedGuestIds,
  guestMap,
  onAssign,
  onAssignCustom,
  onUnassign,
  onClose,
}: {
  x: number
  y: number
  table: TableData
  guests: Guest[]
  assignedGuestIds: Set<string>
  guestMap: Map<string, Guest>
  onAssign: (guestId: string) => void
  onAssignCustom: (name: string) => void
  onUnassign: (assignmentId: string) => void
  onClose: () => void
}) {
  const [search, setSearch] = useState('')
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [onClose])

  const filtered = guests.filter((g) => {
    if (assignedGuestIds.has(g.id)) return false
    const name = `${g.firstName} ${g.lastName ?? ''}`.toLowerCase()
    return name.includes(search.toLowerCase())
  })

  const canAdd = table.assignments.length < table.capacity

  return (
    <div
      ref={ref}
      style={{ left: x, top: y }}
      className="absolute z-50 w-64 rounded-lg border border-gray-200 bg-white p-3 shadow-lg"
    >
      <p className="mb-2 text-xs font-semibold text-gray-700">
        {table.label} — {table.assignments.length}/{table.capacity} seated
      </p>
      {table.assignments.length > 0 && (
        <div className="mb-2 max-h-32 space-y-1 overflow-y-auto">
          {table.assignments.map((a) => {
            const name = getFullGuestName(a, guestMap) ?? 'Guest'
            return (
              <div
                key={a.id}
                className="flex items-center justify-between rounded bg-gray-50 px-2 py-1"
              >
                <span className="text-xs text-gray-700">{name}</span>
                <button
                  onClick={() => onUnassign(a.id)}
                  className="text-xs text-red-500 hover:text-red-700"
                >
                  ✕
                </button>
              </div>
            )
          })}
        </div>
      )}
      {canAdd && (
        <>
          <Input
            placeholder="Search guests..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && search.trim() && filtered.length === 0) {
                onAssignCustom(search.trim())
                setSearch('')
              }
            }}
            className="mb-1 h-7 text-xs"
            autoFocus
          />
          <div className="max-h-32 overflow-y-auto">
            {filtered.slice(0, 15).map((g) => (
              <button
                key={g.id}
                onClick={() => {
                  onAssign(g.id)
                  setSearch('')
                }}
                className="flex w-full items-center rounded px-2 py-1 text-left text-xs hover:bg-gray-50"
              >
                {g.firstName} {g.lastName ?? ''}
              </button>
            ))}
            {search.trim() && (
              <button
                onClick={() => {
                  onAssignCustom(search.trim())
                  setSearch('')
                }}
                className="text-wedding-600 hover:bg-wedding-50 flex w-full items-center rounded px-2 py-1 text-left text-xs font-medium"
              >
                + Add &quot;{search.trim()}&quot;
              </button>
            )}
          </div>
        </>
      )}
    </div>
  )
}

export default function SeatingPage() {
  const { getToken } = useAuth()
  const { data: weddingData, loading: weddingLoading } = useWedding()
  const weddingId = weddingData?.wedding.id ?? null

  const [charts, setCharts] = useState<SeatingChart[]>([])
  const [selectedChart, setSelectedChart] = useState<ChartData | null>(null)
  const [loading, setLoading] = useState(true)
  const [showNewChart, setShowNewChart] = useState(false)
  const [showAddTable, setShowAddTable] = useState(false)
  const [chartName, setChartName] = useState('')
  const [tableLabel, setTableLabel] = useState('')
  const [tableCapacity, setTableCapacity] = useState('8')
  const [tableShape, setTableShape] = useState('round')

  const [guests, setGuests] = useState<Guest[]>([])
  const [panX, setPanX] = useState(0)
  const [panY, setPanY] = useState(0)
  const [zoom, setZoom] = useState(0.6)

  const [selectedTableId, setSelectedTableId] = useState<string | null>(null)

  const [seatPopover, setSeatPopover] = useState<{
    tableId: string
    seatIndex: number
    screenX: number
    screenY: number
  } | null>(null)

  const [rectPopover, setRectPopover] = useState<{
    tableId: string
    screenX: number
    screenY: number
  } | null>(null)

  const isPanningRef = useRef(false)
  const panStartRef = useRef({ x: 0, y: 0, panX: 0, panY: 0 })
  const isDraggingTableRef = useRef(false)
  const dragTableRef = useRef<{
    id: string
    startX: number
    startY: number
    origPosX: number
    origPosY: number
  } | null>(null)
  const isResizingRef = useRef(false)
  const resizeRef = useRef<{
    tableId: string
    corner: string
    startX: number
    startY: number
    origWidth: number
    origHeight: number
    origPosX: number
    origPosY: number
  } | null>(null)
  const canvasContainerRef = useRef<HTMLDivElement>(null)
  const hasDraggedRef = useRef(false)

  const loadCharts = useCallback(async () => {
    if (!weddingId) return
    try {
      const token = await getToken()
      if (!token) return
      const { data } = await api.seatingCharts.list(weddingId, token)
      setCharts(data)
    } catch {
      toast.error('Failed to load seating charts')
    } finally {
      setLoading(false)
    }
  }, [weddingId, getToken])

  const loadChartDetail = useCallback(
    async (chartId: string) => {
      if (!weddingId) return
      try {
        const token = await getToken()
        if (!token) return
        const res = await api.seatingCharts.get(chartId, weddingId, token)
        const data = res.data as unknown as ChartData

        const assignmentsByTable = new Map<string, AssignmentData[]>()
        for (const a of data.assignments ?? []) {
          const list = assignmentsByTable.get(a.tableId) ?? []
          list.push(a)
          assignmentsByTable.set(a.tableId, list)
        }

        const tables: TableData[] = (data.tables ?? []).map((t: TableData) => ({
          ...t,
          assignments: assignmentsByTable.get(t.id) ?? [],
        }))

        setSelectedChart({ ...data, tables })
      } catch {
        toast.error('Failed to load chart details')
      }
    },
    [weddingId, getToken],
  )

  const loadGuests = useCallback(async () => {
    if (!weddingId) return
    try {
      const token = await getToken()
      if (!token) return
      const { data } = await api.guests.list(weddingId, token)
      setGuests(data)
    } catch {
      toast.error('Failed to load guests')
    }
  }, [weddingId, getToken])

  useEffect(() => {
    void loadCharts()
    void loadGuests()
  }, [loadCharts, loadGuests])

  const handleCreateChart = async () => {
    if (!weddingId || !chartName.trim()) return
    try {
      const token = await getToken()
      if (!token) return
      await api.seatingCharts.create({ weddingId, name: chartName.trim() }, token)
      toast.success('Chart created')
      setChartName('')
      setShowNewChart(false)
      void loadCharts()
    } catch {
      toast.error('Failed to create chart')
    }
  }

  const handleAddTable = async () => {
    if (!selectedChart || !tableLabel.trim()) return
    try {
      const token = await getToken()
      if (!token) return

      const existingTables = selectedChart.tables
      const col = existingTables.length % 4
      const row = Math.floor(existingTables.length / 4)
      const defaultPosX = 300 + col * 250
      const defaultPosY = 300 + row * 250

      await api.seatingCharts.addTable(
        selectedChart.id,
        selectedChart.weddingId,
        {
          chartId: selectedChart.id,
          label: tableLabel.trim(),
          tableType: tableShape,
          capacity: parseInt(tableCapacity) || 8,
          posX: defaultPosX,
          posY: defaultPosY,
        },
        token,
      )
      toast.success('Table added')
      setTableLabel('')
      setTableCapacity('8')
      setShowAddTable(false)
      void loadChartDetail(selectedChart.id)
    } catch {
      toast.error('Failed to add table')
    }
  }

  const handleDeleteChart = async (id: string) => {
    if (!weddingId) return
    try {
      const token = await getToken()
      if (!token) return
      await api.seatingCharts.delete(id, weddingId, token)
      toast.success('Chart deleted')
      if (selectedChart?.id === id) setSelectedChart(null)
      void loadCharts()
    } catch {
      toast.error('Failed to delete chart')
    }
  }

  const handleDeleteTable = async (tableId: string) => {
    if (!selectedChart || !weddingId) return
    try {
      const token = await getToken()
      if (!token) return
      await api.seatingCharts.deleteTable(tableId, weddingId, token)
      toast.success('Table removed')
      setSelectedTableId(null)
      void loadChartDetail(selectedChart.id)
    } catch {
      toast.error('Failed to delete table')
    }
  }

  const handleTableDragEnd = async (tableId: string, newX: number, newY: number) => {
    if (!weddingId) return
    try {
      const token = await getToken()
      if (!token) return
      await api.seatingCharts.updateTable(
        tableId,
        weddingId,
        { posX: Math.round(newX), posY: Math.round(newY) },
        token,
      )
    } catch {
      toast.error('Failed to move table')
    }
  }

  const handleResizeEnd = async (tableId: string, w: number, h: number, px: number, py: number) => {
    if (!weddingId) return
    try {
      const token = await getToken()
      if (!token) return
      await api.seatingCharts.updateTable(
        tableId,
        weddingId,
        { width: Math.round(w), height: Math.round(h), posX: Math.round(px), posY: Math.round(py) },
        token,
      )
    } catch {
      toast.error('Failed to resize table')
    }
  }

  const handleUpdateCapacity = async (tableId: string, delta: number) => {
    if (!selectedChart || !weddingId) return
    const table = selectedChart.tables.find((t) => t.id === tableId)
    if (!table) return
    const newCap = Math.max(1, Math.min(30, table.capacity + delta))
    if (newCap === table.capacity) return
    try {
      const token = await getToken()
      if (!token) return
      await api.seatingCharts.updateTable(tableId, weddingId, { capacity: newCap }, token)
      setSelectedChart((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          tables: prev.tables.map((t) => (t.id === tableId ? { ...t, capacity: newCap } : t)),
        }
      })
    } catch {
      toast.error('Failed to update capacity')
    }
  }

  const handleAssignGuest = async (tableId: string, guestId: string, seatNumber: number) => {
    if (!weddingId) return
    try {
      const token = await getToken()
      if (!token) return
      await api.seatingCharts.assignGuest({ tableId, guestId, seatNumber }, weddingId, token)
      toast.success('Guest seated')
      setSeatPopover(null)
      setRectPopover(null)
      void loadChartDetail(selectedChart!.id)
    } catch {
      toast.error('Failed to assign guest')
    }
  }

  const handleAssignCustom = async (tableId: string, name: string, seatNumber: number) => {
    if (!weddingId) return
    try {
      const token = await getToken()
      if (!token) return
      await api.seatingCharts.assignGuest(
        { tableId, guestName: name, seatNumber },
        weddingId,
        token,
      )
      toast.success('Seat assigned')
      setSeatPopover(null)
      setRectPopover(null)
      void loadChartDetail(selectedChart!.id)
    } catch {
      toast.error('Failed to assign seat')
    }
  }

  const handleAssignToRect = async (tableId: string, guestId: string) => {
    if (!weddingId || !selectedChart) return
    const table = selectedChart.tables.find((t) => t.id === tableId)
    if (!table) return
    const nextSeat = table.assignments.length + 1
    try {
      const token = await getToken()
      if (!token) return
      await api.seatingCharts.assignGuest(
        { tableId, guestId, seatNumber: nextSeat },
        weddingId,
        token,
      )
      toast.success('Guest seated')
      void loadChartDetail(selectedChart.id)
    } catch {
      toast.error('Failed to assign guest')
    }
  }

  const handleAssignCustomToRect = async (tableId: string, name: string) => {
    if (!weddingId || !selectedChart) return
    const table = selectedChart.tables.find((t) => t.id === tableId)
    if (!table) return
    const nextSeat = table.assignments.length + 1
    try {
      const token = await getToken()
      if (!token) return
      await api.seatingCharts.assignGuest(
        { tableId, guestName: name, seatNumber: nextSeat },
        weddingId,
        token,
      )
      toast.success('Guest assigned')
      void loadChartDetail(selectedChart.id)
    } catch {
      toast.error('Failed to assign guest')
    }
  }

  const handleUnassignSeat = async (assignmentId: string) => {
    if (!weddingId) return
    try {
      const token = await getToken()
      if (!token) return
      await api.seatingCharts.unassignSeat(assignmentId, weddingId, token)
      toast.success('Seat unassigned')
      setSeatPopover(null)
      setRectPopover(null)
      void loadChartDetail(selectedChart!.id)
    } catch {
      toast.error('Failed to unassign seat')
    }
  }

  // --- Canvas interactions ---

  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (isDraggingTableRef.current || isResizingRef.current) return
    isPanningRef.current = true
    panStartRef.current = { x: e.clientX, y: e.clientY, panX, panY }
    setSelectedTableId(null)
    setSeatPopover(null)
    setRectPopover(null)
  }

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    if (isPanningRef.current) {
      const dx = e.clientX - panStartRef.current.x
      const dy = e.clientY - panStartRef.current.y
      setPanX(panStartRef.current.panX + dx)
      setPanY(panStartRef.current.panY + dy)
    }

    if (isDraggingTableRef.current && dragTableRef.current && selectedChart) {
      hasDraggedRef.current = true
      const dx = (e.clientX - dragTableRef.current.startX) / zoom
      const dy = (e.clientY - dragTableRef.current.startY) / zoom
      const newX = Math.max(0, Math.min(CANVAS_W, dragTableRef.current.origPosX + dx))
      const newY = Math.max(0, Math.min(CANVAS_H, dragTableRef.current.origPosY + dy))
      setSelectedChart((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          tables: prev.tables.map((t) =>
            t.id === dragTableRef.current!.id ? { ...t, posX: newX, posY: newY } : t,
          ),
        }
      })
    }

    if (isResizingRef.current && resizeRef.current && selectedChart) {
      hasDraggedRef.current = true
      const r = resizeRef.current
      const dx = (e.clientX - r.startX) / zoom
      const dy = (e.clientY - r.startY) / zoom

      let newW = r.origWidth
      let newH = r.origHeight
      let newPx = r.origPosX
      let newPy = r.origPosY

      if (r.corner.includes('e')) newW = Math.max(40, r.origWidth + dx)
      if (r.corner.includes('w')) {
        newW = Math.max(40, r.origWidth - dx)
        newPx = r.origPosX + (r.origWidth - newW)
      }
      if (r.corner.includes('s')) newH = Math.max(30, r.origHeight + dy)
      if (r.corner.includes('n')) {
        newH = Math.max(30, r.origHeight - dy)
        newPy = r.origPosY + (r.origHeight - newH)
      }

      setSelectedChart((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          tables: prev.tables.map((t) =>
            t.id === r.tableId ? { ...t, width: newW, height: newH, posX: newPx, posY: newPy } : t,
          ),
        }
      })
    }
  }

  const handleCanvasMouseUp = () => {
    if (isPanningRef.current) isPanningRef.current = false

    if (isDraggingTableRef.current && dragTableRef.current && hasDraggedRef.current) {
      const table = selectedChart?.tables.find((t) => t.id === dragTableRef.current!.id)
      if (table) void handleTableDragEnd(table.id, table.posX, table.posY)
    }

    if (isResizingRef.current && resizeRef.current && hasDraggedRef.current) {
      const table = selectedChart?.tables.find((t) => t.id === resizeRef.current!.tableId)
      if (table) void handleResizeEnd(table.id, table.width, table.height, table.posX, table.posY)
    }

    isDraggingTableRef.current = false
    dragTableRef.current = null
    isResizingRef.current = false
    resizeRef.current = null
    hasDraggedRef.current = false
  }

  const handleTableMouseDown = (e: React.MouseEvent, table: TableData) => {
    e.stopPropagation()
    isDraggingTableRef.current = true
    hasDraggedRef.current = false
    dragTableRef.current = {
      id: table.id,
      startX: e.clientX,
      startY: e.clientY,
      origPosX: table.posX,
      origPosY: table.posY,
    }
    setSelectedTableId(table.id)
    setSeatPopover(null)
    setRectPopover(null)
  }

  const handleResizeMouseDown = (e: React.MouseEvent, table: TableData, corner: string) => {
    e.stopPropagation()
    isResizingRef.current = true
    hasDraggedRef.current = false
    resizeRef.current = {
      tableId: table.id,
      corner,
      startX: e.clientX,
      startY: e.clientY,
      origWidth: table.width,
      origHeight: table.height,
      origPosX: table.posX,
      origPosY: table.posY,
    }
  }

  // Wheel zoom (supports trackpad pinch + two-finger scroll)
  useEffect(() => {
    const el = canvasContainerRef.current
    if (!el) return
    const handler = (e: WheelEvent) => {
      e.preventDefault()
      // Pinch-to-zoom (ctrlKey on macOS trackpad) or regular scroll
      const isPinch = e.ctrlKey
      const sensitivity = isPinch ? 0.01 : 0.002
      const delta = -e.deltaY * sensitivity
      setZoom((z) => Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, z + delta * (isPinch ? 1 : z))))
    }
    el.addEventListener('wheel', handler, { passive: false })
    return () => el.removeEventListener('wheel', handler)
  }, [])

  const handleSeatClick = (e: React.MouseEvent, tableId: string, seatIndex: number) => {
    e.stopPropagation()
    if (hasDraggedRef.current) return
    const container = canvasContainerRef.current
    if (!container) return
    const rect = container.getBoundingClientRect()
    setSeatPopover({
      tableId,
      seatIndex,
      screenX: e.clientX - rect.left + 10,
      screenY: e.clientY - rect.top + 10,
    })
    setRectPopover(null)
  }

  const handleRectTableClick = (e: React.MouseEvent, tableId: string) => {
    e.stopPropagation()
    if (hasDraggedRef.current) return
    const container = canvasContainerRef.current
    if (!container) return
    const rect = container.getBoundingClientRect()
    setRectPopover({
      tableId,
      screenX: e.clientX - rect.left + 10,
      screenY: e.clientY - rect.top + 10,
    })
    setSeatPopover(null)
  }

  const resetView = () => {
    setPanX(0)
    setPanY(0)
    setZoom(0.6)
  }

  const guestMap = new Map(guests.map((g) => [g.id, g]))

  const assignedGuestIds = new Set<string>()
  if (selectedChart) {
    for (const table of selectedChart.tables) {
      for (const a of table.assignments) {
        if (a.guestId) assignedGuestIds.add(a.guestId)
      }
    }
  }

  const isLoading = weddingLoading || loading

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="border-wedding-200 border-t-wedding-600 h-8 w-8 animate-spin rounded-full border-4" />
      </div>
    )
  }

  const totalSeats = selectedChart?.tables.reduce((sum, t) => sum + t.capacity, 0) ?? 0
  const totalAssigned = selectedChart?.tables.reduce((sum, t) => sum + t.assignments.length, 0) ?? 0
  const isRectType = (t: string) => t === 'rectangular' || t === 'banquet' || t === 'head_table'
  const selectedTable = selectedChart?.tables.find((t) => t.id === selectedTableId)

  // --- CHART EDITOR VIEW ---
  if (selectedChart) {
    return (
      <motion.div
        className="-mx-4 -my-8 flex h-[calc(100vh-64px)] flex-col overflow-hidden sm:-mx-6 lg:-mx-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        {/* Top bar */}
        <div className="flex flex-shrink-0 items-center justify-between border-b border-gray-200 bg-white px-4 py-2">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setSelectedChart(null)
                setSelectedTableId(null)
              }}
              className="text-wedding-600 hover:text-wedding-700 flex items-center gap-1 text-sm"
            >
              <ArrowLeft className="h-4 w-4" />
              Charts
            </button>
            <h2 className="font-serif text-lg font-semibold text-gray-900">{selectedChart.name}</h2>
            <Badge
              variant={selectedChart.status === 'final' ? 'default' : 'secondary'}
              className="text-xs"
            >
              {selectedChart.status}
            </Badge>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-500">
              {totalAssigned}/{totalSeats} seated
            </span>
            <Button size="sm" variant="outline" onClick={() => setShowAddTable(true)}>
              <Plus className="mr-1 h-3 w-3" />
              Add Table
            </Button>
          </div>
        </div>

        {/* Zoom toolbar */}
        <div className="flex flex-shrink-0 items-center gap-2 border-b border-gray-100 bg-gray-50/80 px-4 py-1.5">
          <Button
            size="sm"
            variant="ghost"
            className="h-7 w-7 p-0"
            onClick={() => setZoom((z) => Math.max(MIN_ZOOM, z - 0.1))}
          >
            <Minus className="h-3 w-3" />
          </Button>
          <span className="w-12 text-center text-xs text-gray-600">{Math.round(zoom * 100)}%</span>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 w-7 p-0"
            onClick={() => setZoom((z) => Math.min(MAX_ZOOM, z + 0.1))}
          >
            <Plus className="h-3 w-3" />
          </Button>
          <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={resetView}>
            <RotateCcw className="mr-1 h-3 w-3" />
            Reset
          </Button>
          <span className="text-xs text-gray-400">Scroll to zoom · Drag to pan</span>

          {/* Selected table controls */}
          {selectedTable && (
            <div className="ml-auto flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-1">
              <span className="text-xs font-medium text-gray-700">{selectedTable.label}</span>
              <div className="mx-1 h-4 w-px bg-gray-200" />
              <span className="text-xs text-gray-500">Seats:</span>
              <Button
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0"
                onClick={() => handleUpdateCapacity(selectedTable.id, -1)}
              >
                <Minus className="h-3 w-3" />
              </Button>
              <span className="w-5 text-center text-xs font-medium">{selectedTable.capacity}</span>
              <Button
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0"
                onClick={() => handleUpdateCapacity(selectedTable.id, 1)}
              >
                <Plus className="h-3 w-3" />
              </Button>
              <div className="mx-1 h-4 w-px bg-gray-200" />
              <Button
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                onClick={() => handleDeleteTable(selectedTable.id)}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          )}
        </div>

        {/* Canvas */}
        <div
          ref={canvasContainerRef}
          className="relative flex-1 overflow-hidden bg-gray-50"
          style={{ cursor: isPanningRef.current ? 'grabbing' : 'grab' }}
          onMouseDown={handleCanvasMouseDown}
          onMouseMove={handleCanvasMouseMove}
          onMouseUp={handleCanvasMouseUp}
          onMouseLeave={handleCanvasMouseUp}
        >
          <div
            style={{
              transform: `translate(${panX}px, ${panY}px) scale(${zoom})`,
              transformOrigin: '0 0',
              width: CANVAS_W,
              height: CANVAS_H,
              position: 'relative',
            }}
          >
            <svg
              width={CANVAS_W}
              height={CANVAS_H}
              style={{ position: 'absolute', top: 0, left: 0 }}
            >
              <defs>
                <pattern id="grid" width={40} height={40} patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#e5e7eb" strokeWidth={0.5} />
                </pattern>
              </defs>
              <rect width={CANVAS_W} height={CANVAS_H} fill="url(#grid)" />

              {selectedChart.tables.map((table) => {
                const cx = table.posX
                const cy = table.posY
                const isSelected = selectedTableId === table.id
                const isRect = isRectType(table.tableType)

                if (isRect) {
                  // Rectangle/banquet/head table — no seat circles
                  const hw = table.width / 2
                  const hh = table.height / 2
                  const nameList = table.assignments
                    .map((a) => formatGuestName(a, guestMap))
                    .filter(Boolean)

                  return (
                    <g
                      key={table.id}
                      onMouseDown={(e) =>
                        handleTableMouseDown(e as unknown as React.MouseEvent, table)
                      }
                      onDoubleClick={(e) =>
                        handleRectTableClick(e as unknown as React.MouseEvent, table.id)
                      }
                      style={{ cursor: 'move' }}
                    >
                      {/* Table shape */}
                      <rect
                        x={cx - hw}
                        y={cy - hh}
                        width={table.width}
                        height={table.height}
                        rx={4}
                        fill={TABLE_FILL}
                        stroke={isSelected ? '#1e40af' : TABLE_COLOR}
                        strokeWidth={isSelected ? 2.5 : 2}
                        strokeDasharray={table.tableType === 'head_table' ? '6 3' : undefined}
                      />

                      {/* Table label */}
                      <text
                        x={cx}
                        y={cy - hh + 16}
                        textAnchor="middle"
                        fill="#374151"
                        fontSize={10}
                        fontWeight={600}
                      >
                        {table.label}
                      </text>
                      <text x={cx} y={cy - hh + 28} textAnchor="middle" fill="#9ca3af" fontSize={8}>
                        {table.assignments.length}/{table.capacity}
                      </text>

                      {/* Guest names listed inside */}
                      {nameList.map((name, i) => (
                        <text
                          key={i}
                          x={cx - hw + 8}
                          y={cy - hh + 42 + i * 13}
                          fill="#4b5563"
                          fontSize={8}
                          fontWeight={400}
                        >
                          {name}
                        </text>
                      ))}

                      {/* Double-click hint */}
                      {table.assignments.length < table.capacity && (
                        <text
                          x={cx}
                          y={cy + hh - 8}
                          textAnchor="middle"
                          fill="#c2674a"
                          fontSize={7}
                          fontStyle="italic"
                        >
                          double-click to assign
                        </text>
                      )}

                      {/* Resize handles for rectangle tables when selected */}
                      {isSelected && (
                        <>
                          {['nw', 'ne', 'sw', 'se'].map((corner) => {
                            const hx = corner.includes('w') ? cx - hw : cx + hw
                            const hy = corner.includes('n') ? cy - hh : cy + hh
                            return (
                              <rect
                                key={corner}
                                x={hx - 4}
                                y={hy - 4}
                                width={8}
                                height={8}
                                fill="white"
                                stroke="#1e40af"
                                strokeWidth={1.5}
                                rx={1}
                                style={{
                                  cursor:
                                    corner === 'nw' || corner === 'se'
                                      ? 'nwse-resize'
                                      : 'nesw-resize',
                                }}
                                onMouseDown={(e) =>
                                  handleResizeMouseDown(
                                    e as unknown as React.MouseEvent,
                                    table,
                                    corner,
                                  )
                                }
                              />
                            )
                          })}
                          {/* Edge resize handles */}
                          {['n', 's', 'e', 'w'].map((edge) => {
                            const ex = edge === 'w' ? cx - hw : edge === 'e' ? cx + hw : cx
                            const ey = edge === 'n' ? cy - hh : edge === 's' ? cy + hh : cy
                            return (
                              <rect
                                key={edge}
                                x={ex - 3}
                                y={ey - 3}
                                width={6}
                                height={6}
                                fill="white"
                                stroke="#1e40af"
                                strokeWidth={1}
                                rx={1}
                                style={{
                                  cursor: edge === 'n' || edge === 's' ? 'ns-resize' : 'ew-resize',
                                }}
                                onMouseDown={(e) =>
                                  handleResizeMouseDown(
                                    e as unknown as React.MouseEvent,
                                    table,
                                    edge,
                                  )
                                }
                              />
                            )
                          })}
                        </>
                      )}
                    </g>
                  )
                }

                // Round / sweetheart tables — names radiating outward
                const radius = getRoundRadius(table.capacity)
                const seatRadius = table.tableType === 'sweetheart' ? radius - 10 : radius
                const seats = getSeatPositionsRound(table.capacity, cx, cy)

                return (
                  <g
                    key={table.id}
                    onMouseDown={(e) =>
                      handleTableMouseDown(e as unknown as React.MouseEvent, table)
                    }
                    style={{ cursor: 'move' }}
                  >
                    {/* Table circle */}
                    <circle
                      cx={cx}
                      cy={cy}
                      r={seatRadius}
                      fill={TABLE_FILL}
                      stroke={isSelected ? '#1e40af' : TABLE_COLOR}
                      strokeWidth={isSelected ? 2.5 : 2}
                    />

                    {/* Table label + count */}
                    <text
                      x={cx}
                      y={cy - 4}
                      textAnchor="middle"
                      fill="#374151"
                      fontSize={10}
                      fontWeight={600}
                    >
                      {table.label}
                    </text>
                    <text x={cx} y={cy + 9} textAnchor="middle" fill="#9ca3af" fontSize={8}>
                      {table.assignments.length}/{table.capacity}
                    </text>

                    {/* Seat names radiating outward */}
                    {seats.map((seat, i) => {
                      const assignment = table.assignments.find((a) => a.seatNumber === i + 1)
                      const displayName = formatGuestName(assignment, guestMap)
                      const fullName = getFullGuestName(assignment, guestMap)
                      const isFilled = !!assignment

                      // Determine text rotation for readability
                      let textAngle = seat.angle
                      let anchor: 'start' | 'end' = 'start'
                      // For left half, flip to keep text readable
                      if (seat.angle > 90 || seat.angle < -90) {
                        textAngle = seat.angle + 180
                        anchor = 'end'
                      }

                      return (
                        <g
                          key={i}
                          onClick={(e) =>
                            handleSeatClick(e as unknown as React.MouseEvent, table.id, i)
                          }
                          style={{ cursor: 'pointer' }}
                        >
                          {/* Small dot marker */}
                          <circle
                            cx={seat.x}
                            cy={seat.y}
                            r={isFilled ? 2 : 3}
                            fill={isFilled ? TABLE_COLOR : SEAT_EMPTY}
                            stroke={isFilled ? TABLE_COLOR : '#9ca3af'}
                            strokeWidth={0.5}
                          />

                          {/* Name or seat number */}
                          <text
                            x={seat.x + (anchor === 'start' ? 5 : -5)}
                            y={seat.y + 3}
                            textAnchor={anchor}
                            fill={isFilled ? '#1f2937' : '#9ca3af'}
                            fontSize={7.5}
                            fontWeight={isFilled ? 500 : 400}
                            transform={`rotate(${textAngle}, ${seat.x}, ${seat.y})`}
                          >
                            {isFilled && displayName ? displayName : i + 1}
                          </text>
                          {isFilled && fullName && <title>{fullName}</title>}
                        </g>
                      )
                    })}

                    {/* Delete button */}
                    {isSelected && (
                      <g
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteTable(table.id)
                        }}
                        style={{ cursor: 'pointer' }}
                      >
                        <circle
                          cx={cx + seatRadius + 8}
                          cy={cy - seatRadius - 8}
                          r={7}
                          fill="white"
                          stroke="#ef4444"
                          strokeWidth={1}
                        />
                        <text
                          x={cx + seatRadius + 8}
                          y={cy - seatRadius - 4.5}
                          textAnchor="middle"
                          fill="#ef4444"
                          fontSize={9}
                          fontWeight={700}
                          pointerEvents="none"
                        >
                          ✕
                        </text>
                      </g>
                    )}
                  </g>
                )
              })}
            </svg>
          </div>

          {/* Popovers */}
          {seatPopover &&
            (() => {
              const table = selectedChart.tables.find((t) => t.id === seatPopover.tableId)
              if (!table) return null
              const assignment = table.assignments.find(
                (a) => a.seatNumber === seatPopover.seatIndex + 1,
              )
              return (
                <SeatPopover
                  x={seatPopover.screenX}
                  y={seatPopover.screenY}
                  assignment={assignment}
                  guests={guests}
                  assignedGuestIds={assignedGuestIds}
                  guestMap={guestMap}
                  onAssign={(guestId) =>
                    handleAssignGuest(seatPopover.tableId, guestId, seatPopover.seatIndex + 1)
                  }
                  onAssignCustom={(name) =>
                    handleAssignCustom(seatPopover.tableId, name, seatPopover.seatIndex + 1)
                  }
                  onUnassign={() => {
                    if (assignment) void handleUnassignSeat(assignment.id)
                  }}
                  onClose={() => setSeatPopover(null)}
                />
              )
            })()}

          {rectPopover &&
            (() => {
              const table = selectedChart.tables.find((t) => t.id === rectPopover.tableId)
              if (!table) return null
              return (
                <RectAssignPopover
                  x={rectPopover.screenX}
                  y={rectPopover.screenY}
                  table={table}
                  guests={guests}
                  assignedGuestIds={assignedGuestIds}
                  guestMap={guestMap}
                  onAssign={(guestId) => handleAssignToRect(rectPopover.tableId, guestId)}
                  onAssignCustom={(name) => handleAssignCustomToRect(rectPopover.tableId, name)}
                  onUnassign={(id) => void handleUnassignSeat(id)}
                  onClose={() => setRectPopover(null)}
                />
              )
            })()}
        </div>

        {/* Add Table Dialog */}
        <Dialog open={showAddTable} onOpenChange={setShowAddTable}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Table</DialogTitle>
              <DialogDescription>Configure the table shape and size.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="table-label">Table Name</Label>
                <Input
                  id="table-label"
                  value={tableLabel}
                  onChange={(e) => setTableLabel(e.target.value)}
                  placeholder="e.g., Table 1"
                />
              </div>
              <div>
                <Label htmlFor="table-shape">Shape</Label>
                <select
                  id="table-shape"
                  value={tableShape}
                  onChange={(e) => setTableShape(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                >
                  <option value="round">Round</option>
                  <option value="rectangular">Rectangular</option>
                  <option value="banquet">Banquet (Long)</option>
                  <option value="head_table">Head Table</option>
                  <option value="sweetheart">Sweetheart</option>
                </select>
              </div>
              <div>
                <Label htmlFor="table-capacity">Seats</Label>
                <Input
                  id="table-capacity"
                  type="number"
                  value={tableCapacity}
                  onChange={(e) => setTableCapacity(e.target.value)}
                  min={1}
                  max={30}
                />
              </div>

              {/* Quick presets from existing tables */}
              {selectedChart.tables.length > 0 && (
                <div>
                  <Label className="text-xs text-gray-500">Quick copy from existing</Label>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {Array.from(
                      new Map(
                        selectedChart.tables.map((t) => [
                          `${t.tableType}-${t.capacity}-${t.width}x${t.height}`,
                          t,
                        ]),
                      ).values(),
                    )
                      .slice(0, 6)
                      .map((t) => (
                        <button
                          key={t.id}
                          onClick={() => {
                            setTableShape(t.tableType)
                            setTableCapacity(String(t.capacity))
                          }}
                          className="rounded border border-gray-200 px-2 py-1 text-xs hover:bg-gray-50"
                        >
                          {t.tableType} ({t.capacity})
                        </button>
                      ))}
                  </div>
                </div>
              )}

              <Button onClick={handleAddTable} className="w-full">
                Add Table
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </motion.div>
    )
  }

  // --- CHART LIST VIEW ---
  return (
    <motion.div
      className="mx-auto w-full max-w-5xl px-4"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ...springSmooth }}
    >
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl font-bold text-gray-900">Seating Charts</h1>
          <p className="mt-1 text-sm text-gray-600">
            Plan your table arrangements and guest seating.
          </p>
        </div>
        <Button onClick={() => setShowNewChart(true)}>
          <Plus className="mr-1 h-4 w-4" />
          New Chart
        </Button>
      </div>

      {charts.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="bg-wedding-50 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full">
              <GripVertical className="text-wedding-600 h-8 w-8" />
            </div>
            <h2 className="font-serif text-xl font-semibold text-gray-900">No Seating Charts</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-gray-600">
              Create a seating chart to start planning table arrangements for your guests.
            </p>
            <Button className="mt-6" onClick={() => setShowNewChart(true)}>
              Create Your First Chart
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
          {charts.map((chart) => (
            <motion.div key={chart.id} variants={fadeInUp}>
              <Card
                className="cursor-pointer transition-shadow hover:shadow-md"
                onClick={() => loadChartDetail(chart.id)}
              >
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="truncate text-base">{chart.name}</CardTitle>
                  <Badge variant={chart.status === 'final' ? 'default' : 'secondary'}>
                    {chart.status}
                  </Badge>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-500">Click to manage tables and assignments</p>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeleteChart(chart.id)
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

      <Dialog open={showNewChart} onOpenChange={setShowNewChart}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Seating Chart</DialogTitle>
            <DialogDescription>Create a new seating arrangement for your event.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="chart-name">Chart Name</Label>
              <Input
                id="chart-name"
                value={chartName}
                onChange={(e) => setChartName(e.target.value)}
                placeholder="e.g., Reception Layout"
              />
            </div>
            <Button onClick={handleCreateChart} className="w-full">
              Create Chart
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}
