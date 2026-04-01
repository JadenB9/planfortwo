'use client'

import { Plus, Trash2 } from 'lucide-react'
import type { EventDetailsContent } from '@planfortwo/types'

interface EventDetailsEditorProps {
  content: EventDetailsContent
  onChange: (content: EventDetailsContent) => void
}

export function EventDetailsEditor({ content, onChange }: EventDetailsEditorProps) {
  const events = content.events ?? []

  const updateEvent = (index: number, fields: Partial<EventDetailsContent['events'][number]>) => {
    const updated = events.map((event, i) => (i === index ? { ...event, ...fields } : event))
    onChange({ ...content, events: updated })
  }

  const addEvent = () => {
    onChange({
      ...content,
      events: [
        ...events,
        { name: '', date: null, time: null, venue: '', address: '', description: '' },
      ],
    })
  }

  const removeEvent = (index: number) => {
    onChange({
      ...content,
      events: events.filter((_, i) => i !== index),
    })
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-foreground">Events</h4>
        <button
          type="button"
          onClick={addEvent}
          className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-800"
        >
          <Plus className="h-4 w-4" />
          Add Event
        </button>
      </div>

      {events.length === 0 && (
        <p className="mt-3 text-sm text-muted-foreground">
          No events yet. Add your ceremony, reception, rehearsal dinner, or any other events your
          guests should know about.
        </p>
      )}

      <div className="mt-3 space-y-4">
        {events.map((event, index) => (
          <div
            key={index}
            className={`rounded-lg border border-border p-4 ${
              index > 0 ? 'border-t border-border' : ''
            }`}
          >
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
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

            <div>
              <label className="text-sm font-medium text-foreground">Event Name</label>
              <input
                type="text"
                value={event.name}
                onChange={(e) => updateEvent(index, { name: e.target.value })}
                placeholder="Ceremony"
                className="mt-1 block w-full rounded-md border border-border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="mt-3 grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-foreground">Date</label>
                <input
                  type="text"
                  value={event.date ?? ''}
                  onChange={(e) => updateEvent(index, { date: e.target.value || null })}
                  placeholder="September 14, 2026"
                  className="mt-1 block w-full rounded-md border border-border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Time</label>
                <input
                  type="text"
                  value={event.time ?? ''}
                  onChange={(e) => updateEvent(index, { time: e.target.value || null })}
                  placeholder="4:00 PM"
                  className="mt-1 block w-full rounded-md border border-border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="mt-3">
              <label className="text-sm font-medium text-foreground">Venue</label>
              <input
                type="text"
                value={event.venue}
                onChange={(e) => updateEvent(index, { venue: e.target.value })}
                placeholder="The Grand Ballroom"
                className="mt-1 block w-full rounded-md border border-border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="mt-3">
              <label className="text-sm font-medium text-foreground">Address</label>
              <input
                type="text"
                value={event.address}
                onChange={(e) => updateEvent(index, { address: e.target.value })}
                placeholder="123 Main Street, City, State 12345"
                className="mt-1 block w-full rounded-md border border-border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="mt-3">
              <label className="text-sm font-medium text-foreground">Description</label>
              <textarea
                value={event.description}
                onChange={(e) => updateEvent(index, { description: e.target.value })}
                placeholder="Additional details about this event..."
                rows={2}
                className="mt-1 block w-full rounded-md border border-border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
