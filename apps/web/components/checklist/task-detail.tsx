'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@clerk/nextjs'
import type { TaskWithDetails, FeatureGates, CategoryWithCount } from '@planfortwo/types'
import { api } from '@/lib/api'

interface TaskDetailProps {
  taskId: string
  weddingId: string
  features: FeatureGates
  categories: CategoryWithCount[]
  onClose: () => void
  onUpdated: () => void
}

const PRIORITY_OPTIONS = [
  { value: 'must_do', label: 'Must Do' },
  { value: 'nice_to_have', label: 'Nice to Have' },
  { value: 'optional', label: 'Optional' },
] as const

export function TaskDetail({
  taskId,
  weddingId,
  features,
  categories,
  onClose,
  onUpdated,
}: TaskDetailProps) {
  const { getToken } = useAuth()
  const [task, setTask] = useState<TaskWithDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [noteContent, setNoteContent] = useState('')
  const [addingNote, setAddingNote] = useState(false)

  const [editTitle, setEditTitle] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editDueDate, setEditDueDate] = useState('')
  const [editCategoryId, setEditCategoryId] = useState('')
  const [editPriority, setEditPriority] = useState<string>('')

  const loadTask = useCallback(async () => {
    try {
      const token = await getToken()
      if (!token) return
      const { data } = await api.tasks.get(taskId, weddingId, token)
      setTask(data)
      setEditTitle(data.title)
      setEditDescription(data.description ?? '')
      setEditDueDate(data.dueDate ? (new Date(data.dueDate).toISOString().split('T')[0] ?? '') : '')
      setEditCategoryId(data.categoryId)
      setEditPriority(data.priority)
    } catch {
      /* silent */
    } finally {
      setLoading(false)
    }
  }, [taskId, getToken])

  useEffect(() => {
    void loadTask()
  }, [loadTask])

  async function handleSave() {
    if (!features.canEditChecklist) return
    setSaving(true)
    try {
      const token = await getToken()
      if (!token) return
      await api.tasks.update(
        taskId,
        {
          title: editTitle.trim(),
          description: editDescription.trim() || null,
          dueDate: editDueDate ? new Date(editDueDate).toISOString() : null,
          categoryId: editCategoryId,
          priority: editPriority as 'must_do' | 'nice_to_have' | 'optional',
        },
        token,
      )
      onUpdated()
      void loadTask()
    } catch {
      /* silent */
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!features.canDeleteTasks) return
    setDeleting(true)
    try {
      const token = await getToken()
      if (!token) return
      await api.tasks.delete(taskId, weddingId, token)
      onUpdated()
      onClose()
    } catch {
      /* silent */
    } finally {
      setDeleting(false)
    }
  }

  async function handleAddNote() {
    if (!noteContent.trim() || !features.canAddNotes) return
    setAddingNote(true)
    try {
      const token = await getToken()
      if (!token) return
      await api.tasks.addNote(taskId, { content: noteContent.trim() }, weddingId, token)
      setNoteContent('')
      void loadTask()
    } catch {
      /* silent */
    } finally {
      setAddingNote(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative w-full max-w-md overflow-y-auto bg-white shadow-xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4">
          <h2 className="font-serif text-lg font-semibold text-gray-900">Task Details</h2>
          <button onClick={onClose} className="text-gray-400 transition-colors hover:text-gray-600">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="border-wedding-200 border-t-wedding-600 h-6 w-6 animate-spin rounded-full border-2" />
          </div>
        ) : task ? (
          <div className="space-y-6 p-6">
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="detail-title"
                  className="mb-1 block text-sm font-medium text-gray-700"
                >
                  Title
                </label>
                <input
                  id="detail-title"
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  disabled={!features.canEditChecklist}
                  className="focus:border-wedding-600 focus:ring-wedding-600/20 w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm text-gray-900 shadow-sm transition-colors focus:outline-none focus:ring-2 disabled:bg-gray-50 disabled:text-gray-500"
                />
              </div>

              <div>
                <label
                  htmlFor="detail-desc"
                  className="mb-1 block text-sm font-medium text-gray-700"
                >
                  Description
                </label>
                <textarea
                  id="detail-desc"
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  disabled={!features.canEditChecklist}
                  rows={3}
                  className="focus:border-wedding-600 focus:ring-wedding-600/20 w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm text-gray-900 shadow-sm transition-colors focus:outline-none focus:ring-2 disabled:bg-gray-50 disabled:text-gray-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="detail-due"
                    className="mb-1 block text-sm font-medium text-gray-700"
                  >
                    Due Date
                  </label>
                  <input
                    id="detail-due"
                    type="date"
                    value={editDueDate}
                    onChange={(e) => setEditDueDate(e.target.value)}
                    disabled={!features.canEditChecklist}
                    className="focus:border-wedding-600 focus:ring-wedding-600/20 w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm text-gray-900 shadow-sm transition-colors focus:outline-none focus:ring-2 disabled:bg-gray-50 disabled:text-gray-500"
                  />
                </div>

                <div>
                  <label
                    htmlFor="detail-cat"
                    className="mb-1 block text-sm font-medium text-gray-700"
                  >
                    Category
                  </label>
                  <select
                    id="detail-cat"
                    value={editCategoryId}
                    onChange={(e) => setEditCategoryId(e.target.value)}
                    disabled={!features.canEditChecklist}
                    className="focus:border-wedding-600 focus:ring-wedding-600/20 w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm text-gray-900 shadow-sm transition-colors focus:outline-none focus:ring-2 disabled:bg-gray-50 disabled:text-gray-500"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label
                  htmlFor="detail-priority"
                  className="mb-1 block text-sm font-medium text-gray-700"
                >
                  Priority
                </label>
                <select
                  id="detail-priority"
                  value={editPriority}
                  onChange={(e) => setEditPriority(e.target.value)}
                  disabled={!features.canEditChecklist}
                  className="focus:border-wedding-600 focus:ring-wedding-600/20 w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm text-gray-900 shadow-sm transition-colors focus:outline-none focus:ring-2 disabled:bg-gray-50 disabled:text-gray-500"
                >
                  {PRIORITY_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {features.canEditChecklist && (
                <button
                  onClick={handleSave}
                  disabled={saving || !editTitle.trim()}
                  className="bg-wedding-600 hover:bg-wedding-700 w-full rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              )}
            </div>

            {/* Notes */}
            <div className="border-t border-gray-200 pt-6">
              <h3 className="mb-3 text-sm font-semibold text-gray-900">Notes</h3>

              {task.notes.length > 0 ? (
                <div className="mb-4 space-y-3">
                  {task.notes.map((note) => (
                    <div key={note.id} className="rounded-xl bg-gray-50 px-4 py-3">
                      <p className="text-sm text-gray-700">{note.content}</p>
                      <p className="mt-1 text-xs text-gray-500">
                        {new Date(note.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mb-4 text-sm text-gray-500">No notes yet.</p>
              )}

              {features.canAddNotes && (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={noteContent}
                    onChange={(e) => setNoteContent(e.target.value)}
                    placeholder="Add a note..."
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') void handleAddNote()
                    }}
                    className="focus:border-wedding-600 focus:ring-wedding-600/20 flex-1 rounded-xl border border-gray-300 px-4 py-2 text-sm text-gray-900 shadow-sm transition-colors focus:outline-none focus:ring-2"
                  />
                  <button
                    onClick={handleAddNote}
                    disabled={addingNote || !noteContent.trim()}
                    className="rounded-xl bg-gray-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {addingNote ? '...' : 'Add'}
                  </button>
                </div>
              )}
            </div>

            {/* Delete */}
            {features.canDeleteTasks && (
              <div className="border-t border-gray-200 pt-6">
                {confirmDelete ? (
                  <div className="rounded-xl border border-red-200 bg-red-50 p-4">
                    <p className="mb-3 text-sm text-red-700">
                      Are you sure? This action cannot be undone.
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={handleDelete}
                        disabled={deleting}
                        className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-50"
                      >
                        {deleting ? 'Deleting...' : 'Delete Task'}
                      </button>
                      <button
                        onClick={() => setConfirmDelete(false)}
                        className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmDelete(true)}
                    className="text-sm font-medium text-red-600 transition-colors hover:text-red-700"
                  >
                    Delete this task
                  </button>
                )}
              </div>
            )}
          </div>
        ) : (
          <p className="p-6 text-sm text-gray-500">Task not found.</p>
        )}
      </div>
    </div>
  )
}
