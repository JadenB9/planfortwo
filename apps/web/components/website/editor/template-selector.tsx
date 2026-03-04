'use client'

import { templates } from '@/lib/templates'
import { TemplatePreview } from '../template-preview'

interface TemplateSelectorProps {
  selectedId: string
  onSelect: (templateId: string) => void
}

export function TemplateSelector({ selectedId, onSelect }: TemplateSelectorProps) {
  return (
    <div>
      <h3 className="mb-4 text-lg font-semibold text-gray-900">Choose a Template</h3>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {templates.map((t) => (
          <TemplatePreview
            key={t.id}
            templateId={t.id}
            selected={t.id === selectedId}
            onClick={() => onSelect(t.id)}
          />
        ))}
      </div>
    </div>
  )
}
