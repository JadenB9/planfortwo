'use client'

import { useState } from 'react'
import type { WebsiteSection } from '@planfortwo/types'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { sectionIcons, sectionLabels } from '@/lib/section-icons'
import { GripVertical, Pencil, Trash2 } from 'lucide-react'

interface SectionManagerProps {
  sections: WebsiteSection[]
  onToggleVisibility: (id: string, visible: boolean) => void
  onEdit: (section: WebsiteSection) => void
  onReorder: (sections: { id: string; sortOrder: number }[]) => void
  onDeleteCustom?: (id: string) => void
}

export function SectionManager({
  sections,
  onToggleVisibility,
  onEdit,
  onDeleteCustom,
}: SectionManagerProps) {
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const sorted = [...sections].sort((a, b) => a.sortOrder - b.sortOrder)

  return (
    <div>
      <h3 className="mb-4 text-lg font-semibold text-gray-900">Manage Sections</h3>
      <div className="space-y-2">
        {sorted.map((section, i) => {
          const Icon = sectionIcons[section.sectionType]
          const label = sectionLabels[section.sectionType]
          return (
            <div
              key={section.id}
              draggable
              onDragStart={() => setDragIndex(i)}
              onDragEnd={() => setDragIndex(null)}
              className={`flex items-center gap-3 rounded-xl border bg-white px-4 py-3 transition-shadow ${
                dragIndex === i ? 'shadow-md' : 'shadow-sm'
              }`}
            >
              <GripVertical className="h-4 w-4 cursor-grab text-gray-400" />
              <Icon className="h-4 w-4 text-gray-500" />
              <span className="flex-1 text-sm font-medium text-gray-900">
                {section.title || label}
              </span>
              <Switch
                checked={section.isVisible}
                onCheckedChange={(checked) => onToggleVisibility(section.id, checked)}
              />
              <Button variant="ghost" size="sm" onClick={() => onEdit(section)}>
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              {section.sectionType === 'custom' && onDeleteCustom && (
                <Button variant="ghost" size="sm" onClick={() => onDeleteCustom(section.id)}>
                  <Trash2 className="h-3.5 w-3.5 text-red-500" />
                </Button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
