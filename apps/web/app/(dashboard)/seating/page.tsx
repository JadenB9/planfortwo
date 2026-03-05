'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@clerk/nextjs'
import { motion } from 'framer-motion'
import { springSmooth, staggerContainer, fadeInUp } from '@/lib/animations'
import { useWedding } from '@/hooks/use-wedding'
import { api } from '@/lib/api'
import type { SeatingChart, SeatingChartWithTables } from '@planfortwo/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

export default function SeatingPage() {
  const { getToken } = useAuth()
  const { data: weddingData, loading: weddingLoading } = useWedding()
  const weddingId = weddingData?.wedding.id ?? null

  const [charts, setCharts] = useState<SeatingChart[]>([])
  const [selectedChart, setSelectedChart] = useState<SeatingChartWithTables | null>(null)
  const [loading, setLoading] = useState(true)
  const [showNewChart, setShowNewChart] = useState(false)
  const [showAddTable, setShowAddTable] = useState(false)
  const [chartName, setChartName] = useState('')
  const [tableLabel, setTableLabel] = useState('')
  const [tableCapacity, setTableCapacity] = useState('8')
  const [tableShape, setTableShape] = useState('round')

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
        const { data } = await api.seatingCharts.get(chartId, weddingId, token)
        setSelectedChart(data)
      } catch {
        /* silent */
      }
    },
    [weddingId, getToken],
  )

  useEffect(() => {
    void loadCharts()
  }, [loadCharts])

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
      await api.seatingCharts.addTable(
        selectedChart.id,
        {
          chartId: selectedChart.id,
          label: tableLabel.trim(),
          shape: tableShape,
          capacity: parseInt(tableCapacity) || 8,
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
    if (!selectedChart) return
    try {
      const token = await getToken()
      if (!token) return
      await api.seatingCharts.deleteTable(tableId, token)
      void loadChartDetail(selectedChart.id)
    } catch {
      /* silent */
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

  return (
    <motion.div
      className="mx-auto max-w-6xl"
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
          <div className="mb-6 flex items-center justify-between">
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
            <Button onClick={() => setShowAddTable(true)}>Add Table</Button>
          </div>

          {selectedChart.tables.length === 0 ? (
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
                      d="M4 6h16M4 12h16M4 18h7"
                    />
                  </svg>
                </div>
                <h3 className="font-serif text-lg font-semibold text-gray-900">No tables yet</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Add tables to start arranging your seating.
                </p>
              </CardContent>
            </Card>
          ) : (
            <motion.div
              className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
            >
              {selectedChart.tables.map((table) => (
                <motion.div key={table.id} variants={fadeInUp}>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-base">{table.label}</CardTitle>
                      <button
                        onClick={() => handleDeleteTable(table.id)}
                        className="text-xs text-red-500 hover:text-red-700"
                      >
                        Remove
                      </button>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span className="capitalize">{table.shape}</span>
                        <span>Capacity: {table.capacity}</span>
                      </div>
                      <div className="mt-2 text-xs text-gray-500">
                        {table.assignments.length} / {table.capacity} seated
                      </div>
                      <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-gray-100">
                        <div
                          className="bg-wedding-500 h-full rounded-full transition-all"
                          style={{
                            width: `${Math.min(100, (table.assignments.length / table.capacity) * 100)}%`,
                          }}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          )}
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
              <Label htmlFor="table-shape">Shape</Label>
              <select
                id="table-shape"
                value={tableShape}
                onChange={(e) => setTableShape(e.target.value)}
                className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="round">Round</option>
                <option value="rectangle">Rectangle</option>
                <option value="square">Square</option>
                <option value="oval">Oval</option>
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
