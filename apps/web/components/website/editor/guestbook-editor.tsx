'use client'

import type { GuestbookSectionContent } from '@planfortwo/types'

interface GuestbookEditorProps {
  content: GuestbookSectionContent
  onChange: (content: GuestbookSectionContent) => void
}

export function GuestbookEditor({ content, onChange }: GuestbookEditorProps) {
  const update = (fields: Partial<GuestbookSectionContent>) => {
    onChange({ ...content, ...fields })
  }

  return (
    <div className="space-y-5">
      <div>
        <label htmlFor="guestbook-message" className="text-sm font-medium text-gray-700">
          Welcome Message
        </label>
        <textarea
          id="guestbook-message"
          rows={3}
          value={content.message}
          onChange={(e) => update({ message: e.target.value })}
          placeholder="Leave us a message! We'd love to hear your well wishes, advice, or favorite memories."
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <p className="mt-1 text-xs text-gray-500">
          This message is displayed above the guestbook form on your wedding website.
        </p>
      </div>

      <div className="border-t border-gray-100 pt-4">
        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={content.requireApproval}
            onChange={(e) => update({ requireApproval: e.target.checked })}
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm text-gray-700">Require approval before entries are visible</span>
        </label>
        <p className="ml-7 mt-1 text-xs text-gray-500">
          When enabled, new guestbook entries will be hidden until you approve them from the
          dashboard.
        </p>
      </div>
    </div>
  )
}
