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
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import {
  Plus,
  Minus,
  RotateCcw,
  ArrowLeft,
  Trash2,
  GripVertical,
  Copy,
  Scissors,
  ClipboardPaste,
  Maximize2,
} from 'lucide-react'

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

function getEffectiveRoundRadius(table: TableData): number {
  const isRect =
    table.tableType === 'rectangular' ||
    table.tableType === 'banquet' ||
    table.tableType === 'head_table'
  if (!isRect && table.width > 0) {
    return table.width / 2
  }
  return getRoundRadius(table.capacity)
}

function getEffectiveSeatPositions(
  table: TableData,
  cx: number,
  cy: number,
): { x: number; y: number; angle: number }[] {
  const radius = getEffectiveRoundRadius(table)
  const nameRadius = radius + 22
  const seats: { x: number; y: number; angle: number }[] = []
  for (let i = 0; i < table.capacity; i++) {
    const angle = (2 * Math.PI * i) / table.capacity - Math.PI / 2
    seats.push({
      x: cx + nameRadius * Math.cos(angle),
      y: cy + nameRadius * Math.sin(angle),
      angle: (angle * 180) / Math.PI,
    })
  }
  return seats
}

function getRectSeatPositions(
  table: TableData,
  cx: number,
  cy: number,
): { x: number; y: number; angle: number }[] {
  const hw = table.width / 2
  const hh = table.height / 2
  const seatOffset = 16
  const seats: { x: number; y: number; angle: number }[] = []
  const cap = table.capacity

  // Distribute seats around the rectangle perimeter: top, right, bottom, left
  const perimeter = 2 * (table.width + table.height)
  for (let i = 0; i < cap; i++) {
    const progress = (i + 0.5) / cap
    const dist = progress * perimeter
    let sx: number, sy: number, angle: number

    if (dist < table.width) {
      // Top edge
      sx = cx - hw + dist
      sy = cy - hh - seatOffset
      angle = -90
    } else if (dist < table.width + table.height) {
      // Right edge
      const d = dist - table.width
      sx = cx + hw + seatOffset
      sy = cy - hh + d
      angle = 0
    } else if (dist < 2 * table.width + table.height) {
      // Bottom edge
      const d = dist - table.width - table.height
      sx = cx + hw - d
      sy = cy + hh + seatOffset
      angle = 90
    } else {
      // Left edge
      const d = dist - 2 * table.width - table.height
      sx = cx - hw - seatOffset
      sy = cy + hh - d
      angle = 180
    }
    seats.push({ x: sx, y: sy, angle })
  }
  return seats
}

