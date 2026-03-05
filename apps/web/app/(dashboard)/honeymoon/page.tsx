'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@clerk/nextjs'
import { motion } from 'framer-motion'
import { springSmooth, fadeInUp, staggerContainer } from '@/lib/animations'
import { api } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'

interface HoneymoonPlan {
  id: string
  weddingId: string
  destination: string
  startDate: string | null
  endDate: string | null
  budget: number | null
  notes: string | null
  packingList: string[] | null
  createdAt: Date
}

interface Activity {
  id: string
  dayNumber: number
  title: string
  description: string | null
  location: string | null
  startTime: string | null
  endTime: string | null
  cost: number | null
  sortOrder: number
}

export default function HoneymoonPage() {
  const { getToken } = useAuth()
  const [weddingId, setWeddingId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const [plans, setPlans] = useState<HoneymoonPlan[]>([])
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null)
  const [activities, setActivities] = useState<Activity[]>([])
  const [packingList, setPackingList] = useState<string[]>([])
  const [packingInput, setPackingInput] = useState('')

  const [showPlanDialog, setShowPlanDialog] = useState(false)
  const [planForm, setPlanForm] = useState({
    destination: '',
    startDate: '',
    endDate: '',
    budget: '',
    notes: '',
  })

  const [showActivityDialog, setShowActivityDialog] = useState(false)
  const [activityForm, setActivityForm] = useState({
    dayNumber: '1',
    title: '',
    description: '',
    location: '',
    startTime: '',
    endTime: '',
    cost: '',
  })

  const loadData = useCallback(async () => {
    try {
      const token = await getToken()
      if (!token) return
      const { data: dashData } = await api.weddings.mine(token)
      const wId = dashData.wedding.id
      setWeddingId(wId)
      const { data } = await api.honeymoon.list(wId, token)
      setPlans(data)
    } catch {
      /* silent */
    } finally {
      setLoading(false)
    }
  }, [getToken])

  useEffect(() => {
    void loadData()
  }, [loadData])

  const loadPlanDetails = useCallback(
    async (planId: string) => {
      if (!weddingId) return
      try {
        const token = await getToken()
        if (!token) return
        const { data } = await api.honeymoon.get(planId, weddingId, token)
        setActivities(data.activities ?? [])
        setPackingList(data.packingList ?? [])
        setSelectedPlan(planId)
      } catch {
        /* silent */
      }
    },
    [weddingId, getToken],
  )

  const handleCreatePlan = useCallback(async () => {
    if (!weddingId) return
    try {
      const token = await getToken()
      if (!token) return
      await api.honeymoon.create(
        {
          weddingId,
          destination: planForm.destination,
          startDate: planForm.startDate ? new Date(planForm.startDate).toISOString() : null,
          endDate: planForm.endDate ? new Date(planForm.endDate).toISOString() : null,
          budget: planForm.budget ? parseInt(planForm.budget) : null,
          notes: planForm.notes || null,
        },
        token,
      )
      setShowPlanDialog(false)
      setPlanForm({ destination: '', startDate: '', endDate: '', budget: '', notes: '' })
      void loadData()
    } catch {
      /* silent */
    }
  }, [weddingId, getToken, planForm, loadData])

  const handleDeletePlan = useCallback(
    async (id: string) => {
      if (!weddingId) return
      try {
        const token = await getToken()
        if (!token) return
        await api.honeymoon.delete(id, weddingId, token)
        if (selectedPlan === id) {
          setSelectedPlan(null)
          setActivities([])
          setPackingList([])
        }
        void loadData()
      } catch {
        /* silent */
      }
    },
    [weddingId, getToken, selectedPlan, loadData],
  )

  const handleAddActivity = useCallback(async () => {
    if (!selectedPlan) return
    try {
      const token = await getToken()
      if (!token) return
      await api.honeymoon.addActivity(
        selectedPlan,
        {
          planId: selectedPlan,
          dayNumber: parseInt(activityForm.dayNumber),
          title: activityForm.title,
          description: activityForm.description || null,
          location: activityForm.location || null,
          startTime: activityForm.startTime || null,
          endTime: activityForm.endTime || null,
          cost: activityForm.cost ? parseInt(activityForm.cost) : null,
        },
        token,
      )
      setShowActivityDialog(false)
      setActivityForm({
        dayNumber: '1',
        title: '',
        description: '',
        location: '',
        startTime: '',
        endTime: '',
        cost: '',
      })
      void loadPlanDetails(selectedPlan)
    } catch {
      /* silent */
    }
  }, [selectedPlan, getToken, activityForm, loadPlanDetails])

  const handleDeleteActivity = useCallback(
    async (activityId: string) => {
      try {
        const token = await getToken()
        if (!token) return
        await api.honeymoon.deleteActivity(activityId, token)
        if (selectedPlan) void loadPlanDetails(selectedPlan)
      } catch {
        /* silent */
      }
    },
    [getToken, selectedPlan, loadPlanDetails],
  )

  const handleAddPackingItem = useCallback(async () => {
    if (!selectedPlan || !weddingId || !packingInput.trim()) return
    const newList = [...packingList, packingInput.trim()]
    try {
      const token = await getToken()
      if (!token) return
      await api.honeymoon.update(selectedPlan, weddingId, { packingList: newList }, token)
      setPackingList(newList)
      setPackingInput('')
    } catch {
      /* silent */
    }
  }, [selectedPlan, weddingId, getToken, packingInput, packingList])

  const handleRemovePackingItem = useCallback(
    async (index: number) => {
      if (!selectedPlan || !weddingId) return
      const newList = packingList.filter((_, i) => i !== index)
      try {
        const token = await getToken()
        if (!token) return
        await api.honeymoon.update(selectedPlan, weddingId, { packingList: newList }, token)
        setPackingList(newList)
      } catch {
        /* silent */
      }
    },
    [selectedPlan, weddingId, getToken, packingList],
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="border-wedding-200 border-t-wedding-600 h-8 w-8 animate-spin rounded-full border-4" />
      </div>
    )
  }

  const selectedPlanData = plans.find((p) => p.id === selectedPlan)
  const totalActivityCost = activities.reduce((sum, a) => sum + (a.cost ?? 0), 0)

  return (
    <motion.div
      className="mx-auto max-w-5xl"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ...springSmooth }}
    >
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl font-bold text-gray-900">Honeymoon</h1>
          <p className="mt-1 text-sm text-gray-600">
            Plan your dream getaway with itineraries and packing lists.
          </p>
        </div>
        <Button onClick={() => setShowPlanDialog(true)}>New Destination</Button>
      </div>

      {plans.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
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
                  d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h2 className="font-serif text-xl font-semibold text-gray-900">Plan Your Honeymoon</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-gray-600">
              Add your first destination to start building your honeymoon itinerary.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-3 lg:col-span-1">
            {plans.map((plan) => (
              <Card
                key={plan.id}
                className={`cursor-pointer transition-shadow hover:shadow-md ${selectedPlan === plan.id ? 'ring-wedding-500 ring-2' : ''}`}
                onClick={() => loadPlanDetails(plan.id)}
              >
                <CardContent className="py-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{plan.destination}</p>
                      {plan.budget && (
                        <p className="text-xs text-gray-500">
                          Budget: ${plan.budget.toLocaleString()}
                        </p>
                      )}
                      {plan.startDate && (
                        <p className="text-xs text-gray-400">
                          {new Date(plan.startDate).toLocaleDateString()}
                          {plan.endDate ? ` - ${new Date(plan.endDate).toLocaleDateString()}` : ''}
                        </p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-500"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeletePlan(plan.id)
                      }}
                    >
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="space-y-6 lg:col-span-2">
            {selectedPlan ? (
              <>
                {selectedPlanData?.budget && (
                  <Card>
                    <CardContent className="py-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Budget Tracking</span>
                        <span className="text-sm font-medium">
                          ${totalActivityCost.toLocaleString()} / $
                          {selectedPlanData.budget.toLocaleString()}
                        </span>
                      </div>
                      <div className="mt-2 h-2 overflow-hidden rounded-full bg-gray-100">
                        <div
                          className="bg-wedding-500 h-full rounded-full transition-all"
                          style={{
                            width: `${Math.min(100, (totalActivityCost / selectedPlanData.budget) * 100)}%`,
                          }}
                        />
                      </div>
                    </CardContent>
                  </Card>
                )}

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Itinerary</CardTitle>
                    <Button size="sm" onClick={() => setShowActivityDialog(true)}>
                      Add Activity
                    </Button>
                  </CardHeader>
                  <CardContent>
                    {activities.length === 0 ? (
                      <p className="py-6 text-center text-sm text-gray-500">
                        No activities planned yet.
                      </p>
                    ) : (
                      <motion.div
                        className="space-y-2"
                        variants={staggerContainer}
                        initial="hidden"
                        animate="visible"
                      >
                        {activities
                          .sort((a, b) => a.dayNumber - b.dayNumber || a.sortOrder - b.sortOrder)
                          .map((act) => (
                            <motion.div
                              key={act.id}
                              variants={fadeInUp}
                              className="flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2"
                            >
                              <div>
                                <div className="flex items-center gap-2">
                                  <Badge variant="secondary" className="text-xs">
                                    Day {act.dayNumber}
                                  </Badge>
                                  <p className="text-sm font-medium text-gray-900">{act.title}</p>
                                </div>
                                <div className="mt-0.5 flex items-center gap-3 text-xs text-gray-500">
                                  {act.location && <span>{act.location}</span>}
                                  {act.startTime && (
                                    <span>
                                      {act.startTime}
                                      {act.endTime ? ` - ${act.endTime}` : ''}
                                    </span>
                                  )}
                                  {act.cost != null && act.cost > 0 && <span>${act.cost}</span>}
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-500"
                                onClick={() => handleDeleteActivity(act.id)}
                              >
                                Remove
                              </Button>
                            </motion.div>
                          ))}
                      </motion.div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Packing Checklist</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-3 flex gap-2">
                      <Input
                        value={packingInput}
                        onChange={(e) => setPackingInput(e.target.value)}
                        placeholder="Add item..."
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') void handleAddPackingItem()
                        }}
                      />
                      <Button
                        size="sm"
                        onClick={handleAddPackingItem}
                        disabled={!packingInput.trim()}
                      >
                        Add
                      </Button>
                    </div>
                    {packingList.length === 0 ? (
                      <p className="text-sm text-gray-500">No packing items yet.</p>
                    ) : (
                      <ul className="space-y-1">
                        {packingList.map((item, idx) => (
                          <li
                            key={idx}
                            className="flex items-center justify-between rounded px-2 py-1 text-sm hover:bg-gray-50"
                          >
                            <span>{item}</span>
                            <button
                              onClick={() => handleRemovePackingItem(idx)}
                              className="text-xs text-red-400 hover:text-red-600"
                            >
                              Remove
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card>
                <CardContent className="py-16 text-center">
                  <p className="text-sm text-gray-500">
                    Select a destination to view its itinerary and packing list.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}

      <Dialog open={showPlanDialog} onOpenChange={setShowPlanDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Honeymoon Destination</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Destination</Label>
              <Input
                value={planForm.destination}
                onChange={(e) => setPlanForm({ ...planForm, destination: e.target.value })}
                placeholder="e.g. Bali, Indonesia"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Start Date</Label>
                <Input
                  type="date"
                  value={planForm.startDate}
                  onChange={(e) => setPlanForm({ ...planForm, startDate: e.target.value })}
                />
              </div>
              <div>
                <Label>End Date</Label>
                <Input
                  type="date"
                  value={planForm.endDate}
                  onChange={(e) => setPlanForm({ ...planForm, endDate: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label>Budget ($)</Label>
              <Input
                type="number"
                value={planForm.budget}
                onChange={(e) => setPlanForm({ ...planForm, budget: e.target.value })}
                placeholder="5000"
              />
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea
                value={planForm.notes}
                onChange={(e) => setPlanForm({ ...planForm, notes: e.target.value })}
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPlanDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreatePlan} disabled={!planForm.destination}>
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showActivityDialog} onOpenChange={setShowActivityDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Activity</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Day Number</Label>
                <Input
                  type="number"
                  min="1"
                  value={activityForm.dayNumber}
                  onChange={(e) => setActivityForm({ ...activityForm, dayNumber: e.target.value })}
                />
              </div>
              <div>
                <Label>Cost ($)</Label>
                <Input
                  type="number"
                  value={activityForm.cost}
                  onChange={(e) => setActivityForm({ ...activityForm, cost: e.target.value })}
                  placeholder="0"
                />
              </div>
            </div>
            <div>
              <Label>Title</Label>
              <Input
                value={activityForm.title}
                onChange={(e) => setActivityForm({ ...activityForm, title: e.target.value })}
                placeholder="e.g. Temple Tour"
              />
            </div>
            <div>
              <Label>Location</Label>
              <Input
                value={activityForm.location}
                onChange={(e) => setActivityForm({ ...activityForm, location: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Start Time</Label>
                <Input
                  value={activityForm.startTime}
                  onChange={(e) => setActivityForm({ ...activityForm, startTime: e.target.value })}
                  placeholder="09:00"
                />
              </div>
              <div>
                <Label>End Time</Label>
                <Input
                  value={activityForm.endTime}
                  onChange={(e) => setActivityForm({ ...activityForm, endTime: e.target.value })}
                  placeholder="12:00"
                />
              </div>
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={activityForm.description}
                onChange={(e) => setActivityForm({ ...activityForm, description: e.target.value })}
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowActivityDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddActivity} disabled={!activityForm.title}>
              Add
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}
