'use client'

import { useCallback } from 'react'
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
import type { ChecklistTask, CategoryWithCount, FeatureGates } from '@planfortwo/types'
import { TaskCard } from './task-card'
import { EmptyState } from './empty-state'

interface TaskListProps {
  tasks: ChecklistTask[]
  categories: CategoryWithCount[]
  features: FeatureGates
  onToggleComplete: (id: string) => void
  onSelect: (id: string) => void
  onReorder: (tasks: { id: string; sortOrder: number }[]) => void
}

function SortableItem({
  task,
  categoryColor,
  features,
  onToggleComplete,
  onSelect,
}: {
  task: ChecklistTask
  categoryColor: string
  features: FeatureGates
  onToggleComplete: (id: string) => void
  onSelect: (id: string) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: task.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <TaskCard
        task={task}
        categoryColor={categoryColor}
        features={features}
        onToggleComplete={onToggleComplete}
        onSelect={onSelect}
        dragHandleProps={features.canReorderTasks ? listeners : undefined}
      />
    </div>
  )
}

export function TaskList({
  tasks,
  categories,
  features,
  onToggleComplete,
  onSelect,
  onReorder,
}: TaskListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const categoryColorMap = new Map(categories.map((c) => [c.id, c.color]))

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event
      if (!over || active.id === over.id) return

      const oldIndex = tasks.findIndex((t) => t.id === active.id)
      const newIndex = tasks.findIndex((t) => t.id === over.id)
      if (oldIndex === -1 || newIndex === -1) return

      const reordered = [...tasks]
      const moved = reordered[oldIndex]
      if (!moved) return
      reordered.splice(oldIndex, 1)
      reordered.splice(newIndex, 0, moved)

      const updates = reordered.map((t, i) => ({ id: t.id, sortOrder: i }))
      onReorder(updates)
    },
    [tasks, onReorder],
  )

  if (tasks.length === 0) {
    return (
      <EmptyState
        title="No tasks yet"
        description="Your checklist is empty. Add your first task to start planning your wedding."
      />
    )
  }

  const content = tasks.map((task) => (
    <SortableItem
      key={task.id}
      task={task}
      categoryColor={categoryColorMap.get(task.categoryId) ?? '#9CA3AF'}
      features={features}
      onToggleComplete={onToggleComplete}
      onSelect={onSelect}
    />
  ))

  if (!features.canReorderTasks) {
    return <div className="space-y-2">{content}</div>
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-2">{content}</div>
      </SortableContext>
    </DndContext>
  )
}