function getNextCopyName(baseName: string, existingLabels: string[]): string {
  const base = baseName.replace(/\s*\(\d+\)$/, '')
  let maxNum = 0
  const escaped = base.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const regex = new RegExp(`^${escaped}(?:\\s*\\((\\d+)\\))?$`)
  for (const label of existingLabels) {
    const match = label.match(regex)
    if (match) {
      const num = match[1] ? parseInt(match[1]) : 0
      if (num > maxNum) maxNum = num
    }
  }
  return `${base} (${maxNum + 1})`
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
        onMouseDown={(e) => e.stopPropagation()}
        className="border-border bg-background absolute z-50 w-52 rounded-lg border p-3 shadow-lg"
      >
        <p className="text-foreground text-sm font-medium">{fullName}</p>
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
      onMouseDown={(e) => e.stopPropagation()}
      className="border-border bg-background absolute z-50 w-56 rounded-lg border p-2 shadow-lg"
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
            className="hover:bg-muted flex w-full items-center rounded px-2 py-1.5 text-left text-xs"
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
      onMouseDown={(e) => e.stopPropagation()}
      className="border-border bg-background absolute z-50 w-64 rounded-lg border p-3 shadow-lg"
    >
      <p className="text-foreground mb-2 text-xs font-semibold">
        {table.label} — {table.assignments.length}/{table.capacity} seated
      </p>
      {table.assignments.length > 0 && (
        <div className="mb-2 max-h-32 space-y-1 overflow-y-auto">
          {table.assignments.map((a) => {
            const name = getFullGuestName(a, guestMap) ?? 'Guest'
            return (
              <div
                key={a.id}
                className="bg-muted flex items-center justify-between rounded px-2 py-1"
              >
                <span className="text-foreground text-xs">{name}</span>
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
                className="hover:bg-muted flex w-full items-center rounded px-2 py-1 text-left text-xs"
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
  const [zoom, setZoom] = useState(1)

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

  const [editingTableId, setEditingTableId] = useState<string | null>(null)
  const [editingTableName, setEditingTableName] = useState('')
  const [clipboard, setClipboard] = useState<{ table: TableData; isCut: boolean } | null>(null)
  const [deleteChartConfirm, setDeleteChartConfirm] = useState<string | null>(null)
  const [deleteTableConfirm, setDeleteTableConfirm] = useState<string | null>(null)

  const loadInitialData = useCallback(async () => {
    if (!weddingId) return
    try {
      const token = await getToken()
      if (!token) return
      const [chartsRes, guestsRes] = await Promise.all([
        api.seatingCharts.list(weddingId, token),
        api.guests.list(weddingId, token, { pageSize: 200 }),
      ])
      setCharts(chartsRes.data)
      setGuests(guestsRes.data)
    } catch {
      toast.error('Failed to load seating data')
    } finally {
      setLoading(false)
    }
  }, [weddingId, getToken])

  const loadCharts = useCallback(async () => {
    if (!weddingId) return
    try {
      const token = await getToken()
      if (!token) return
      const { data } = await api.seatingCharts.list(weddingId, token)
      setCharts(data)
    } catch {
      toast.error('Failed to load seating charts')
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

  useEffect(() => {
    void loadInitialData()
  }, [loadInitialData])

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
      if (selectedChart) void loadChartDetail(selectedChart.id)
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
      if (selectedChart) void loadChartDetail(selectedChart.id)
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
      if (selectedChart) void loadChartDetail(selectedChart.id)
    } catch {
      toast.error('Failed to unassign seat')
    }
  }

  // --- Table rename ---
  const handleRenameTable = async (tableId: string, newLabel: string) => {
    if (!weddingId || !newLabel.trim()) return
    const trimmed = newLabel.trim()
    try {
      const token = await getToken()
      if (!token) return
      await api.seatingCharts.updateTable(tableId, weddingId, { label: trimmed }, token)
      setSelectedChart((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          tables: prev.tables.map((t) => (t.id === tableId ? { ...t, label: trimmed } : t)),
        }
      })
      toast.success('Table renamed')
    } catch {
      toast.error('Failed to rename table')
    }
    setEditingTableId(null)
    setEditingTableName('')
  }

  const handleStartRename = (table: TableData) => {
    setEditingTableId(table.id)
    setEditingTableName(table.label)
  }

  // --- Copy / Cut / Paste ---
  const handleCopyTable = useCallback(() => {
    if (!selectedTableId || !selectedChart) return
    const table = selectedChart.tables.find((t) => t.id === selectedTableId)
    if (!table) return
    setClipboard({ table, isCut: false })
    pasteCountRef.current = 0
    toast.success('Table copied')
  }, [selectedChart, selectedTableId])

  const handleCutTable = useCallback(() => {
    if (!selectedTableId || !selectedChart) return
    const table = selectedChart.tables.find((t) => t.id === selectedTableId)
    if (!table) return
    setClipboard({ table, isCut: true })
    pasteCountRef.current = 0
    toast.success('Table cut')
  }, [selectedChart, selectedTableId])

  const pasteCountRef = useRef(0)

  const handlePasteTable = useCallback(async () => {
    if (!clipboard || !selectedChart || !weddingId) return
    const { table: src, isCut } = clipboard
    const existingLabels = selectedChart.tables.map((t) => t.label)
    const newLabel = isCut ? src.label : getNextCopyName(src.label, existingLabels)

    // Cut: paste at center of visible area. Copy: offset by 60px per paste.
    pasteCountRef.current += 1
    let newPosX: number
    let newPosY: number
    if (isCut && canvasContainerRef.current) {
      const cw = canvasContainerRef.current.clientWidth
      const ch = canvasContainerRef.current.clientHeight
      newPosX = Math.round((cw / 2 - panX) / zoom)
      newPosY = Math.round((ch / 2 - panY) / zoom)
    } else {
      const offset = 60 * pasteCountRef.current
      newPosX = Math.round(src.posX + offset)
      newPosY = Math.round(src.posY + offset)
    }

    try {
      const token = await getToken()
      if (!token) return

      await api.seatingCharts.addTable(
        selectedChart.id,
        selectedChart.weddingId,
        {
          chartId: selectedChart.id,
          label: newLabel,
          tableType: src.tableType,
          capacity: src.capacity,
          posX: newPosX,
          posY: newPosY,
          width: src.width,
          height: src.height,
        },
        token,
      )

      if (isCut) {
        await api.seatingCharts.deleteTable(src.id, weddingId, token)
        setClipboard(null)
        pasteCountRef.current = 0
      } else {
        // Optimistically add table to local state so next paste sees the new label
        setSelectedChart((prev) => {
          if (!prev) return prev
          return {
            ...prev,
            tables: [
              ...prev.tables,
              {
                id: `temp-${Date.now()}`,
                chartId: prev.id,
                label: newLabel,
                tableType: src.tableType,
                capacity: src.capacity,
                posX: newPosX,
                posY: newPosY,
                rotation: 0,
                width: src.width,
                height: src.height,
                assignments: [],
              },
            ],
          }
        })
      }

      toast.success(isCut ? 'Table moved' : 'Table pasted')
      void loadChartDetail(selectedChart.id)
    } catch {
      toast.error('Failed to paste table')
    }
  }, [clipboard, getToken, loadChartDetail, panX, panY, selectedChart, weddingId, zoom])

  // --- Round table resize ---
  const handleResizeRoundTable = async (tableId: string, delta: number) => {
    if (!selectedChart || !weddingId) return
    const table = selectedChart.tables.find((t) => t.id === tableId)
    if (!table) return
    const currentRadius = getEffectiveRoundRadius(table)
    const newRadius = Math.max(25, Math.min(200, currentRadius + delta))
    const newWidth = Math.round(newRadius * 2)
    try {
      const token = await getToken()
      if (!token) return
      await api.seatingCharts.updateTable(tableId, weddingId, { width: newWidth }, token)
      setSelectedChart((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          tables: prev.tables.map((t) => (t.id === tableId ? { ...t, width: newWidth } : t)),
        }
      })
    } catch {
      toast.error('Failed to resize table')
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
            t.id === dragTableRef.current?.id ? { ...t, posX: newX, posY: newY } : t,
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
      const table = selectedChart?.tables.find((t) => t.id === dragTableRef.current?.id)
      if (table) void handleTableDragEnd(table.id, table.posX, table.posY)
    }

    if (isResizingRef.current && resizeRef.current && hasDraggedRef.current) {
      const table = selectedChart?.tables.find((t) => t.id === resizeRef.current?.tableId)
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

  // Keyboard shortcuts for copy/cut/paste/delete
  useEffect(() => {
    if (!selectedChart) return
    const handler = (e: KeyboardEvent) => {
      // Don't intercept when editing a table name
      if (editingTableId) return
      const isMeta = e.metaKey || e.ctrlKey
      if (isMeta && e.key === 'c') {
        if (selectedTableId) {
          e.preventDefault()
          handleCopyTable()
        }
      } else if (isMeta && e.key === 'x') {
        if (selectedTableId) {
          e.preventDefault()
          handleCutTable()
        }
      } else if (isMeta && e.key === 'v') {
        if (clipboard) {
          e.preventDefault()
          void handlePasteTable()
        }
      } else if (e.key === 'Escape') {
        setSelectedTableId(null)
        setSeatPopover(null)
        setRectPopover(null)
        setEditingTableId(null)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [
    clipboard,
    editingTableId,
    handleCopyTable,
    handleCutTable,
    handlePasteTable,
    selectedChart,
    selectedTableId,
  ])

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

  const resetView = () => {
    setPanX(0)
    setPanY(0)
    setZoom(1)
  }

  const zoomToFit = () => {
    if (!selectedChart || selectedChart.tables.length === 0 || !canvasContainerRef.current) return
    const container = canvasContainerRef.current
    const cw = container.clientWidth
    const ch = container.clientHeight

    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity
    for (const table of selectedChart.tables) {
      const isRect = isRectType(table.tableType)
      const margin = isRect
        ? Math.max(table.width, table.height) / 2 + 40
        : getEffectiveRoundRadius(table) + 60
      minX = Math.min(minX, table.posX - margin)
      minY = Math.min(minY, table.posY - margin)
      maxX = Math.max(maxX, table.posX + margin)
      maxY = Math.max(maxY, table.posY + margin)
    }

    const contentW = maxX - minX
    const contentH = maxY - minY
    if (contentW <= 0 || contentH <= 0) return

    const padding = 40
    const scaleX = (cw - padding * 2) / contentW
    const scaleY = (ch - padding * 2) / contentH
    const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, Math.min(scaleX, scaleY)))

    const centerX = (minX + maxX) / 2
    const centerY = (minY + maxY) / 2
    setPanX(cw / 2 - centerX * newZoom)
    setPanY(ch / 2 - centerY * newZoom)
    setZoom(newZoom)
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
        <div className="border-border bg-background flex flex-shrink-0 items-center justify-between border-b px-4 py-2">
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
            <h2 className="text-foreground font-serif text-lg font-semibold">
              {selectedChart.name}
            </h2>
            <Badge
              variant={selectedChart.status === 'final' ? 'default' : 'secondary'}
              className="text-xs"
            >
              {selectedChart.status}
            </Badge>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-muted-foreground text-xs">
              {totalAssigned}/{totalSeats} seated
            </span>
            <Button size="sm" variant="outline" onClick={() => setShowAddTable(true)}>
              <Plus className="mr-1 h-3 w-3" />
              Add Table
            </Button>
          </div>
        </div>

        {/* Zoom toolbar */}
        <div className="border-border bg-muted/80 flex flex-shrink-0 items-center gap-2 border-b px-4 py-1.5">
          <Button
            size="sm"
            variant="ghost"
            className="h-7 w-7 p-0"
            onClick={() => setZoom((z) => Math.max(MIN_ZOOM, z - 0.1))}
          >
            <Minus className="h-3 w-3" />
          </Button>
          <span className="text-muted-foreground w-12 text-center text-xs">
            {Math.round(zoom * 100)}%
          </span>
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
          <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={zoomToFit}>
            <Maximize2 className="mr-1 h-3 w-3" />
            Fit
          </Button>
          <span className="text-muted-foreground text-xs">Scroll to zoom · Drag to pan</span>

          {/* Selected table controls */}
          {selectedTable && (
            <div className="border-border bg-background ml-auto flex items-center gap-2 rounded-lg border px-3 py-1">
              <span className="text-foreground text-xs font-medium">{selectedTable.label}</span>
              <div className="bg-muted mx-1 h-4 w-px" />

              {/* Seats control */}
              <span className="text-muted-foreground text-xs">Seats:</span>
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

              {/* Size control for round tables */}
              {!isRectType(selectedTable.tableType) && (
                <>
                  <div className="bg-muted mx-1 h-4 w-px" />
                  <span className="text-muted-foreground text-xs">Size:</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0"
                    onClick={() => handleResizeRoundTable(selectedTable.id, -10)}
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0"
                    onClick={() => handleResizeRoundTable(selectedTable.id, 10)}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </>
              )}

              <div className="bg-muted mx-1 h-4 w-px" />

              {/* Copy / Cut / Paste */}
              <Button
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0"
                onClick={handleCopyTable}
                title="Copy table (Ctrl+C)"
              >
                <Copy className="h-3 w-3" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0"
                onClick={handleCutTable}
                title="Cut table (Ctrl+X)"
              >
                <Scissors className="h-3 w-3" />
              </Button>

              <div className="bg-muted mx-1 h-4 w-px" />
              <Button
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                onClick={() => setDeleteTableConfirm(selectedTable.id)}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          )}

          {/* Paste button (when clipboard has content) */}
          {clipboard && (
            <Button
              size="sm"
              variant="outline"
              className="ml-2 h-7 text-xs"
              onClick={() => void handlePasteTable()}
            >
              <ClipboardPaste className="mr-1 h-3 w-3" />
              Paste {clipboard.isCut ? '(cut)' : '(copy)'}
            </Button>
          )}
        </div>

        {/* Canvas */}
        <div
          ref={canvasContainerRef}
          className="relative flex-1 overflow-hidden bg-muted"
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
                  // Rectangle/banquet/head table — with seat circles around perimeter
                  const hw = table.width / 2
                  const hh = table.height / 2
                  const rectSeats = getRectSeatPositions(table, cx, cy)

                  return (
                    <g
                      key={table.id}
                      onMouseDown={(e) =>
                        handleTableMouseDown(e as unknown as React.MouseEvent, table)
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

                      {/* Table label — double-click to rename */}
                      {editingTableId === table.id ? (
                        <foreignObject x={cx - 50} y={cy - hh + 4} width={100} height={22}>
                          <input
                            type="text"
                            value={editingTableName}
                            onChange={(e) => setEditingTableName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                void handleRenameTable(table.id, editingTableName)
                              } else if (e.key === 'Escape') {
                                setEditingTableId(null)
                                setEditingTableName('')
                              }
                            }}
                            onBlur={() => void handleRenameTable(table.id, editingTableName)}
                            autoFocus
                            style={{
                              width: '100%',
                              height: '100%',
                              textAlign: 'center',
                              fontSize: '10px',
                              fontWeight: 600,
                              border: '1px solid #1e40af',
                              borderRadius: '3px',
                              outline: 'none',
                              background: 'white',
                              padding: '0 4px',
                            }}
                            onMouseDown={(e) => e.stopPropagation()}
                          />
                        </foreignObject>
                      ) : (
                        <text
                          x={cx}
                          y={cy - 4}
                          textAnchor="middle"
                          fill="#374151"
                          fontSize={10}
                          fontWeight={600}
                          style={{ cursor: 'text' }}
                          onDoubleClick={(e) => {
                            e.stopPropagation()
                            handleStartRename(table)
                          }}
                        >
                          {table.label}
                        </text>
                      )}
                      <text x={cx} y={cy + 9} textAnchor="middle" fill="#9ca3af" fontSize={8}>
                        {table.assignments.length}/{table.capacity}
                      </text>

                      {/* Seat circles around perimeter */}
                      {rectSeats.map((seat, i) => {
                        const assignment = table.assignments.find((a) => a.seatNumber === i + 1)
                        const displayName = formatGuestName(assignment, guestMap)
                        const fullName = getFullGuestName(assignment, guestMap)
                        const isFilled = !!assignment

                        return (
                          <g
                            key={i}
                            onClick={(e) =>
                              handleSeatClick(e as unknown as React.MouseEvent, table.id, i)
                            }
                            style={{ cursor: 'pointer' }}
                          >
                            <circle
                              cx={seat.x}
                              cy={seat.y}
                              r={18}
                              fill="transparent"
                              stroke="none"
                            />
                            <circle
                              cx={seat.x}
                              cy={seat.y}
                              r={isFilled ? 8 : 9}
                              fill={isFilled ? TABLE_COLOR : SEAT_EMPTY}
                              stroke={isFilled ? TABLE_COLOR : '#9ca3af'}
                              strokeWidth={1.5}
                            />
                            {isFilled && displayName && (
                              <text
                                x={seat.x}
                                y={seat.y - 13}
                                textAnchor="middle"
                                fill="#1f2937"
                                fontSize={8}
                                fontWeight={600}
                              >
                                {displayName}
                              </text>
                            )}
                            {isFilled && fullName && <title>{fullName}</title>}
                          </g>
                        )
                      })}

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
                const radius = getEffectiveRoundRadius(table)
                const seatRadius = table.tableType === 'sweetheart' ? radius - 10 : radius
                const seats = getEffectiveSeatPositions(table, cx, cy)
                const isEditingThis = editingTableId === table.id

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

                    {/* Table label + count — double-click to rename */}
                    {isEditingThis ? (
                      <foreignObject x={cx - 50} y={cy - 18} width={100} height={24}>
                        <input
                          type="text"
                          value={editingTableName}
                          onChange={(e) => setEditingTableName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              void handleRenameTable(table.id, editingTableName)
                            } else if (e.key === 'Escape') {
                              setEditingTableId(null)
                              setEditingTableName('')
                            }
                          }}
                          onBlur={() => void handleRenameTable(table.id, editingTableName)}
                          autoFocus
                          style={{
                            width: '100%',
                            height: '100%',
                            textAlign: 'center',
                            fontSize: '11px',
                            fontWeight: 600,
                            border: '1px solid #1e40af',
                            borderRadius: '3px',
                            outline: 'none',
                            background: 'white',
                            padding: '0 4px',
                          }}
                          onMouseDown={(e) => e.stopPropagation()}
                        />
                      </foreignObject>
                    ) : (
                      <text
                        x={cx}
                        y={cy - 4}
                        textAnchor="middle"
                        fill="#374151"
                        fontSize={12}
                        fontWeight={600}
                        style={{ cursor: 'text' }}
                        onDoubleClick={(e) => {
                          e.stopPropagation()
                          handleStartRename(table)
                        }}
                      >
                        {table.label}
                      </text>
                    )}
                    <text x={cx} y={cy + 11} textAnchor="middle" fill="#9ca3af" fontSize={9}>
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
                          {/* Invisible larger hit target for easier clicking */}
                          <circle cx={seat.x} cy={seat.y} r={18} fill="transparent" stroke="none" />

                          {/* Visible dot marker */}
                          <circle
                            cx={seat.x}
                            cy={seat.y}
                            r={isFilled ? 10 : 11}
                            fill={isFilled ? TABLE_COLOR : SEAT_EMPTY}
                            stroke={isFilled ? TABLE_COLOR : '#9ca3af'}
                            strokeWidth={1.5}
                          />

                          {/* Name or seat number */}
                          <text
                            x={seat.x + (anchor === 'start' ? 16 : -16)}
                            y={seat.y + 3.5}
                            textAnchor={anchor}
                            fill={isFilled ? '#1f2937' : '#6b7280'}
                            fontSize={11}
                            fontWeight={isFilled ? 600 : 400}
                            transform={`rotate(${textAngle}, ${seat.x}, ${seat.y})`}
                          >
                            {isFilled && displayName ? displayName : ''}
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
                          setDeleteTableConfirm(table.id)
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

        {/* Delete table confirmation */}
        <ConfirmDialog
          open={!!deleteTableConfirm}
          onOpenChange={(open) => !open && setDeleteTableConfirm(null)}
          title="Remove Table"
          description="This will remove this table and unassign all seated guests. This cannot be undone."
          confirmLabel="Remove Table"
          variant="danger"
          onConfirm={() => {
            if (deleteTableConfirm) void handleDeleteTable(deleteTableConfirm)
            setDeleteTableConfirm(null)
          }}
        />

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
                  className="border-border w-full rounded-lg border px-3 py-2 text-sm"
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
                  <Label className="text-muted-foreground text-xs">Quick copy from existing</Label>
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
                          className="border-border hover:bg-muted rounded border px-2 py-1 text-xs"
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
          <h1 className="text-foreground font-serif text-3xl font-bold">Seating Charts</h1>
          <p className="text-muted-foreground mt-1 text-sm">
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
            <h2 className="text-foreground font-serif text-xl font-semibold">No Seating Charts</h2>
            <p className="text-muted-foreground mx-auto mt-2 max-w-md text-sm">
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
                  <p className="text-muted-foreground text-sm">
                    Click to manage tables and assignments
                  </p>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setDeleteChartConfirm(chart.id)
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

      {/* Delete chart confirmation */}
      <ConfirmDialog
        open={!!deleteChartConfirm}
        onOpenChange={(open) => !open && setDeleteChartConfirm(null)}
        title="Delete Seating Chart"
        description="This will permanently delete this seating chart and all its tables and assignments. This cannot be undone."
        confirmLabel="Delete Chart"
        variant="danger"
        onConfirm={() => {
          if (deleteChartConfirm) void handleDeleteChart(deleteChartConfirm)
          setDeleteChartConfirm(null)
        }}
      />
    </motion.div>
  )
}
