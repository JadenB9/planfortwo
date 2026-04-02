'use client'

import { useState, useCallback } from 'react'
import type { WebsiteSection, WebsiteSectionType } from '@planfortwo/types'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { sectionIcons, sectionLabels } from '@/lib/section-icons'
import { GripVertical, Pencil, Trash2, Plus, ChevronDown } from 'lucide-react'

// Default built-in sections that can be added to a website
// Duplicated from packages/db/src/templates/website-sections.ts to avoid server-only imports
const ADDABLE_SECTIONS: { sectionType: string; title: string; content: Record<string, unknown> }[] =
  [
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

function SortableSection({
  section,
  onToggleVisibility,
  onEdit,
  onDeleteCustom,
}: {
  section: WebsiteSection
  onToggleVisibility: (id: string, visible: boolean) => void
  onEdit: (section: WebsiteSection) => void
  onDeleteCustom?: (id: string) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: section.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
    position: 'relative' as const,
  }

  const Icon = sectionIcons[section.sectionType]
  const label = sectionLabels[section.sectionType]

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className={`bg-background flex items-center gap-3 rounded-xl border px-4 py-3 transition-shadow ${
        isDragging
          ? 'border-wedding-200 bg-wedding-50 ring-wedding-200 shadow-md ring-1'
          : 'border-border shadow-sm'
      }`}
    >
      <span
        {...listeners}
        className="flex shrink-0 cursor-grab items-center active:cursor-grabbing"
        aria-label={`Drag to reorder ${section.title || label}`}
      >
        <GripVertical className="text-muted-foreground h-4 w-4" />
      </span>
      <Icon className="text-muted-foreground h-4 w-4" />
      <span className="text-foreground flex-1 text-sm font-medium">{section.title || label}</span>
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
}

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
  const [showAddMenu, setShowAddMenu] = useState(false)
  const sorted = [...sections].sort((a, b) => a.sortOrder - b.sortOrder)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  // Find built-in sections that are missing from this website
  const existingTypes = new Set(sections.map((s) => s.sectionType))
  const missingSections = ADDABLE_SECTIONS.filter(
    (d) => !existingTypes.has(d.sectionType as WebsiteSectionType),
  )

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event
      if (!over || active.id === over.id) return

      const oldIndex = sorted.findIndex((s) => s.id === active.id)
      const newIndex = sorted.findIndex((s) => s.id === over.id)
      if (oldIndex === -1 || newIndex === -1) return

      const reordered = [...sorted]
      const [moved] = reordered.splice(oldIndex, 1)
      if (!moved) return
      reordered.splice(newIndex, 0, moved)

      onReorder(reordered.map((s, i) => ({ id: s.id, sortOrder: i })))
    },
    [sorted, onReorder],
  )

  return (
    <div>
      <h3 className="text-foreground mb-4 text-lg font-semibold">Manage Sections</h3>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={sorted.map((s) => s.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {sorted.map((section) => (
              <SortableSection
                key={section.id}
                section={section}
                onToggleVisibility={onToggleVisibility}
                onEdit={onEdit}
                onDeleteCustom={onDeleteCustom}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {/* Add missing built-in sections */}
      {missingSections.length > 0 && onAddBuiltIn && (
        <div className="mt-4">
          <button
            type="button"
            onClick={() => setShowAddMenu((v) => !v)}
            className="text-muted-foreground hover:text-foreground flex items-center gap-2 text-sm font-medium transition-colors"
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
                    className="border-border bg-muted text-foreground flex items-center gap-2.5 rounded-lg border border-dashed px-3 py-2.5 text-left text-sm transition-colors hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700"
                  >
                    {Icon && <Icon className="text-muted-foreground h-4 w-4 shrink-0" />}
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
