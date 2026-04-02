'use client'

import type { PrayersSectionContent } from '@planfortwo/types'

interface PrayersEditorProps {
  content: PrayersSectionContent
  onChange: (content: PrayersSectionContent) => void
}

export function PrayersEditor({ content, onChange }: PrayersEditorProps) {
  const update = (fields: Partial<PrayersSectionContent>) => {
    onChange({ ...content, ...fields })
  }

  return (
    <div className="space-y-5">
      <div>
        <label htmlFor="prayers-message" className="text-foreground text-sm font-medium">
          Welcome Message
        </label>
        <textarea
          id="prayers-message"
          rows={3}
          value={content.message}
          onChange={(e) => update({ message: e.target.value })}
          placeholder="We would be honored to have your prayers and blessings as we begin this new chapter together."
          className="border-border mt-1 block w-full rounded-md border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <p className="text-muted-foreground mt-1 text-xs">
          This message is displayed above the prayer form on your wedding website.
        </p>
      </div>

      <div className="border-border border-t pt-4">
        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={content.requireApproval}
            onChange={(e) => update({ requireApproval: e.target.checked })}
            className="border-border h-4 w-4 rounded text-blue-600 focus:ring-blue-500"
          />
          <span className="text-foreground text-sm">
            Require approval before prayers are visible
          </span>
        </label>
        <p className="text-muted-foreground ml-7 mt-1 text-xs">
          When enabled, new prayers will be hidden until you approve them from the Prayers page.
        </p>
      </div>
    </div>
  )
}
