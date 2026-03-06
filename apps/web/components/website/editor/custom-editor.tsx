'use client'

import type { CustomSectionContent } from '@planfortwo/types'

interface CustomEditorProps {
  content: CustomSectionContent
  onChange: (content: CustomSectionContent) => void
}

export function CustomEditor({ content, onChange }: CustomEditorProps) {
  const update = (fields: Partial<CustomSectionContent>) => {
    onChange({ ...content, ...fields })
  }

  return (
    <div className="space-y-5">
      <div>
        <label htmlFor="custom-html" className="text-sm font-medium text-gray-700">
          HTML Content
        </label>
        <textarea
          id="custom-html"
          rows={6}
          value={content.body}
          onChange={(e) => update({ body: e.target.value })}
          placeholder="<p>Your custom content here...</p>"
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 font-mono text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <p className="mt-1 text-xs text-gray-500">
          HTML content is sanitized for security. Basic tags like{' '}
          <code className="rounded bg-gray-100 px-1 py-0.5 text-xs">{'<b>'}</code>,{' '}
          <code className="rounded bg-gray-100 px-1 py-0.5 text-xs">{'<i>'}</code>,{' '}
          <code className="rounded bg-gray-100 px-1 py-0.5 text-xs">{'<a>'}</code>,{' '}
          <code className="rounded bg-gray-100 px-1 py-0.5 text-xs">{'<p>'}</code>,{' '}
          <code className="rounded bg-gray-100 px-1 py-0.5 text-xs">{'<br>'}</code>,{' '}
          <code className="rounded bg-gray-100 px-1 py-0.5 text-xs">{'<ul>'}</code>,{' '}
          <code className="rounded bg-gray-100 px-1 py-0.5 text-xs">{'<ol>'}</code>,{' '}
          <code className="rounded bg-gray-100 px-1 py-0.5 text-xs">{'<li>'}</code>, and{' '}
          <code className="rounded bg-gray-100 px-1 py-0.5 text-xs">{'<h1>'}</code>
          {'-'}
          <code className="rounded bg-gray-100 px-1 py-0.5 text-xs">{'<h6>'}</code> are supported.
        </p>
      </div>
    </div>
  )
}
