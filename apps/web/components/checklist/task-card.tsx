'use client'

import { motion } from 'framer-motion'
import type { ChecklistTask, FeatureGates } from '@planfortwo/types'

interface TaskCardProps {
  task: ChecklistTask
  categoryColor: string
  features: FeatureGates
  onToggleComplete: (id: string) => void
  onSelect: (id: string) => void
  dragHandleProps?: Record<string, unknown>
}

function getDueDateStyle(dueDate: Date | null): { label: string; className: string } | null {
  if (!dueDate) return null
  const now = new Date()
  const due = new Date(dueDate)
  const diffMs = due.getTime() - now.getTime()
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays < 0) return { label: 'Overdue', className: 'bg-red-100 text-red-700' }
  if (diffDays <= 7) return { label: `${diffDays}d left`, className: 'bg-amber-100 text-amber-700' }
  return {
    label: due.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    className: 'bg-gray-100 text-gray-600',
  }
}

const PRIORITY_STYLES: Record<string, string> = {
  must_do: 'bg-red-100 text-red-700',
  nice_to_have: 'bg-amber-100 text-amber-700',
  optional: 'bg-gray-100 text-gray-600',
}

const PRIORITY_LABELS: Record<string, string> = {
  must_do: 'Must Do',
  nice_to_have: 'Nice to Have',
  optional: 'Optional',
}

export function TaskCard({
  task,
  categoryColor,
  features,
  onToggleComplete,
  onSelect,
  dragHandleProps,
}: TaskCardProps) {
  const isCompleted = task.completedAt !== null
  const dueDateInfo = getDueDateStyle(task.dueDate)

  return (
    <motion.div
      className={`hover:border-wedding-200 group flex items-center gap-3 rounded-xl border bg-white px-4 py-3 transition-colors ${
        isCompleted ? 'border-gray-100 opacity-70' : 'border-gray-200'
      }`}
      layout
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: isCompleted ? 0.7 : 1, x: 0 }}
      transition={{ duration: 0.25 }}
      whileHover={{ x: 2 }}
    >
      {features.canReorderTasks && dragHandleProps && (
        <button
          className="cursor-grab touch-none text-gray-400 hover:text-gray-600 active:cursor-grabbing"
          {...dragHandleProps}
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 8h16M4 16h16"
            />
          </svg>
        </button>
      )}

      <button
        onClick={(e) => {
          e.stopPropagation()
          onToggleComplete(task.id)
        }}
        disabled={!features.canEditChecklist}
        className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-md border-2 transition-colors ${
          isCompleted
            ? 'border-wedding-600 bg-wedding-600 text-white'
            : 'hover:border-wedding-400 border-gray-300'
        } ${!features.canEditChecklist ? 'cursor-not-allowed opacity-50' : ''}`}
      >
        {isCompleted && (
          <svg
            className="h-3 w-3"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={3}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        )}
      </button>

      <button
        onClick={() => onSelect(task.id)}
        className="flex min-w-0 flex-1 items-center gap-3 text-left"
      >
        <span
          className={`flex-1 truncate text-sm font-medium ${
            isCompleted ? 'text-gray-400 line-through' : 'text-gray-900'
          }`}
        >
          {task.title}
        </span>

        <div className="flex flex-shrink-0 items-center gap-2">
          {dueDateInfo && !isCompleted && (
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${dueDateInfo.className}`}
            >
              {dueDateInfo.label}
            </span>
          )}
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-medium ${PRIORITY_STYLES[task.priority]}`}
          >
            {PRIORITY_LABELS[task.priority]}
          </span>
          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: categoryColor }} />
        </div>
      </button>
    </motion.div>
  )
}
