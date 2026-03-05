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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

const CANVAS_W = 2000
const CANVAS_H = 2000
const MIN_ZOOM = 0.25
const MAX_ZOOM = 2
const ZOOM_STEP = 0.1
const TABLE_COLOR = '#c2674a'
const SEAT_EMPTY = '#d1d5db'

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
  guestId: string
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

function getSeatPositions(
  tableType: string,
  capacity: number,
  cx: number,
  cy: number,
): { x: number; y: number }[] {
  const seats: { x: number; y: number }[] = []

  if (tableType === 'round' || tableType === 'sweetheart') {
    const radius = tableType === 'sweetheart' ? 45 : 55
    for (let i = 0; i < capacity; i++) {
      const angle = (2 * Math.PI * i) / capacity - Math.PI / 2
      seats.push({
        x: cx + radius * Math.cos(angle),
        y: cy + radius * Math.sin(angle),
      })
    }
  } else {
    const hw = tableType === 'banquet' ? 70 : 50
    const hh = tableType === 'banquet' ? 30 : 40
    const perimeter = 2 * (hw + hh)
    const spacing = perimeter / capacity

    for (let i = 0; i < capacity; i++) {
      let d = i * spacing
      let sx: number, sy: number
      if (d < hw) {
        sx = cx - hw / 2 + d
        sy = cy - hh - 10
      } else if (d < hw + hh) {
        d -= hw
        sx = cx + hw / 2 + 10
        sy = cy - hh / 2 + d
      } else if (d < 2 * hw + hh) {
        d -= hw + hh
        sx = cx + hw / 2 - d
        sy = cy + hh + 10
      } else {
        d -= 2 * hw + hh
        sx = cx - hw / 2 - 10
        sy = cy + hh / 2 - d
      }
      seats.push({ x: sx, y: sy })
    }
  }

  return seats
}

function renderTableShape(tableType: string, cx: number, cy: number) {
  switch (tableType) {
    case 'round':
      return (
        <circle cx={cx} cy={cy} r={40} fill="#fdf8f6" stroke={TABLE_COLOR} strokeWidth={2} />
      )
    case 'sweetheart':
      return (
        <circle cx={cx} cy={cy} r={30} fill="#fdf8f6" stroke={TABLE_COLOR} strokeWidth={2} />
      )
    case 'rectangular':
    case 'banquet':
      return (
        <rect
          x={cx - (tableType === 'banquet' ? 60 : 40)}
          y={cy - (tableType === 'banquet' ? 22 : 30)}
          width={tableType === 'banquet' ? 120 : 80}
          height={tableType === 'banquet' ? 44 : 60}
          rx={6}
          fill="#fdf8f6"
          stroke={TABLE_COLOR}
          strokeWidth={2}
        />
      )
    case 'head_table':
      return (
        <rect
          x={cx - 60}
          y={cy - 20}
          width={120}
          height={40}
          rx={6}
          fill="#fdf8f6"
          stroke={TABLE_COLOR}
          strokeWidth={2.5}
        />
      )
    default:
      return (
        <circle cx={cx} cy={cy} r={40} fill="#fdf8f6" stroke={TABLE_COLOR} strokeWidth={2} />
      )
  }
}

