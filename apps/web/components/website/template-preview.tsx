'use client'

import { cn } from '@/lib/utils'
import { getTemplate, type TemplateMetadata } from '@/lib/templates'

interface TemplatePreviewProps {
  templateId: string
  selected?: boolean
  onClick?: () => void
}

export function TemplatePreview({ templateId, selected = false, onClick }: TemplatePreviewProps) {
  const template = getTemplate(templateId)

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'group relative w-full overflow-hidden rounded-xl border-2 text-left transition-all hover:shadow-md',
        selected ? 'border-wedding-600 shadow-md' : 'border-gray-200 hover:border-gray-300',
      )}
    >
      <TemplatePreviewContent template={template} />
      <div className="p-3">
        <p className="text-sm font-semibold text-gray-900">{template.name}</p>
        <p className="mt-0.5 text-xs text-gray-500">{template.description}</p>
      </div>
      {selected && (
        <div className="bg-wedding-600 absolute right-2 top-2 rounded-full px-2 py-0.5 text-xs font-medium text-white">
          Active
        </div>
      )}
    </button>
  )
}

function TemplatePreviewContent({ template }: { template: TemplateMetadata }) {
  const { defaultColors } = template

  return (
    <div
      className="flex h-32 flex-col items-center justify-center"
      style={{ backgroundColor: defaultColors.background }}
    >
      <div
        className="mb-1 h-2 w-20 rounded-full"
        style={{ backgroundColor: defaultColors.primary }}
      />
      <div
        className="mb-3 h-1.5 w-14 rounded-full"
        style={{ backgroundColor: defaultColors.accent }}
      />
      <div className="flex gap-1">
        {[defaultColors.primary, defaultColors.secondary, defaultColors.accent].map((color, i) => (
          <div key={i} className="h-3 w-3 rounded-full" style={{ backgroundColor: color }} />
        ))}
      </div>
    </div>
  )
}
