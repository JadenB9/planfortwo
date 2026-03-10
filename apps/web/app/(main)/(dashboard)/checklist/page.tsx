'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@clerk/nextjs'
import { motion } from 'framer-motion'
import type { ChecklistTask, CategoryWithCount } from '@planfortwo/types'
import { api } from '@/lib/api'
import { springSmooth } from '@/lib/animations'
import { useWedding } from '@/hooks/use-wedding'
import { useFeatures } from '@/hooks/use-features'
import { ProgressBar } from '@/components/checklist/progress-bar'
import { CategoryFilter } from '@/components/checklist/category-filter'
import { TaskList } from '@/components/checklist/task-list'
import { TaskDetail } from '@/components/checklist/task-detail'
import { AddTaskForm } from '@/components/checklist/add-task-form'

import { toast } from 'sonner'

export default function ChecklistPage() {
  const { getToken } = useAuth()
  const { data: weddingData, loading: weddingLoading, error: weddingError } = useWedding()
  const weddingId = weddingData?.wedding.id ?? null
  const { features, loading: featuresLoading, error: featuresError } = useFeatures(weddingId)

  const [categories, setCategories] = useState<CategoryWithCount[]>([])
  const [tasks, setTasks] = useState<ChecklistTask[]>([])
  const [loadingTasks, setLoadingTasks] = useState(true)

  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null)
  const [priorityFilter, setPriorityFilter] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)

  const loadData = useCallback(async () => {
    if (!weddingId) return
    setLoadingTasks(true)
    try {
      const token = await getToken()
      if (!token) return

      const [categoriesRes, tasksRes] = await Promise.all([
        api.categories.list(weddingId, token),
        api.tasks.list(weddingId, token, {
          categoryId: selectedCategoryId ?? undefined,
          priority: priorityFilter || undefined,
          status: statusFilter !== 'all' ? statusFilter : undefined,
        }),
      ])

      setCategories(categoriesRes.data)
      setTasks(tasksRes.data)
    } catch {
      toast.error('Failed to load checklist')
    } finally {
      setLoadingTasks(false)
    }
  }, [weddingId, getToken, selectedCategoryId, priorityFilter, statusFilter])

  useEffect(() => {
    void loadData()
  }, [loadData])

  async function handleToggleComplete(taskId: string) {
    if (!weddingId || !features?.canEditChecklist) return
    try {
      const token = await getToken()
      if (!token) return
      const { data: updated } = await api.tasks.toggleComplete(taskId, weddingId, token)
      toast.success(updated.completedAt ? 'Task completed' : 'Task marked incomplete')
      setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)))
    } catch {
      toast.error('Failed to update task')
    }
  }

  async function handleReorder(updates: { id: string; sortOrder: number }[]) {
    if (!weddingId || !features?.canReorderTasks) return
    setTasks((prev) => {
      const map = new Map(updates.map((u) => [u.id, u.sortOrder]))
      return [...prev].sort(
        (a, b) => (map.get(a.id) ?? a.sortOrder) - (map.get(b.id) ?? b.sortOrder),
      )
    })
    try {
      const token = await getToken()
      if (!token) return
      await api.tasks.bulkReorder({ tasks: updates }, weddingId, token)
    } catch {
      void loadData()
    }
  }

  const isLoading = weddingLoading || featuresLoading || loadingTasks

  const apiError = weddingError || featuresError

  if (apiError) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="rounded-2xl border border-red-200 bg-red-50 px-8 py-6">
          <h2 className="font-serif text-xl font-semibold text-red-800">
            Unable to load checklist
          </h2>
          <p className="mt-2 text-sm text-red-600">{apiError}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 rounded-xl bg-red-600 px-5 py-2 text-sm font-semibold text-white hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (isLoading && tasks.length === 0) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="border-wedding-200 border-t-wedding-600 h-8 w-8 animate-spin rounded-full border-4" />
      </div>
    )
  }

  const completedCount = tasks.filter((t) => t.completedAt !== null).length

  return (
    <motion.div
      className="mx-auto max-w-6xl"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ...springSmooth }}
    >
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl font-bold text-gray-900">Checklist</h1>
          <p className="mt-1 text-sm text-gray-600">Track every detail for your perfect day.</p>
        </div>

        {features?.canAddTasks && (
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-wedding-600 hover:bg-wedding-700 rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors"
          >
            Add Task
          </button>
        )}
      </div>

      <ProgressBar completed={completedCount} total={tasks.length} className="mb-8" />

      <div className="flex gap-8">
        {/* Sidebar filters */}
        <div className="hidden w-56 flex-shrink-0 lg:block">
          <div className="rounded-2xl border border-gray-200 bg-white p-4">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
              Categories
            </h3>
            <CategoryFilter
              categories={categories}
              selectedId={selectedCategoryId}
              onSelect={setSelectedCategoryId}
            />
          </div>
        </div>

        {/* Main content */}
        <div className="min-w-0 flex-1">
          {/* Filter controls */}
          <div className="mb-4 flex flex-wrap items-center gap-3">
            {/* Mobile category selector */}
            <select
              value={selectedCategoryId ?? ''}
              onChange={(e) => setSelectedCategoryId(e.target.value || null)}
              className="rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-700 lg:hidden"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-700"
            >
              <option value="">All Priorities</option>
              <option value="must_do">Must Do</option>
              <option value="nice_to_have">Nice to Have</option>
              <option value="optional">Optional</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-700"
            >
              <option value="all">All Status</option>
              <option value="completed">Completed</option>
              <option value="incomplete">Incomplete</option>
            </select>
          </div>

          {features && (
            <TaskList
              tasks={tasks}
              categories={categories}
              features={features}
              onToggleComplete={handleToggleComplete}
              onSelect={setSelectedTaskId}
              onReorder={handleReorder}
            />
          )}
        </div>
      </div>

      {/* Add task modal */}
      {showAddForm && weddingId && (
        <AddTaskForm
          weddingId={weddingId}
          categories={categories}
          onClose={() => setShowAddForm(false)}
          onCreated={() => void loadData()}
        />
      )}

      {/* Task detail slide-over */}
      {selectedTaskId && weddingId && features && (
        <TaskDetail
          taskId={selectedTaskId}
          weddingId={weddingId}
          features={features}
          categories={categories}
          onClose={() => setSelectedTaskId(null)}
          onUpdated={() => void loadData()}
        />
      )}
    </motion.div>
  )
}
