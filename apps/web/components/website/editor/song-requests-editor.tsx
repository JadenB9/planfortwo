'use client'

import type { SongRequestsSectionContent } from '@planfortwo/types'

interface SongRequestsEditorProps {
  content: SongRequestsSectionContent
  onChange: (content: SongRequestsSectionContent) => void
}

export function SongRequestsEditor({ content, onChange }: SongRequestsEditorProps) {
  const update = (fields: Partial<SongRequestsSectionContent>) => {
    onChange({ ...content, ...fields })
  }

  return (
    <div className="space-y-5">
      <div>
        <label htmlFor="song-requests-message" className="text-foreground text-sm font-medium">
          Welcome Message
        </label>
        <textarea
          id="song-requests-message"
          rows={3}
          value={content.message}
          onChange={(e) => update({ message: e.target.value })}
          placeholder="Help us build our playlist! Request your favorite songs for our wedding celebration."
          className="border-border mt-1 block w-full rounded-md border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <p className="text-muted-foreground mt-1 text-xs">
          This message is displayed above the song request form on your wedding website.
        </p>
      </div>

      <div className="border-border border-t pt-4">
        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={content.showApproved}
            onChange={(e) => update({ showApproved: e.target.checked })}
            className="border-border h-4 w-4 rounded text-blue-600 focus:ring-blue-500"
          />
          <span className="text-foreground text-sm">Show approved requests on website</span>
        </label>
        <p className="text-muted-foreground ml-7 mt-1 text-xs">
          When enabled, guests will see a list of approved song requests below the submission form.
          You can approve requests from the Music dashboard.
        </p>
      </div>
    </div>
  )
}
