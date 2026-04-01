'use client'

import { Plus, Trash2 } from 'lucide-react'
import type { TravelContent } from '@planfortwo/types'

interface TravelEditorProps {
  content: TravelContent
  onChange: (content: TravelContent) => void
}

export function TravelEditor({ content, onChange }: TravelEditorProps) {
  const accommodations = content.accommodations ?? []

  function updateAccommodation(
    index: number,
    field: keyof TravelContent['accommodations'][number],
    value: string,
  ) {
    const updated = accommodations.map((acc, i) => (i === index ? { ...acc, [field]: value } : acc))
    onChange({ ...content, accommodations: updated })
  }

  function addAccommodation() {
    onChange({
      ...content,
      accommodations: [
        ...accommodations,
        { name: '', url: '', address: '', phone: '', notes: '', bookingCode: '' },
      ],
    })
  }

  function removeAccommodation(index: number) {
    onChange({
      ...content,
      accommodations: accommodations.filter((_, i) => i !== index),
    })
  }

  return (
    <div className="space-y-5">
      {/* Accommodations */}
      <div>
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-foreground">Accommodations</label>
          <button
            type="button"
            onClick={addAccommodation}
            className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-800"
          >
            <Plus className="h-4 w-4" />
            Add
          </button>
        </div>

        {accommodations.length === 0 && (
          <p className="mt-2 text-sm text-muted-foreground">
            No accommodations yet. Add hotels, Airbnbs, or other lodging options for your guests.
          </p>
        )}

        <div className="mt-3 space-y-4">
          {accommodations.map((acc, index) => (
            <div key={index} className="relative rounded-lg border border-border p-4">
              <button
                type="button"
                onClick={() => removeAccommodation(index)}
                className="absolute right-3 top-3 flex items-center gap-1 text-sm text-red-500 hover:text-red-700"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Remove
              </button>

              <div className="space-y-3 pr-20">
                <div>
                  <label
                    htmlFor={`acc-name-${index}`}
                    className="text-sm font-medium text-foreground"
                  >
                    Name
                  </label>
                  <input
                    id={`acc-name-${index}`}
                    type="text"
                    value={acc.name}
                    onChange={(e) => updateAccommodation(index, 'name', e.target.value)}
                    placeholder="e.g. Hilton Downtown"
                    className="mt-1 block w-full rounded-md border border-border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label
                    htmlFor={`acc-address-${index}`}
                    className="text-sm font-medium text-foreground"
                  >
                    Address
                  </label>
                  <input
                    id={`acc-address-${index}`}
                    type="text"
                    value={acc.address ?? ''}
                    onChange={(e) => updateAccommodation(index, 'address', e.target.value)}
                    placeholder="123 Main St, City, State"
                    className="mt-1 block w-full rounded-md border border-border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label
                      htmlFor={`acc-phone-${index}`}
                      className="text-sm font-medium text-foreground"
                    >
                      Phone
                    </label>
                    <input
                      id={`acc-phone-${index}`}
                      type="text"
                      value={acc.phone ?? ''}
                      onChange={(e) => updateAccommodation(index, 'phone', e.target.value)}
                      placeholder="(555) 123-4567"
                      className="mt-1 block w-full rounded-md border border-border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor={`acc-booking-${index}`}
                      className="text-sm font-medium text-foreground"
                    >
                      Booking Code
                    </label>
                    <input
                      id={`acc-booking-${index}`}
                      type="text"
                      value={acc.bookingCode ?? ''}
                      onChange={(e) => updateAccommodation(index, 'bookingCode', e.target.value)}
                      placeholder="e.g. SMITHWEDDING"
                      className="mt-1 block w-full rounded-md border border-border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor={`acc-url-${index}`} className="text-sm font-medium text-foreground">
                    Website URL
                  </label>
                  <input
                    id={`acc-url-${index}`}
                    type="text"
                    value={acc.url ?? ''}
                    onChange={(e) => updateAccommodation(index, 'url', e.target.value)}
                    placeholder="https://hotel-website.com"
                    className="mt-1 block w-full rounded-md border border-border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label
                    htmlFor={`acc-notes-${index}`}
                    className="text-sm font-medium text-foreground"
                  >
                    Notes
                  </label>
                  <textarea
                    id={`acc-notes-${index}`}
                    value={acc.notes ?? ''}
                    onChange={(e) => updateAccommodation(index, 'notes', e.target.value)}
                    placeholder="Special rate for wedding guests, mention booking code at checkout..."
                    rows={2}
                    className="mt-1 block w-full rounded-md border border-border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Directions */}
      <div className="mt-4 border-t border-border pt-4">
        <label htmlFor="travel-directions" className="text-sm font-medium text-foreground">
          Directions
        </label>
        <textarea
          id="travel-directions"
          value={content.directions ?? ''}
          onChange={(e) => onChange({ ...content, directions: e.target.value })}
          placeholder="Driving directions, airport info, shuttle details..."
          rows={4}
          className="mt-1 block w-full rounded-md border border-border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      {/* Map Embed */}
      <div className="mt-4 border-t border-border pt-4">
        <label htmlFor="travel-map-embed" className="text-sm font-medium text-foreground">
          Google Maps Embed URL
        </label>
        <input
          id="travel-map-embed"
          type="text"
          value={content.mapEmbed ?? ''}
          onChange={(e) => onChange({ ...content, mapEmbed: e.target.value || null })}
          placeholder="https://www.google.com/maps/embed?pb=..."
          className="mt-1 block w-full rounded-md border border-border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <p className="mt-1 text-xs text-muted-foreground">
          Paste the embed URL from Google Maps to display a map on your wedding website.
        </p>
      </div>
    </div>
  )
}
