'use client'

import { Plus, Trash2 } from 'lucide-react'
import type { RegistryContent } from '@planfortwo/types'

interface RegistryEditorProps {
  content: RegistryContent
  onChange: (content: RegistryContent) => void
}

export function RegistryEditor({ content, onChange }: RegistryEditorProps) {
  const registries = content.registries ?? []

  function updateRegistry(
    index: number,
    field: keyof RegistryContent['registries'][number],
    value: string,
  ) {
    const updated = registries.map((reg, i) => (i === index ? { ...reg, [field]: value } : reg))
    onChange({ ...content, registries: updated })
  }

  function addRegistry() {
    onChange({
      ...content,
      registries: [...registries, { name: '', url: '', logoUrl: '' }],
    })
  }

  function removeRegistry(index: number) {
    onChange({
      ...content,
      registries: registries.filter((_, i) => i !== index),
    })
  }

  return (
    <div className="space-y-5">
      {/* Message */}
      <div>
        <label htmlFor="registry-message" className="text-sm font-medium text-gray-700">
          Message
        </label>
        <textarea
          id="registry-message"
          value={content.message ?? ''}
          onChange={(e) => onChange({ ...content, message: e.target.value })}
          placeholder="Your presence is the greatest gift, but if you'd like to honor us with something special..."
          rows={3}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      {/* Registries */}
      <div className="mt-4 border-t border-gray-100 pt-4">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-gray-700">Registries</label>
          <button
            type="button"
            onClick={addRegistry}
            className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-800"
          >
            <Plus className="h-4 w-4" />
            Add
          </button>
        </div>

        {registries.length === 0 && (
          <p className="mt-2 text-sm text-gray-500">
            No registries added yet. Link to your gift registries so guests know where to shop.
          </p>
        )}

        <div className="mt-3 space-y-4">
          {registries.map((reg, index) => (
            <div key={index} className="relative rounded-lg border border-gray-200 p-4">
              <button
                type="button"
                onClick={() => removeRegistry(index)}
                className="absolute right-3 top-3 flex items-center gap-1 text-sm text-red-500 hover:text-red-700"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Remove
              </button>

              <div className="space-y-3 pr-20">
                <div>
                  <label
                    htmlFor={`reg-name-${index}`}
                    className="text-sm font-medium text-gray-700"
                  >
                    Registry Name
                  </label>
                  <input
                    id={`reg-name-${index}`}
                    type="text"
                    value={reg.name}
                    onChange={(e) => updateRegistry(index, 'name', e.target.value)}
                    placeholder="e.g. Amazon, Crate & Barrel, Zola"
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label htmlFor={`reg-url-${index}`} className="text-sm font-medium text-gray-700">
                    Registry URL
                  </label>
                  <input
                    id={`reg-url-${index}`}
                    type="text"
                    value={reg.url}
                    onChange={(e) => updateRegistry(index, 'url', e.target.value)}
                    placeholder="https://www.amazon.com/wedding/your-registry"
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label
                    htmlFor={`reg-logo-${index}`}
                    className="text-sm font-medium text-gray-700"
                  >
                    Logo URL <span className="font-normal text-gray-400">(optional)</span>
                  </label>
                  <input
                    id={`reg-logo-${index}`}
                    type="text"
                    value={reg.logoUrl ?? ''}
                    onChange={(e) => updateRegistry(index, 'logoUrl', e.target.value)}
                    placeholder="https://example.com/logo.png"
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
