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
        <label htmlFor="guestbook-message" className="text-foreground text-sm font-medium">
          Welcome Message
        </label>
        <textarea
          id="guestbook-message"
          rows={3}
          value={content.message}
          onChange={(e) => update({ message: e.target.value })}
          placeholder="Leave us a message! We'd love to hear your well wishes, advice, or favorite memories."
          className="border-border mt-1 block w-full rounded-md border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <p className="text-muted-foreground mt-1 text-xs">
          This message is displayed above the guestbook form on your wedding website.
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
            Require approval before entries are visible
          </span>
        </label>
        <p className="text-muted-foreground ml-7 mt-1 text-xs">
          When enabled, new guestbook entries will be hidden until you approve them from Messages
          under More.
        </p>
      </div>
    </div>
  )
}
