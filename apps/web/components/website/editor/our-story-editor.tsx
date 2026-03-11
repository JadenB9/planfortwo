'use client'

import { Plus, Trash2 } from 'lucide-react'
import type { OurStoryContent } from '@planfortwo/types'

interface OurStoryEditorProps {
  content: OurStoryContent
  onChange: (content: OurStoryContent) => void
}

export function OurStoryEditor({ content, onChange }: OurStoryEditorProps) {
  const timelineEvents = content.timelineEvents ?? []

  const updateBody = (body: string) => {
    onChange({ ...content, body })
  }

  const updateEvent = (
    index: number,
    fields: Partial<OurStoryContent['timelineEvents'][number]>,
  ) => {
    const updated = timelineEvents.map((event, i) =>
      i === index ? { ...event, ...fields } : event,
    )
    onChange({ ...content, timelineEvents: updated })
  }

  const addEvent = () => {
    onChange({
      ...content,
      timelineEvents: [...timelineEvents, { date: '', title: '', description: '', imageUrl: '' }],
    })
  }

  const removeEvent = (index: number) => {
    onChange({
      ...content,
      timelineEvents: timelineEvents.filter((_, i) => i !== index),
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <label htmlFor="story-body" className="text-sm font-medium text-gray-700">
          Your Story
        </label>
        <textarea
          id="story-body"
          value={content.body}
          onChange={(e) => updateBody(e.target.value)}
          placeholder="Tell your guests how you met, your journey together, and what makes your love story special..."
          rows={5}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      <div>
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium text-gray-700">Timeline Events</h4>
          <button
            type="button"
            onClick={addEvent}
            className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-800"
          >
            <Plus className="h-4 w-4" />
            Add Event
          </button>
        </div>

        {timelineEvents.length === 0 && (
          <p className="mt-3 text-sm text-gray-500">
            No timeline events yet. Add milestones like when you met, your first date, or the
            proposal.
          </p>
        )}

        <div className="mt-3 space-y-4">
          {timelineEvents.map((event, index) => (
            <div
              key={index}
              className={`rounded-lg border border-gray-200 p-4 ${
                index > 0 ? 'border-t border-gray-100' : ''
              }`}
            >
              <div className="mb-3 flex items-center justify-between">
                <span className="text-xs font-medium uppercase tracking-wide text-gray-400">
                  Event {index + 1}
                </span>
                <button
                  type="button"
                  onClick={() => removeEvent(index)}
                  className="flex items-center gap-1 text-sm text-red-500 hover:text-red-700"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Remove
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-gray-700">Date</label>
                  <input
                    type="text"
                    value={event.date}
                    onChange={(e) => updateEvent(index, { date: e.target.value })}
                    placeholder="June 2022"
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Title</label>
                  <input
                    type="text"
                    value={event.title}
                    onChange={(e) => updateEvent(index, { title: e.target.value })}
                    placeholder="First Date"
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="mt-3">
                <label className="text-sm font-medium text-gray-700">Description</label>
                <textarea
                  value={event.description}
                  onChange={(e) => updateEvent(index, { description: e.target.value })}
                  placeholder="A short description of this milestone..."
                  rows={2}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="mt-3">
                <label className="text-sm font-medium text-gray-700">Image URL (optional)</label>
                <input
                  type="text"
                  value={event.imageUrl ?? ''}
                  onChange={(e) =>
                    updateEvent(index, {
                      imageUrl: e.target.value || undefined,
                    })
                  }
                  placeholder="https://example.com/photo.jpg"
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
