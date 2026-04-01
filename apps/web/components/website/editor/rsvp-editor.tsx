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
        <label htmlFor="rsvp-message" className="text-sm font-medium text-foreground">
          RSVP Message
        </label>
        <textarea
          id="rsvp-message"
          rows={3}
          value={content.message}
          onChange={(e) => update({ message: e.target.value })}
          placeholder="We can't wait to celebrate with you! Please let us know if you'll be joining us."
          className="mt-1 block w-full rounded-md border border-border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <p className="mt-1 text-xs text-muted-foreground">
          Instructions or welcome text displayed above the RSVP form.
        </p>
      </div>

      <div className="space-y-4 border-t border-border pt-4">
        <p className="text-sm font-medium text-foreground">Form Fields</p>

        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={content.showDietary}
            onChange={(e) => update({ showDietary: e.target.checked })}
            className="h-4 w-4 rounded border-border text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm text-foreground">Show dietary restrictions field</span>
        </label>
        <p className="-mt-2 ml-7 text-xs text-muted-foreground">
          Guests can note allergies or dietary needs (e.g., gluten-free, nut allergy).
        </p>
      </div>
    </div>
  )
}
