'use client'

import { Image } from 'lucide-react'
import type { GalleryContent } from '@planfortwo/types'

interface GalleryEditorProps {
  content: GalleryContent
  onChange: (content: GalleryContent) => void
}

export function GalleryEditor({ content, onChange }: GalleryEditorProps) {
  return (
    <div className="space-y-5">
      <div>
        <label htmlFor="gallery-layout" className="text-sm font-medium text-gray-700">
          Layout
        </label>
        <select
          id="gallery-layout"
          value={content.layout}
          onChange={(e) =>
            onChange({
              ...content,
              layout: e.target.value as GalleryContent['layout'],
            })
          }
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="grid">Grid</option>
          <option value="masonry">Masonry</option>
          <option value="slideshow">Slideshow</option>
        </select>
      </div>

      {content.layout === 'grid' && (
        <div>
          <label htmlFor="gallery-columns" className="text-sm font-medium text-gray-700">
            Columns
          </label>
          <input
            id="gallery-columns"
            type="number"
            min={2}
            max={6}
            value={content.columns}
            onChange={(e) => {
              const value = Math.min(6, Math.max(2, Number(e.target.value) || 2))
              onChange({ ...content, columns: value })
            }}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <p className="mt-1 text-xs text-gray-500">Between 2 and 6 columns.</p>
        </div>
      )}

      <div className="mt-4 border-t border-gray-100 pt-4">
        <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 p-4">
          <Image className="h-5 w-5 text-gray-400" />
          <p className="text-sm text-gray-600">
            Photos are managed in the <span className="font-medium text-gray-800">Photos</span>{' '}
            section of the website editor.
          </p>
        </div>
      </div>
    </div>
  )
}