function SeatPopover({
  x,
  y,
  assignment,
  guests,
  assignedGuestIds,
  guestMap,
  onAssign,
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
  onUnassign: () => void
  onClose: () => void
}) {
  const [search, setSearch] = useState('')
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose()
      }
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
    const guest = guestMap.get(assignment.guestId)
    return (
      <div
        ref={ref}
        style={{ left: x, top: y }}
        className="absolute z-50 w-52 rounded-lg border border-gray-200 bg-white p-3 shadow-lg"
      >
        <p className="text-sm font-medium text-gray-900">
          {guest ? `${guest.firstName} ${guest.lastName ?? ''}` : 'Assigned Guest'}
        </p>
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
        placeholder="Search guests..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="mb-2 h-8 text-xs"
        autoFocus
      />
      <div className="max-h-40 overflow-y-auto">
        {filtered.length === 0 ? (
          <p className="py-2 text-center text-xs text-gray-400">No available guests</p>
        ) : (
          filtered.slice(0, 20).map((g) => (
            <button
              key={g.id}
              onClick={() => onAssign(g.id)}
              className="flex w-full items-center rounded px-2 py-1.5 text-left text-xs hover:bg-gray-50"
            >
              {g.firstName} {g.lastName ?? ''}
            </button>
          ))
        )}
      </div>
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
  const [zoom, setZoom] = useState(0.8)

  const [seatPopover, setSeatPopover] = useState<{
    tableId: string
    seatIndex: number
    screenX: number
    screenY: number
  } | null>(null)

  const isPanningRef = useRef(false)
  const panStartRef = useRef({ x: 0, y: 0, panX: 0, panY: 0 })
  const isDraggingTableRef = useRef(false)
  const dragTableRef = useRef<{ id: string; startX: number; startY: number; origPosX: number; origPosY: number } | null>(null)
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
      /* silent */
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
        /* silent */
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
      /* silent */
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
      setChartName('')
      setShowNewChart(false)
      void loadCharts()
    } catch {
      /* silent */
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
      const defaultPosX = 200 + col * 200
      const defaultPosY = 200 + row * 200

      await api.seatingCharts.addTable(
        selectedChart.id,
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
      setTableLabel('')
      setTableCapacity('8')
      setShowAddTable(false)
      void loadChartDetail(selectedChart.id)
    } catch {
      /* silent */
    }
  }

  const handleDeleteChart = async (id: string) => {
    if (!weddingId) return
    try {
      const token = await getToken()
      if (!token) return
      await api.seatingCharts.delete(id, weddingId, token)
      if (selectedChart?.id === id) setSelectedChart(null)
      void loadCharts()
    } catch {
      /* silent */
    }
  }

  const handleDeleteTable = async (tableId: string) => {
    if (!selectedChart || !weddingId) return
    try {
      const token = await getToken()
      if (!token) return
      await api.seatingCharts.deleteTable(tableId, weddingId, token)
      void loadChartDetail(selectedChart.id)
    } catch {
      /* silent */
    }
  }

  const handleTableDragEnd = async (tableId: string, newX: number, newY: number) => {
    if (!weddingId) return
    try {
      const token = await getToken()
      if (!token) return
      await api.seatingCharts.updateTable(tableId, weddingId, {
        posX: Math.round(newX),
        posY: Math.round(newY),
      }, token)
    } catch {
      /* silent */
    }
  }

  const handleAssignGuest = async (tableId: string, guestId: string, seatNumber: number) => {
    if (!weddingId) return
    try {
      const token = await getToken()
      if (!token) return
      await api.seatingCharts.assignGuest(
        { tableId, guestId, seatNumber },
        weddingId,
        token,
      )
      setSeatPopover(null)
      void loadChartDetail(selectedChart!.id)
    } catch {
      /* silent */
    }
  }

  const handleUnassignGuest = async (guestId: string) => {
    if (!weddingId) return
    try {
      const token = await getToken()
      if (!token) return
      await api.seatingCharts.unassignGuest(guestId, weddingId, token)
      setSeatPopover(null)
      void loadChartDetail(selectedChart!.id)
    } catch {
      /* silent */
    }
  }

  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (isDraggingTableRef.current) return
    isPanningRef.current = true
    panStartRef.current = { x: e.clientX, y: e.clientY, panX, panY }
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
  }

  const handleCanvasMouseUp = () => {
    if (isPanningRef.current) {
      isPanningRef.current = false
    }

    if (isDraggingTableRef.current && dragTableRef.current && hasDraggedRef.current) {
      const table = selectedChart?.tables.find((t) => t.id === dragTableRef.current!.id)
      if (table) {
        void handleTableDragEnd(table.id, table.posX, table.posY)
      }
    }
    isDraggingTableRef.current = false
    dragTableRef.current = null
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
  }

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP
    setZoom((z) => Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, z + delta)))
  }

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
  }

  const resetView = () => {
    setPanX(0)
    setPanY(0)
    setZoom(0.8)
  }

  const guestMap = new Map(guests.map((g) => [g.id, g]))

  const assignedGuestIds = new Set<string>()
  if (selectedChart) {
    for (const table of selectedChart.tables) {
      for (const a of table.assignments) {
        assignedGuestIds.add(a.guestId)
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

  return (
    <motion.div
      className="mx-auto max-w-7xl"
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
        <Button onClick={() => setShowNewChart(true)}>New Chart</Button>
      </div>

      {selectedChart ? (
        <div>
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSelectedChart(null)}
                className="text-wedding-600 hover:text-wedding-700 text-sm"
              >
                &larr; Back to Charts
              </button>
              <h2 className="font-serif text-xl font-semibold text-gray-900">
                {selectedChart.name}
              </h2>
              <Badge variant={selectedChart.status === 'final' ? 'default' : 'secondary'}>
                {selectedChart.status}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">
                {totalAssigned} / {totalSeats} seated
              </span>
              <Button size="sm" variant="outline" onClick={() => setShowAddTable(true)}>
                Add Table
              </Button>
            </div>
          </div>

          <div className="mb-3 flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setZoom((z) => Math.max(MIN_ZOOM, z - ZOOM_STEP))}
            >
              -
            </Button>
            <span className="w-14 text-center text-xs text-gray-600">
              {Math.round(zoom * 100)}%
            </span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setZoom((z) => Math.min(MAX_ZOOM, z + ZOOM_STEP))}
            >
              +
            </Button>
            <Button size="sm" variant="ghost" onClick={resetView}>
              Reset View
            </Button>
          </div>

          <div
            ref={canvasContainerRef}
            className="relative overflow-hidden rounded-xl border-2 border-gray-200 bg-gray-50"
            style={{ height: 'calc(100vh - 260px)', cursor: isPanningRef.current ? 'grabbing' : 'grab' }}
            onMouseDown={handleCanvasMouseDown}
            onMouseMove={handleCanvasMouseMove}
            onMouseUp={handleCanvasMouseUp}
            onMouseLeave={handleCanvasMouseUp}
            onWheel={handleWheel}
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
                  <pattern
                    id="grid"
                    width={40}
                    height={40}
                    patternUnits="userSpaceOnUse"
                  >
                    <path
                      d="M 40 0 L 0 0 0 40"
                      fill="none"
                      stroke="#e5e7eb"
                      strokeWidth={0.5}
                    />
                  </pattern>
                </defs>
                <rect width={CANVAS_W} height={CANVAS_H} fill="url(#grid)" />

                {selectedChart.tables.map((table) => {
                  const cx = table.posX
                  const cy = table.posY
                  const seats = getSeatPositions(table.tableType, table.capacity, cx, cy)

                  return (
                    <g
                      key={table.id}
                      onMouseDown={(e) => handleTableMouseDown(e as unknown as React.MouseEvent, table)}
                      style={{ cursor: 'move' }}
                    >
                      {renderTableShape(table.tableType, cx, cy)}

                      <text
                        x={cx}
                        y={cy - 4}
                        textAnchor="middle"
                        fill="#374151"
                        fontSize={11}
                        fontWeight={600}
                      >
                        {table.label}
                      </text>
                      <text
                        x={cx}
                        y={cy + 10}
                        textAnchor="middle"
                        fill="#9ca3af"
                        fontSize={9}
                      >
                        {table.assignments.length}/{table.capacity}
                      </text>

                      {seats.map((seat, i) => {
                        const assignment = table.assignments.find((a) => a.seatNumber === i + 1)
                        const isFilled = !!assignment
                        const guest = isFilled ? guestMap.get(assignment.guestId) : undefined
                        return (
                          <g
                            key={i}
                            onClick={(e) => handleSeatClick(e as unknown as React.MouseEvent, table.id, i)}
                            style={{ cursor: 'pointer' }}
                          >
                            <circle
                              cx={seat.x}
                              cy={seat.y}
                              r={9}
                              fill={isFilled ? TABLE_COLOR : SEAT_EMPTY}
                              stroke={isFilled ? '#a0522d' : '#9ca3af'}
                              strokeWidth={1.5}
                            />
                            {isFilled && guest && (
                              <title>{guest.firstName} {guest.lastName ?? ''}</title>
                            )}
                            <text
                              x={seat.x}
                              y={seat.y + 3}
                              textAnchor="middle"
                              fill="white"
                              fontSize={7}
                              fontWeight={500}
                              pointerEvents="none"
                            >
                              {isFilled && guest
                                ? guest.firstName.charAt(0) + (guest.lastName?.charAt(0) ?? '')
                                : i + 1}
                            </text>
                          </g>
                        )
                      })}

                      <g
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteTable(table.id)
                        }}
                        style={{ cursor: 'pointer' }}
                      >
                        <circle
                          cx={cx + (table.tableType === 'banquet' || table.tableType === 'head_table' ? 60 : 40) + 5}
                          cy={cy - (table.tableType === 'rectangular' ? 30 : table.tableType === 'banquet' || table.tableType === 'head_table' ? 20 : 40) - 5}
                          r={8}
                          fill="white"
                          stroke="#ef4444"
                          strokeWidth={1}
                        />
                        <text
                          x={cx + (table.tableType === 'banquet' || table.tableType === 'head_table' ? 60 : 40) + 5}
                          y={cy - (table.tableType === 'rectangular' ? 30 : table.tableType === 'banquet' || table.tableType === 'head_table' ? 20 : 40) - 1}
                          textAnchor="middle"
                          fill="#ef4444"
                          fontSize={10}
                          fontWeight={700}
                          pointerEvents="none"
                        >
                          x
                        </text>
                      </g>
                    </g>
                  )
                })}
              </svg>
            </div>

            {seatPopover && (() => {
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
                  onUnassign={() => {
                    if (assignment) void handleUnassignGuest(assignment.guestId)
                  }}
                  onClose={() => setSeatPopover(null)}
                />
              )
            })()}
          </div>
        </div>
      ) : charts.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="bg-wedding-50 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full">
              <svg
                className="text-wedding-600 h-8 w-8"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7"
                />
              </svg>
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
                  <CardTitle className="text-base">{chart.name}</CardTitle>
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

      <Dialog open={showAddTable} onOpenChange={setShowAddTable}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Table</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="table-label">Table Label</Label>
              <Input
                id="table-label"
                value={tableLabel}
                onChange={(e) => setTableLabel(e.target.value)}
                placeholder="e.g., Table 1"
              />
            </div>
            <div>
              <Label htmlFor="table-shape">Type</Label>
              <select
                id="table-shape"
                value={tableShape}
                onChange={(e) => setTableShape(e.target.value)}
                className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="round">Round</option>
                <option value="rectangular">Rectangular</option>
                <option value="banquet">Banquet</option>
                <option value="head_table">Head Table</option>
                <option value="sweetheart">Sweetheart</option>
              </select>
            </div>
            <div>
              <Label htmlFor="table-capacity">Capacity</Label>
              <Input
                id="table-capacity"
                type="number"
                value={tableCapacity}
                onChange={(e) => setTableCapacity(e.target.value)}
                min={1}
                max={20}
              />
            </div>
            <Button onClick={handleAddTable} className="w-full">
              Add Table
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}
