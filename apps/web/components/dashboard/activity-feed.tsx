'use client'

import type { ActivityLogEntry, ActivityAction } from '@planfortwo/types'

interface ActivityFeedProps {
  activities: ActivityLogEntry[]
}

const ACTION_LABELS: Record<ActivityAction, string> = {
  task_created: 'created a task',
  task_completed: 'completed a task',
  task_uncompleted: 'uncompleted a task',
  task_updated: 'updated a task',
  task_deleted: 'deleted a task',
  task_assigned: 'assigned a task',
  note_added: 'added a note',
  attachment_uploaded: 'uploaded an attachment',
  category_created: 'created a category',
  category_deleted: 'deleted a category',
  checklist_seeded: 'initialized the checklist',
  guest_created: 'added a guest',
  guest_updated: 'updated a guest',
  guest_deleted: 'removed a guest',
  guest_imported: 'imported guests',
  rsvp_submitted: 'submitted an RSVP',
  household_created: 'created a household',
  household_deleted: 'removed a household',
}

function formatTimestamp(date: Date): string {
  const now = new Date()
  const d = new Date(date)
  const diffMs = now.getTime() - d.getTime()
  const diffMin = Math.floor(diffMs / 60000)

  if (diffMin < 1) return 'Just now'
  if (diffMin < 60) return `${diffMin}m ago`
  const diffHours = Math.floor(diffMin / 60)
  if (diffHours < 24) return `${diffHours}h ago`
  const diffDays = Math.floor(diffHours / 24)
  if (diffDays < 7) return `${diffDays}d ago`
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function ActivityFeed({ activities }: ActivityFeedProps) {
  if (activities.length === 0) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-6">
        <h3 className="font-serif text-lg font-semibold text-gray-900">Recent Activity</h3>
        <p className="mt-2 text-sm text-gray-500">No activity yet. Actions will appear here as you plan.</p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6">
      <h3 className="mb-4 font-serif text-lg font-semibold text-gray-900">Recent Activity</h3>

      <div className="space-y-3">
        {activities.slice(0, 10).map((entry) => {
          const taskName = (entry.metadata as Record<string, unknown> | null)?.taskTitle as string | undefined

          return (
            <div key={entry.id} className="flex items-start gap-3">
              <div className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-wedding-400" />
              <div className="min-w-0 flex-1">
                <p className="text-sm text-gray-700">
                  <span className="font-medium">{ACTION_LABELS[entry.action]}</span>
                  {taskName && (
                    <span className="text-gray-500">{` - ${taskName}`}</span>
                  )}
                </p>
                <p className="mt-0.5 text-xs text-gray-400">{formatTimestamp(entry.createdAt)}</p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
