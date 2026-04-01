'use client'

import { useState, useCallback } from 'react'
import { Plus, Trash2, ChevronUp, ChevronDown, X, Check, User } from 'lucide-react'
import type { WeddingPartyContent } from '@planfortwo/types'

interface WeddingPartyEditorProps {
  content: WeddingPartyContent
  onChange: (content: WeddingPartyContent) => void
}

type MemberDraft = {
  name: string
  role: string
  description: string
  imageUrl: string
}

const emptyDraft: MemberDraft = { name: '', role: '', description: '', imageUrl: '' }

export function WeddingPartyEditor({ content: rawContent, onChange }: WeddingPartyEditorProps) {
  const content = { ...rawContent, members: rawContent.members ?? [] }
  const [showAddForm, setShowAddForm] = useState(false)
  const [draft, setDraft] = useState<MemberDraft>({ ...emptyDraft })
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [editDraft, setEditDraft] = useState<MemberDraft>({ ...emptyDraft })

  const canSaveDraft = draft.name.trim() !== '' && draft.role.trim() !== ''
  const canSaveEdit = editDraft.name.trim() !== '' && editDraft.role.trim() !== ''

  const addMember = useCallback(() => {
    if (!canSaveDraft) return
    const newMember = {
      name: draft.name.trim(),
      role: draft.role.trim(),
      description: draft.description.trim() || undefined,
      imageUrl: draft.imageUrl.trim() || undefined,
    }
    onChange({ ...content, members: [...content.members, newMember] })
    setDraft({ ...emptyDraft })
    setShowAddForm(false)
  }, [canSaveDraft, draft, content, onChange])

  const removeMember = useCallback(
    (index: number) => {
      onChange({
        ...content,
        members: content.members.filter((_, i) => i !== index),
      })
      if (editingIndex === index) {
        setEditingIndex(null)
      } else if (editingIndex !== null && editingIndex > index) {
        setEditingIndex(editingIndex - 1)
      }
    },
    [content, onChange, editingIndex],
  )

  const startEdit = useCallback(
    (index: number) => {
      const member = content.members[index]
      if (!member) return
      setEditDraft({
        name: member.name,
        role: member.role,
        description: member.description ?? '',
        imageUrl: member.imageUrl ?? '',
      })
      setEditingIndex(index)
    },
    [content.members],
  )

  const saveEdit = useCallback(() => {
    if (editingIndex === null || !canSaveEdit) return
    const updated = content.members.map((member, i) =>
      i === editingIndex
        ? {
            name: editDraft.name.trim(),
            role: editDraft.role.trim(),
            description: editDraft.description.trim() || undefined,
            imageUrl: editDraft.imageUrl.trim() || undefined,
          }
        : member,
    )
    onChange({ ...content, members: updated })
    setEditingIndex(null)
  }, [editingIndex, canSaveEdit, editDraft, content, onChange])

  const cancelEdit = useCallback(() => {
    setEditingIndex(null)
  }, [])

  const moveUp = useCallback(
    (index: number) => {
      if (index === 0) return
      const members = [...content.members]
      const prev = members[index - 1]
      const curr = members[index]
      if (!prev || !curr) return
      members[index - 1] = curr
      members[index] = prev
      onChange({ ...content, members })
      if (editingIndex === index) setEditingIndex(index - 1)
      else if (editingIndex === index - 1) setEditingIndex(index)
    },
    [content, onChange, editingIndex],
  )

  const moveDown = useCallback(
    (index: number) => {
      if (index >= content.members.length - 1) return
      const members = [...content.members]
      const next = members[index + 1]
      const curr = members[index]
      if (!next || !curr) return
      members[index + 1] = curr
      members[index] = next
      onChange({ ...content, members })
      if (editingIndex === index) setEditingIndex(index + 1)
      else if (editingIndex === index + 1) setEditingIndex(index)
    },
    [content, onChange, editingIndex],
  )

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-foreground">Party Members</h4>
        {!showAddForm && (
          <button
            type="button"
            onClick={() => {
              setDraft({ ...emptyDraft })
              setShowAddForm(true)
            }}
            className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-800"
          >
            <Plus className="h-4 w-4" />
            Add Member
          </button>
        )}
      </div>

      {/* Add Member Form (at the top) */}
      {showAddForm && (
        <div className="mt-3 rounded-lg border border-blue-200 bg-blue-50/50 p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wide text-blue-600">
              New Member
            </span>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="text-muted-foreground hover:text-muted-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-foreground">
                Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                placeholder="Jane Smith"
                className="mt-1 block w-full rounded-md border border-border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">
                Role <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={draft.role}
                onChange={(e) => setDraft({ ...draft, role: e.target.value })}
                placeholder="Maid of Honor"
                className="mt-1 block w-full rounded-md border border-border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="mt-3">
            <label className="text-sm font-medium text-foreground">Bio (optional)</label>
            <textarea
              value={draft.description}
              onChange={(e) => setDraft({ ...draft, description: e.target.value })}
              placeholder="A short bio or how they know the couple..."
              rows={2}
              className="mt-1 block w-full rounded-md border border-border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="mt-3">
            <label className="text-sm font-medium text-foreground">Photo URL (optional)</label>
            <input
              type="text"
              value={draft.imageUrl}
              onChange={(e) => setDraft({ ...draft, imageUrl: e.target.value })}
              placeholder="https://example.com/photo.jpg"
              className="mt-1 block w-full rounded-md border border-border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="mt-4 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="rounded-md border border-border px-3 py-1.5 text-sm font-medium text-foreground hover:bg-muted"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={addMember}
              disabled={!canSaveDraft}
              className="flex items-center gap-1 rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Check className="h-3.5 w-3.5" />
              Save Member
            </button>
          </div>
        </div>
      )}

      {/* Empty state */}
      {content.members.length === 0 && !showAddForm && (
        <p className="mt-3 text-sm text-muted-foreground">
          No members yet. Add your bridesmaids, groomsmen, flower girls, ring bearers, and anyone
          else in the wedding party.
        </p>
      )}

      {/* Members Grid */}
      {content.members.length > 0 && (
        <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3">
          {content.members.map((member, index) =>
            editingIndex === index ? (
              /* Expanded edit form (replaces card) */
              <div
                key={index}
                className="col-span-2 rounded-lg border border-blue-200 bg-blue-50/50 p-4 md:col-span-3"
              >
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-xs font-medium uppercase tracking-wide text-blue-600">
                    Editing Member
                  </span>
                  <button
                    type="button"
                    onClick={cancelEdit}
                    className="text-muted-foreground hover:text-muted-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium text-foreground">
                      Name <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={editDraft.name}
                      onChange={(e) => setEditDraft({ ...editDraft, name: e.target.value })}
                      placeholder="Jane Smith"
                      className="mt-1 block w-full rounded-md border border-border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground">
                      Role <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={editDraft.role}
                      onChange={(e) => setEditDraft({ ...editDraft, role: e.target.value })}
                      placeholder="Maid of Honor"
                      className="mt-1 block w-full rounded-md border border-border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="mt-3">
                  <label className="text-sm font-medium text-foreground">Bio (optional)</label>
                  <textarea
                    value={editDraft.description}
                    onChange={(e) => setEditDraft({ ...editDraft, description: e.target.value })}
                    placeholder="A short bio or how they know the couple..."
                    rows={2}
                    className="mt-1 block w-full rounded-md border border-border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div className="mt-3">
                  <label className="text-sm font-medium text-foreground">Photo URL (optional)</label>
                  <input
                    type="text"
                    value={editDraft.imageUrl}
                    onChange={(e) => setEditDraft({ ...editDraft, imageUrl: e.target.value })}
                    placeholder="https://example.com/photo.jpg"
                    className="mt-1 block w-full rounded-md border border-border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => removeMember(index)}
                    className="flex items-center gap-1 text-sm text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Remove
                  </button>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={cancelEdit}
                      className="rounded-md border border-border px-3 py-1.5 text-sm font-medium text-foreground hover:bg-muted"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={saveEdit}
                      disabled={!canSaveEdit}
                      className="flex items-center gap-1 rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Check className="h-3.5 w-3.5" />
                      Save
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* Compact member card */
              <div
                key={index}
                className="group relative flex flex-col rounded-lg border border-border bg-white p-3 transition-shadow hover:shadow-sm"
              >
                {/* Reorder buttons */}
                <div className="absolute right-1.5 top-1.5 flex flex-col opacity-0 transition-opacity group-hover:opacity-100">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      moveUp(index)
                    }}
                    disabled={index === 0}
                    className="rounded p-0.5 text-muted-foreground hover:text-muted-foreground disabled:invisible"
                    title="Move up"
                  >
                    <ChevronUp className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      moveDown(index)
                    }}
                    disabled={index === content.members.length - 1}
                    className="rounded p-0.5 text-muted-foreground hover:text-muted-foreground disabled:invisible"
                    title="Move down"
                  >
                    <ChevronDown className="h-3.5 w-3.5" />
                  </button>
                </div>

                {/* Remove button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    removeMember(index)
                  }}
                  className="absolute bottom-1.5 right-1.5 rounded p-0.5 text-muted-foreground/50 opacity-0 transition-opacity hover:text-red-500 group-hover:opacity-100"
                  title="Remove member"
                >
                  <X className="h-3.5 w-3.5" />
                </button>

                {/* Clickable card body */}
                <button
                  type="button"
                  onClick={() => startEdit(index)}
                  className="flex min-w-0 items-start gap-3 text-left"
                >
                  {/* Avatar */}
                  {member.imageUrl ? (
                    <img
                      src={member.imageUrl}
                      alt={member.name}
                      className="h-10 w-10 flex-shrink-0 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                      {member.name.trim() ? (
                        <span className="text-sm font-semibold">
                          {member.name.trim().charAt(0).toUpperCase()}
                        </span>
                      ) : (
                        <User className="h-4 w-4" />
                      )}
                    </div>
                  )}

                  {/* Name + Role */}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-foreground">{member.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{member.role}</p>
                  </div>
                </button>
              </div>
            ),
          )}
        </div>
      )}
    </div>
  )
}
