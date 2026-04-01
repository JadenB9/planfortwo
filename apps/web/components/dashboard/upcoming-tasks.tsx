'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import type { ChecklistTask } from '@planfortwo/types'
import { staggerContainer, listItem, springSmooth } from '@/lib/animations'

interface UpcomingTasksProps {
  tasks: ChecklistTask[]
}

const PRIORITY_STYLES: Record<string, string> = {
  must_do: 'bg-red-100 text-red-700',
  nice_to_have: 'bg-amber-100 text-amber-700',
  optional: 'bg-muted text-muted-foreground',
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
      <div className="rounded-2xl border border-border bg-white p-6">
        <h3 className="font-serif text-lg font-semibold text-foreground">Upcoming Tasks</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          No upcoming tasks. Your checklist will appear here.
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-border bg-white p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-serif text-lg font-semibold text-foreground">Upcoming Tasks</h3>
        <Link
          href="/checklist"
          className="text-wedding-600 hover:text-wedding-700 text-sm font-medium transition-colors"
        >
          View all
        </Link>
      </div>

      <motion.div
        className="space-y-3"
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
      >
        {upcoming.map((task) => (
          <Link key={task.id} href="/checklist">
            <motion.div
              className="flex items-center justify-between rounded-xl border border-border px-4 py-3"
              variants={listItem}
              transition={{ duration: 0.3, ...springSmooth }}
              whileHover={{ x: 3, borderColor: 'rgb(var(--wedding-200))' }}
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">{task.title}</p>
                {task.dueDate && (
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Due{' '}
                    {new Date(task.dueDate).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </p>
                )}
              </div>
              <span
                className={`ml-3 flex-shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${PRIORITY_STYLES[task.priority]}`}
              >
                {PRIORITY_LABELS[task.priority]}
              </span>
            </motion.div>
          </Link>
        ))}
      </motion.div>
    </div>
  )
}
