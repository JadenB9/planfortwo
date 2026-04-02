'use client'

import type { ThingsToDoContent } from '@planfortwo/types'
import { Plus, Trash2 } from 'lucide-react'

interface ThingsToDoEditorProps {
  content: ThingsToDoContent
  onChange: (content: ThingsToDoContent) => void
}

export function ThingsToDoEditor({ content, onChange }: ThingsToDoEditorProps) {
  const activities = content.activities ?? []

  const updateActivity = (
    index: number,
    field: keyof ThingsToDoContent['activities'][number],
    value: string,
  ) => {
    const updated = activities.map((a, i) =>
      i === index ? { ...a, [field]: value || undefined } : a,
    )
    onChange({ ...content, activities: updated })
  }

  const addActivity = () => {
    onChange({
      ...content,
      activities: [...activities, { name: '', description: '', url: '', category: '' }],
    })
  }

  const removeActivity = (index: number) => {
    onChange({
      ...content,
      activities: activities.filter((_, i) => i !== index),
    })
  }

  return (
    <div className="space-y-4">
      <label className="text-foreground text-sm font-medium">Activities & Attractions</label>

      {activities.map((item, i) => (
        <div key={i} className="border-border space-y-3 rounded-lg border p-4">
          <div className="flex items-start justify-between gap-2">
            <span className="text-muted-foreground mt-1 text-xs font-medium">Activity {i + 1}</span>
            <button
              type="button"
              onClick={() => removeActivity(i)}
              className="text-sm text-red-500 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
          <div>
            <label className="text-muted-foreground text-xs font-medium">Name</label>
            <input
              type="text"
              value={item.name}
              onChange={(e) => updateActivity(i, 'name', e.target.value)}
              placeholder="e.g., Wine Tasting Tour"
              className="border-border mt-1 block w-full rounded-md border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="text-muted-foreground text-xs font-medium">Description</label>
            <textarea
              value={item.description ?? ''}
              onChange={(e) => updateActivity(i, 'description', e.target.value)}
              placeholder="Brief description..."
              rows={2}
              className="border-border mt-1 block w-full rounded-md border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-muted-foreground text-xs font-medium">URL</label>
              <input
                type="text"
                value={item.url ?? ''}
                onChange={(e) => updateActivity(i, 'url', e.target.value)}
                placeholder="https://..."
                className="border-border mt-1 block w-full rounded-md border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="text-muted-foreground text-xs font-medium">Category</label>
              <input
                type="text"
                value={item.category ?? ''}
                onChange={(e) => updateActivity(i, 'category', e.target.value)}
                placeholder="e.g., Food, Entertainment"
                className="border-border mt-1 block w-full rounded-md border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={addActivity}
        className="flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-800"
      >
        <Plus className="h-4 w-4" />
        Add Activity
      </button>
    </div>
  )
}
