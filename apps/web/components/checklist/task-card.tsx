'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import type { ChecklistTask, FeatureGates } from '@planfortwo/types'

const CATEGORY_PAGE_MAP: Record<string, string> = {
  venue: '/vendors',
  vendors: '/vendors',
  budget: '/budget',
  finance: '/budget',
  'guest list': '/guests',
  guests: '/guests',
  invitations: '/guests',
  website: '/website',
  ceremony: '/events',
  music: '/music',
  entertainment: '/music',
  photography: '/photos',
  videography: '/photos',
  photos: '/photos',
  registry: '/registry',
  honeymoon: '/honeymoon',
  seating: '/seating',
  events: '/events',
  timeline: '/events',
  communication: '/inbox',
}

function getCategoryPageLink(categoryName: string): string | null {
  const key = categoryName.toLowerCase().trim()
  return CATEGORY_PAGE_MAP[key] ?? null
}

interface TaskCardProps {
  task: ChecklistTask
  categoryColor: string
  categoryName: string
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

  if (diffDays < 0)
    return { label: 'Overdue', className: 'border border-red-200 text-red-600 bg-transparent' }
  if (diffDays <= 7)
    return {
      label: `${diffDays}d left`,
      className: 'border border-amber-200 text-amber-600 bg-transparent',
    }
  return {
    label: due.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    className: 'border border-border text-muted-foreground bg-transparent',
  }
}

const PRIORITY_STYLES: Record<string, string> = {
  must_do: 'border border-red-200 text-red-600 bg-transparent',
  nice_to_have: 'border border-amber-200 text-amber-600 bg-transparent',
  optional: 'border border-border text-muted-foreground bg-transparent',
}

const PRIORITY_LABELS: Record<string, string> = {
  must_do: 'Must Do',
  nice_to_have: 'Nice to Have',
  optional: 'Optional',
}

export function TaskCard({
  task,
  categoryColor,
  categoryName,
  features,
  onToggleComplete,
  onSelect,
  dragHandleProps,
}: TaskCardProps) {
  const isCompleted = task.completedAt !== null
  const dueDateInfo = getDueDateStyle(task.dueDate)
  const sectionLink = getCategoryPageLink(categoryName)

  return (
    <motion.div
      className={`hover:border-wedding-200 group flex items-center gap-3 rounded-xl border bg-white px-4 py-3 text-foreground transition-colors ${
        isCompleted ? 'border-border' : 'border-border'
      }`}
      layout
      initial={false}
      animate={{ opacity: isCompleted ? 0.7 : 1 }}
      transition={{ duration: 0.25 }}
      whileHover={{ x: 2 }}
    >
      {features.canReorderTasks && dragHandleProps && (
        <button
          className="cursor-grab touch-none text-muted-foreground hover:text-muted-foreground active:cursor-grabbing"
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
            : 'hover:border-wedding-400 border-border'
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
        className="flex min-w-0 flex-1 flex-col gap-1 text-left"
      >
        <div className="flex w-full items-center gap-3">
          <span
            className={`flex-1 truncate text-sm font-medium ${
              isCompleted ? 'text-muted-foreground line-through' : 'text-foreground'
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
        </div>
        {task.description && !isCompleted && (
          <span className="truncate text-xs text-muted-foreground">{task.description}</span>
        )}
      </button>

      {sectionLink && !isCompleted && (
        <Link
          href={sectionLink}
          onClick={(e) => e.stopPropagation()}
          className="text-wedding-600 hover:text-wedding-700 flex flex-shrink-0 items-center gap-1 text-xs font-medium"
        >
          Go to section
          <ArrowRight className="h-3 w-3" />
        </Link>
      )}
    </motion.div>
  )
}
