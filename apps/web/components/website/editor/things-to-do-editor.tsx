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
      <label className="text-sm font-medium text-gray-700">Activities & Attractions</label>

      {activities.map((item, i) => (
        <div key={i} className="space-y-3 rounded-lg border border-gray-200 p-4">
          <div className="flex items-start justify-between gap-2">
            <span className="mt-1 text-xs font-medium text-gray-400">Activity {i + 1}</span>
            <button
              type="button"
              onClick={() => removeActivity(i)}
              className="text-sm text-red-500 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500">Name</label>
            <input
              type="text"
              value={item.name}
              onChange={(e) => updateActivity(i, 'name', e.target.value)}
              placeholder="e.g., Wine Tasting Tour"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500">Description</label>
            <textarea
              value={item.description ?? ''}
              onChange={(e) => updateActivity(i, 'description', e.target.value)}
              placeholder="Brief description..."
              rows={2}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-500">URL</label>
              <input
                type="text"
                value={item.url ?? ''}
                onChange={(e) => updateActivity(i, 'url', e.target.value)}
                placeholder="https://..."
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500">Category</label>
              <input
                type="text"
                value={item.category ?? ''}
                onChange={(e) => updateActivity(i, 'category', e.target.value)}
                placeholder="e.g., Food, Entertainment"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
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
