'use client'

import Link from 'next/link'
import type { ChecklistTask } from '@planfortwo/types'

interface UpcomingTasksProps {
  tasks: ChecklistTask[]
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

export function UpcomingTasks({ tasks }: UpcomingTasksProps) {
  const upcoming = tasks.slice(0, 5)

  if (upcoming.length === 0) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-6">
        <h3 className="font-serif text-lg font-semibold text-gray-900">Upcoming Tasks</h3>
        <p className="mt-2 text-sm text-gray-500">No upcoming tasks. Your checklist will appear here.</p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-serif text-lg font-semibold text-gray-900">Upcoming Tasks</h3>
        <Link
          href="/checklist"
          className="text-sm font-medium text-wedding-600 transition-colors hover:text-wedding-700"
        >
          View all
        </Link>
      </div>

      <div className="space-y-3">
        {upcoming.map((task) => (
          <div key={task.id} className="flex items-center justify-between rounded-xl border border-gray-100 px-4 py-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-gray-900">{task.title}</p>
              {task.dueDate && (
                <p className="mt-0.5 text-xs text-gray-500">
                  Due {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </p>
              )}
            </div>
            <span className={`ml-3 flex-shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${PRIORITY_STYLES[task.priority]}`}>
              {PRIORITY_LABELS[task.priority]}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
