'use client'

import { Plus, Trash2 } from 'lucide-react'
import type { ScheduleContent } from '@planfortwo/types'

interface ScheduleEditorProps {
  content: ScheduleContent
  onChange: (content: ScheduleContent) => void
}

export function ScheduleEditor({ content, onChange }: ScheduleEditorProps) {
  const items = content.items ?? []

  const updateItem = (index: number, fields: Partial<ScheduleContent['items'][number]>) => {
    const updated = items.map((item, i) => (i === index ? { ...item, ...fields } : item))
    onChange({ ...content, items: updated })
  }

  const addItem = () => {
    onChange({
      ...content,
      items: [...items, { time: '', title: '', description: '', location: '' }],
    })
  }

  const removeItem = (index: number) => {
    onChange({ ...content, items: items.filter((_, i) => i !== index) })
  }

  return (
    <div className="space-y-5">
      {items.map((item, index) => (
        <div key={index} className="rounded-lg border border-border p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm font-semibold text-foreground">Event {index + 1}</span>
            <button
              type="button"
              onClick={() => removeItem(index)}
              className="text-sm text-red-500 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor={`schedule-time-${index}`}
                  className="text-sm font-medium text-foreground"
                >
                  Time
                </label>
                <input
                  id={`schedule-time-${index}`}
                  type="text"
                  value={item.time}
                  onChange={(e) => updateItem(index, { time: e.target.value })}
                  placeholder="3:00 PM"
                  className="mt-1 block w-full rounded-md border border-border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label
                  htmlFor={`schedule-title-${index}`}
                  className="text-sm font-medium text-foreground"
                >
                  Title
                </label>
                <input
                  id={`schedule-title-${index}`}
                  type="text"
                  value={item.title}
                  onChange={(e) => updateItem(index, { title: e.target.value })}
                  placeholder="Ceremony Begins"
                  className="mt-1 block w-full rounded-md border border-border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor={`schedule-desc-${index}`}
                className="text-sm font-medium text-foreground"
              >
                Description <span className="font-normal text-muted-foreground">(optional)</span>
              </label>
              <textarea
                id={`schedule-desc-${index}`}
                rows={2}
                value={item.description ?? ''}
                onChange={(e) => updateItem(index, { description: e.target.value })}
                placeholder="Additional details about this part of the day"
                className="mt-1 block w-full rounded-md border border-border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label
                htmlFor={`schedule-loc-${index}`}
                className="text-sm font-medium text-foreground"
              >
                Location <span className="font-normal text-muted-foreground">(optional)</span>
              </label>
              <input
                id={`schedule-loc-${index}`}
                type="text"
                value={item.location ?? ''}
                onChange={(e) => updateItem(index, { location: e.target.value })}
                placeholder="Main Chapel, Rose Garden"
                className="mt-1 block w-full rounded-md border border-border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={addItem}
        className="flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-800"
      >
        <Plus className="h-4 w-4" />
        Add Event
      </button>
    </div>
  )
}
