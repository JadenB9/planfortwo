'use client'

import type { HeroContent } from '@planfortwo/types'

interface HeroEditorProps {
  content: HeroContent
  onChange: (content: HeroContent) => void
}

export function HeroEditor({ content, onChange }: HeroEditorProps) {
  const update = (fields: Partial<HeroContent>) => {
    onChange({ ...content, ...fields })
  }

  return (
    <div className="space-y-5">
      <div>
        <label htmlFor="hero-headline" className="text-sm font-medium text-gray-700">
          Headline
        </label>
        <input
          id="hero-headline"
          type="text"
          value={content.headline}
          onChange={(e) => update({ headline: e.target.value })}
          placeholder="Sarah & James"
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      <div>
        <label htmlFor="hero-subheadline" className="text-sm font-medium text-gray-700">
          Subheadline
        </label>
        <input
          id="hero-subheadline"
          type="text"
          value={content.subheadline}
          onChange={(e) => update({ subheadline: e.target.value })}
          placeholder="We're getting married!"
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      <div>
        <label htmlFor="hero-bg-image" className="text-sm font-medium text-gray-700">
          Background Image URL
        </label>
        <input
          id="hero-bg-image"
          type="text"
          value={content.backgroundImageUrl ?? ''}
          onChange={(e) => update({ backgroundImageUrl: e.target.value || null })}
          placeholder="https://example.com/photo.jpg"
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <p className="mt-1 text-xs text-gray-500">
          Leave blank for a solid-color background using your template colors.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <input
          id="hero-show-date"
          type="checkbox"
          checked={content.showDate}
          onChange={(e) => update({ showDate: e.target.checked })}
          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
        <label htmlFor="hero-show-date" className="text-sm font-medium text-gray-700">
          Show wedding date
        </label>
      </div>

      <div className="flex items-center gap-3">
        <input
          id="hero-show-countdown"
          type="checkbox"
          checked={content.showCountdown}
          onChange={(e) => update({ showCountdown: e.target.checked })}
          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
        <label htmlFor="hero-show-countdown" className="text-sm font-medium text-gray-700">
          Show countdown timer
        </label>
      </div>
    </div>
  )
}
