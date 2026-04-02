'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import { Plus, Trash2, X, Check, User, ChevronDown, ChevronUp, GripVertical } from 'lucide-react'
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
import type { WeddingPartyContent } from '@planfortwo/types'

interface WeddingPartyEditorProps {
  content: WeddingPartyContent
  onChange: (content: WeddingPartyContent) => void
}

type MemberDraft = { name: string; role: string; description: string; imageUrl: string }
const emptyDraft: MemberDraft = { name: '', role: '', description: '', imageUrl: '' }

type Side = 'groom' | 'bride'
type MemberWithSide = WeddingPartyContent['members'][number] & { side: Side }

function detectSide(role: string): Side {
  return /bridesmaid|maid\s*of\s*honor|matron|flower\s*girl|bride/i.test(role) ? 'bride' : 'groom'
}

/* ─── Sortable Member Card ─────────────────────────────────── */
function SortableCard({
  member,
  sortId,
  otherLabel,
  onEdit,
  onRemove,
  onSwitch,
}: {
  member: MemberWithSide
  sortId: string
  otherLabel: string
  onEdit: () => void
  onRemove: () => void
  onSwitch: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: sortId,
  })

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : undefined,
        opacity: isDragging ? 0.5 : 1,
        position: 'relative' as const,
      }}
      {...attributes}
      className="border-border bg-background group relative flex flex-col rounded-lg border p-3 transition-shadow hover:shadow-sm"
    >
      {/* Drag handle */}
      <div
        className="text-muted-foreground absolute left-1 top-1/2 -translate-y-1/2 cursor-grab opacity-0 transition-opacity active:cursor-grabbing group-hover:opacity-100"
        {...listeners}
      >
        <GripVertical className="h-3.5 w-3.5" />
      </div>

      {/* Move to other side */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          onSwitch()
        }}
        className="text-muted-foreground absolute right-1.5 top-1.5 rounded p-0.5 opacity-0 transition-opacity hover:text-blue-500 group-hover:opacity-100"
        title={`Move to ${otherLabel}`}
      >
        {member.side === 'groom' ? (
          <ChevronDown className="h-3.5 w-3.5" />
        ) : (
          <ChevronUp className="h-3.5 w-3.5" />
        )}
      </button>

      {/* Remove */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          onRemove()
        }}
        className="text-muted-foreground/50 absolute bottom-1.5 right-1.5 rounded p-0.5 opacity-0 transition-opacity hover:text-red-500 group-hover:opacity-100"
        title="Remove member"
      >
        <X className="h-3.5 w-3.5" />
      </button>

      {/* Card body */}
      <button
        type="button"
        onClick={onEdit}
        className="flex min-w-0 items-start gap-3 pl-4 text-left"
      >
        {member.imageUrl ? (
          <img
            src={member.imageUrl}
            alt={member.name}
            className="h-10 w-10 flex-shrink-0 rounded-full object-cover"
          />
        ) : (
          <div className="bg-muted text-muted-foreground flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full">
            {member.name.trim() ? (
              <span className="text-sm font-semibold">
                {member.name.trim().charAt(0).toUpperCase()}
              </span>
            ) : (
              <User className="h-4 w-4" />
            )}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="text-foreground truncate text-sm font-semibold">{member.name}</p>
          <p className="text-muted-foreground truncate text-xs">{member.role}</p>
        </div>
      </button>
    </div>
  )
}

