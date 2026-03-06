'use client'

import { useState, useRef } from 'react'
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
  onReorder,
  onDeleteCustom,
}: SectionManagerProps) {
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [overIndex, setOverIndex] = useState<number | null>(null)
  const sorted = [...sections].sort((a, b) => a.sortOrder - b.sortOrder)
  const dragNode = useRef<HTMLDivElement | null>(null)

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    setDragIndex(index)
    dragNode.current = e.currentTarget
    e.dataTransfer.effectAllowed = 'move'
    // Make the drag image slightly transparent
    requestAnimationFrame(() => {
      if (dragNode.current) {
        dragNode.current.style.opacity = '0.4'
      }
    })
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    if (dragIndex === null || dragIndex === index) return
    setOverIndex(index)
  }

  const handleDragLeave = () => {
    setOverIndex(null)
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, dropIndex: number) => {
    e.preventDefault()
    if (dragIndex === null || dragIndex === dropIndex) return

    const reordered = [...sorted]
    const [moved] = reordered.splice(dragIndex, 1)
    if (!moved) return
    reordered.splice(dropIndex, 0, moved)

    const mapped = reordered.map((s, i) => ({ id: s.id, sortOrder: i }))
    onReorder(mapped)

    setDragIndex(null)
    setOverIndex(null)
  }

  const handleDragEnd = () => {
    if (dragNode.current) {
      dragNode.current.style.opacity = '1'
    }
    setDragIndex(null)
    setOverIndex(null)
    dragNode.current = null
  }

  return (
    <div>
      <h3 className="mb-4 text-lg font-semibold text-gray-900">Manage Sections</h3>
      <div className="space-y-2">
        {sorted.map((section, i) => {
          const Icon = sectionIcons[section.sectionType]
          const label = sectionLabels[section.sectionType]
          const isDragging = dragIndex === i
          const isOver = overIndex === i && dragIndex !== i

          return (
            <div
              key={section.id}
              draggable
              onDragStart={(e) => handleDragStart(e, i)}
              onDragOver={(e) => handleDragOver(e, i)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, i)}
              onDragEnd={handleDragEnd}
              className={`flex items-center gap-3 rounded-xl border bg-white px-4 py-3 transition-all ${
                isDragging ? 'opacity-40 shadow-md' : 'shadow-sm'
              } ${isOver ? 'border-blue-400 ring-2 ring-blue-100' : 'border-gray-200'}`}
            >
              <GripVertical className="h-4 w-4 cursor-grab text-gray-400 active:cursor-grabbing" />
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
