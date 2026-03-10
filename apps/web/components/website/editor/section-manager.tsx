'use client'

import { useState, useRef } from 'react'
import type { WebsiteSection, WebsiteSectionType } from '@planfortwo/types'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { sectionIcons, sectionLabels } from '@/lib/section-icons'
import { GripVertical, Pencil, Trash2, Plus, ChevronDown } from 'lucide-react'
// Default built-in sections that can be added to a website
// Duplicated from packages/db/src/templates/website-sections.ts to avoid server-only imports
const ADDABLE_SECTIONS: { sectionType: string; title: string; content: Record<string, unknown> }[] =
  [
    {
      sectionType: 'prayers',
      title: 'Prayers',
      content: {
        requireApproval: true,
        message:
          'We would be honored to have your prayers and blessings as we begin this new chapter together.',
      },
    },
    {
      sectionType: 'guestbook',
      title: 'Guestbook',
      content: { requireApproval: true, message: 'Leave us a message!' },
    },
    { sectionType: 'schedule', title: 'Schedule', content: { items: [] } },
    { sectionType: 'things_to_do', title: 'Things to Do', content: { activities: [] } },
    {
      sectionType: 'travel',
      title: 'Travel & Accommodations',
      content: { accommodations: [], directions: '', mapEmbed: null },
    },
    { sectionType: 'faq', title: 'FAQ', content: { questions: [] } },
  ]

interface SectionManagerProps {
  sections: WebsiteSection[]
  onToggleVisibility: (id: string, visible: boolean) => void
  onEdit: (section: WebsiteSection) => void
  onReorder: (sections: { id: string; sortOrder: number }[]) => void
  onDeleteCustom?: (id: string) => void
  onAddBuiltIn?: (sectionType: string, title: string, content: Record<string, unknown>) => void
}

export function SectionManager({
  sections,
  onToggleVisibility,
  onEdit,
  onReorder,
  onDeleteCustom,
  onAddBuiltIn,
}: SectionManagerProps) {
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [overIndex, setOverIndex] = useState<number | null>(null)
  const [showAddMenu, setShowAddMenu] = useState(false)
  const sorted = [...sections].sort((a, b) => a.sortOrder - b.sortOrder)
  const dragNode = useRef<HTMLDivElement | null>(null)

  // Find built-in sections that are missing from this website
  const existingTypes = new Set(sections.map((s) => s.sectionType))
  const missingSections = ADDABLE_SECTIONS.filter(
    (d) => !existingTypes.has(d.sectionType as WebsiteSectionType),
  )

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

      {/* Add missing built-in sections */}
      {missingSections.length > 0 && onAddBuiltIn && (
        <div className="mt-4">
          <button
            type="button"
            onClick={() => setShowAddMenu((v) => !v)}
            className="flex items-center gap-2 text-sm font-medium text-gray-600 transition-colors hover:text-gray-900"
          >
            <Plus className="h-4 w-4" />
            Add Section
            <ChevronDown
              className={`h-3.5 w-3.5 transition-transform ${showAddMenu ? 'rotate-180' : ''}`}
            />
          </button>
          {showAddMenu && (
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {missingSections.map((def) => {
                const Icon = sectionIcons[def.sectionType as WebsiteSectionType]
                const label = sectionLabels[def.sectionType as WebsiteSectionType]
                return (
                  <button
                    key={def.sectionType}
                    type="button"
                    onClick={() => {
                      onAddBuiltIn(def.sectionType, def.title, def.content)
                      setShowAddMenu(false)
                    }}
                    className="flex items-center gap-2.5 rounded-lg border border-dashed border-gray-300 bg-gray-50 px-3 py-2.5 text-left text-sm text-gray-700 transition-colors hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700"
                  >
                    {Icon && <Icon className="h-4 w-4 shrink-0 text-gray-400" />}
                    <span>{label ?? def.title}</span>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
