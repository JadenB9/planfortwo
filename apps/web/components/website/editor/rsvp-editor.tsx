'use client'

import type { RsvpSectionContent } from '@planfortwo/types'

interface RsvpEditorProps {
  content: RsvpSectionContent
  onChange: (content: RsvpSectionContent) => void
}

export function RsvpEditor({ content, onChange }: RsvpEditorProps) {
  const update = (fields: Partial<RsvpSectionContent>) => {
    onChange({ ...content, ...fields })
  }

  return (
    <div className="space-y-5">
      <div>
        <label htmlFor="rsvp-message" className="text-sm font-medium text-gray-700">
          RSVP Message
        </label>
        <textarea
          id="rsvp-message"
          rows={3}
          value={content.message}
          onChange={(e) => update({ message: e.target.value })}
          placeholder="We can't wait to celebrate with you! Please let us know if you'll be joining us."
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <p className="mt-1 text-xs text-gray-500">
          Instructions or welcome text displayed above the RSVP form.
        </p>
      </div>

      <div className="space-y-4 border-t border-gray-100 pt-4">
        <p className="text-sm font-medium text-gray-700">Form Fields</p>

        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={content.showMealChoice}
            onChange={(e) => update({ showMealChoice: e.target.checked })}
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm text-gray-700">Show meal choice selection</span>
        </label>
        <p className="-mt-2 ml-7 text-xs text-gray-500">
          Guests can pick their meal preference (e.g., chicken, fish, vegetarian).
        </p>

        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={content.showDietary}
            onChange={(e) => update({ showDietary: e.target.checked })}
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm text-gray-700">Show dietary restrictions field</span>
        </label>
        <p className="-mt-2 ml-7 text-xs text-gray-500">
          Guests can note allergies or dietary needs (e.g., gluten-free, nut allergy).
        </p>

        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={content.showSongRequest}
            onChange={(e) => update({ showSongRequest: e.target.checked })}
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm text-gray-700">Show song request field</span>
        </label>
        <p className="-mt-2 ml-7 text-xs text-gray-500">
          Guests can suggest a song they&apos;d love to hear at the reception.
        </p>
      </div>
    </div>
  )
}
