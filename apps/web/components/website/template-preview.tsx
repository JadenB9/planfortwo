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
        selected ? 'border-wedding-600 shadow-md' : 'border-border hover:border-border',
      )}
    >
      <TemplatePreviewContent template={template} />
      <div className="px-2.5 py-2">
        <p className="text-xs font-semibold text-foreground">{template.name}</p>
        <p className="mt-0.5 line-clamp-1 text-[10px] leading-tight text-muted-foreground">
          {template.description}
        </p>
      </div>
      {selected && (
        <div className="bg-wedding-600 absolute right-1.5 top-1.5 rounded-full px-1.5 py-0.5 text-[10px] font-medium text-white">
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
      className="flex h-20 flex-col items-center justify-center"
      style={{ backgroundColor: defaultColors.background }}
    >
      <div
        className="mb-1 h-1.5 w-16 rounded-full"
        style={{ backgroundColor: defaultColors.primary }}
      />
      <div
        className="mb-2 h-1 w-10 rounded-full"
        style={{ backgroundColor: defaultColors.accent }}
      />
      <div className="flex gap-1">
        {[defaultColors.primary, defaultColors.secondary, defaultColors.accent].map((color, i) => (
          <div key={i} className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
        ))}
      </div>
    </div>
  )
}