/* ─── Main Editor ──────────────────────────────────────────── */
export function WeddingPartyEditor({ content: rawContent, onChange }: WeddingPartyEditorProps) {
  const members: MemberWithSide[] = useMemo(
    () =>
      (rawContent.members ?? []).map((m) => ({
        ...m,
        side: m.side ?? detectSide(m.role),
      })),
    [rawContent.members],
  )

  // Normalize sides on mount for backward compat
  const didNormalize = useRef(false)
  useEffect(() => {
    if (didNormalize.current) return
    if (rawContent.members?.some((m) => !m.side)) {
      didNormalize.current = true
      onChange({
        ...rawContent,
        members: (rawContent.members ?? []).map((m) => ({
          ...m,
          side: m.side ?? detectSide(m.role),
        })),
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const groom = members.filter((m) => m.side === 'groom')
  const bride = members.filter((m) => m.side === 'bride')

  const [addingSide, setAddingSide] = useState<Side | null>(null)
  const [draft, setDraft] = useState<MemberDraft>({ ...emptyDraft })
  const [editKey, setEditKey] = useState<string | null>(null)
  const [editDraft, setEditDraft] = useState<MemberDraft>({ ...emptyDraft })

  const canSaveDraft = draft.name.trim() !== '' && draft.role.trim() !== ''
  const canSaveEdit = editDraft.name.trim() !== '' && editDraft.role.trim() !== ''

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  /* ── Data helpers ── */
  function emit(g: MemberWithSide[], b: MemberWithSide[]) {
    onChange({ ...rawContent, members: [...g, ...b] })
  }

  function addMember(side: Side) {
    if (!canSaveDraft) return
    const m: MemberWithSide = {
      name: draft.name.trim(),
      role: draft.role.trim(),
      description: draft.description.trim() || undefined,
      imageUrl: draft.imageUrl.trim() || undefined,
      side,
    }
    emit(side === 'groom' ? [...groom, m] : groom, side === 'bride' ? [...bride, m] : bride)
    setDraft({ ...emptyDraft })
    setAddingSide(null)
  }

  function removeMember(side: Side, idx: number) {
    emit(
      side === 'groom' ? groom.filter((_, i) => i !== idx) : groom,
      side === 'bride' ? bride.filter((_, i) => i !== idx) : bride,
    )
    if (editKey === `${side}-${idx}`) setEditKey(null)
  }

  function startEdit(side: Side, idx: number) {
    const m = (side === 'groom' ? groom : bride)[idx]
    if (!m) return
    setEditDraft({
      name: m.name,
      role: m.role,
      description: m.description ?? '',
      imageUrl: m.imageUrl ?? '',
    })
    setEditKey(`${side}-${idx}`)
  }

  function saveEdit() {
    if (!editKey || !canSaveEdit) return
    const [side, idxStr] = editKey.split('-') as [Side, string]
    const idx = Number(idxStr)
    const updated: MemberWithSide = {
      name: editDraft.name.trim(),
      role: editDraft.role.trim(),
      description: editDraft.description.trim() || undefined,
      imageUrl: editDraft.imageUrl.trim() || undefined,
      side,
    }
    emit(
      side === 'groom' ? groom.map((m, i) => (i === idx ? updated : m)) : groom,
      side === 'bride' ? bride.map((m, i) => (i === idx ? updated : m)) : bride,
    )
    setEditKey(null)
  }

  function switchSide(from: Side, idx: number) {
    const list = from === 'groom' ? groom : bride
    const m = list[idx]
    if (!m) return
    const to: Side = from === 'groom' ? 'bride' : 'groom'
    const moved = { ...m, side: to }
    emit(
      from === 'groom' ? groom.filter((_, i) => i !== idx) : [...groom, moved],
      from === 'bride' ? bride.filter((_, i) => i !== idx) : [...bride, moved],
    )
    if (editKey === `${from}-${idx}`) setEditKey(null)
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const [aSide, aIdx] = String(active.id).split('-') as [Side, string]
    const [oSide, oIdx] = String(over.id).split('-') as [Side, string]
    if (aSide !== oSide) return
    const list = [...(aSide === 'groom' ? groom : bride)]
    const [moved] = list.splice(Number(aIdx), 1)
    if (!moved) return
    list.splice(Number(oIdx), 0, moved)
    emit(aSide === 'groom' ? list : groom, aSide === 'bride' ? list : bride)
  }

  const groomIds = groom.map((_, i) => `groom-${i}`)
  const brideIds = bride.map((_, i) => `bride-${i}`)

  /* ── Shared form renderer ── */
  function renderMemberForm(mode: 'add' | 'edit', side: Side, idx?: number) {
    const d = mode === 'add' ? draft : editDraft
    const setD = mode === 'add' ? setDraft : setEditDraft
    const canSave = mode === 'add' ? canSaveDraft : canSaveEdit

    return (
      <div
        className={`rounded-lg border border-blue-200 bg-blue-50/50 p-4 ${mode === 'edit' ? 'col-span-2 md:col-span-3' : 'mt-3'}`}
      >
        <div className="mb-3 flex items-center justify-between">
          <span className="text-xs font-medium uppercase tracking-wide text-blue-600">
            {mode === 'add' ? 'New Member' : 'Editing Member'}
          </span>
          <button
            type="button"
            onClick={() => (mode === 'add' ? setAddingSide(null) : setEditKey(null))}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-foreground text-sm font-medium">
              Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={d.name}
              onChange={(e) => setD({ ...d, name: e.target.value })}
              placeholder="Jane Smith"
              className="border-border mt-1 block w-full rounded-md border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="text-foreground text-sm font-medium">
              Role <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={d.role}
              onChange={(e) => setD({ ...d, role: e.target.value })}
              placeholder={side === 'groom' ? 'Groomsman' : 'Bridesmaid'}
              className="border-border mt-1 block w-full rounded-md border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="mt-3">
          <label className="text-foreground text-sm font-medium">Bio (optional)</label>
          <textarea
            value={d.description}
            onChange={(e) => setD({ ...d, description: e.target.value })}
            placeholder="A short bio or how they know the couple..."
            rows={2}
            className="border-border mt-1 block w-full rounded-md border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="mt-3">
          <label className="text-foreground text-sm font-medium">Photo URL (optional)</label>
          <input
            type="text"
            value={d.imageUrl}
            onChange={(e) => setD({ ...d, imageUrl: e.target.value })}
            placeholder="https://example.com/photo.jpg"
            className="border-border mt-1 block w-full rounded-md border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="mt-4 flex items-center justify-between">
          {mode === 'edit' && idx !== undefined ? (
            <button
              type="button"
              onClick={() => removeMember(side, idx)}
              className="flex items-center gap-1 text-sm text-red-500 hover:text-red-700"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Remove
            </button>
          ) : (
            <span />
          )}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => (mode === 'add' ? setAddingSide(null) : setEditKey(null))}
              className="border-border text-foreground hover:bg-muted rounded-md border px-3 py-1.5 text-sm font-medium"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => (mode === 'add' ? addMember(side) : saveEdit())}
              disabled={!canSave}
              className="flex items-center gap-1 rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Check className="h-3.5 w-3.5" />
              {mode === 'add' ? 'Save Member' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  /* ── Group renderer ── */
  function renderGroup(title: string, side: Side, list: MemberWithSide[], ids: string[]) {
    const otherLabel = side === 'groom' ? "Bride's Side" : "Groom's Side"

    return (
      <div>
        <div className="flex items-center justify-between">
          <h4 className="text-foreground text-sm font-medium">{title}</h4>
          {addingSide !== side && (
            <button
              type="button"
              onClick={() => {
                setDraft({ ...emptyDraft })
                setAddingSide(side)
              }}
              className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-800"
            >
              <Plus className="h-4 w-4" />
              Add
            </button>
          )}
        </div>

        {addingSide === side && renderMemberForm('add', side)}

        {list.length === 0 && addingSide !== side && (
          <p className="text-muted-foreground mt-3 text-sm">
            No members yet. Click &quot;+ Add&quot; to add{' '}
            {side === 'groom' ? 'groomsmen' : 'bridesmaids'}.
          </p>
        )}

        {list.length > 0 && (
          <SortableContext items={ids} strategy={verticalListSortingStrategy}>
            <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-3">
              {list.map((member, index) =>
                editKey === `${side}-${index}` ? (
                  <div key={`${side}-${index}-edit`} className="col-span-2 md:col-span-3">
                    {renderMemberForm('edit', side, index)}
                  </div>
                ) : (
                  <SortableCard
                    key={ids[index]}
                    member={member}
                    sortId={ids[index]!}
                    otherLabel={otherLabel}
                    onEdit={() => startEdit(side, index)}
                    onRemove={() => removeMember(side, index)}
                    onSwitch={() => switchSide(side, index)}
                  />
                ),
              )}
            </div>
          </SortableContext>
        )}
      </div>
    )
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      {renderGroup("Groom's Side", 'groom', groom, groomIds)}

      {/* Divider */}
      <div className="my-5 flex items-center gap-4">
        <div className="border-border flex-1 border-t" />
        <span className="text-muted-foreground select-none text-xs uppercase tracking-wider">
          &amp;
        </span>
        <div className="border-border flex-1 border-t" />
      </div>

      {renderGroup("Bride's Side", 'bride', bride, brideIds)}
    </DndContext>
  )
}
