'use client'

import { Plus, Trash2 } from 'lucide-react'
import type { WeddingPartyContent } from '@planfortwo/types'

interface WeddingPartyEditorProps {
  content: WeddingPartyContent
  onChange: (content: WeddingPartyContent) => void
}

export function WeddingPartyEditor({ content, onChange }: WeddingPartyEditorProps) {
  const updateMember = (index: number, fields: Partial<WeddingPartyContent['members'][number]>) => {
    const updated = content.members.map((member, i) =>
      i === index ? { ...member, ...fields } : member,
    )
    onChange({ ...content, members: updated })
  }

  const addMember = () => {
    onChange({
      ...content,
      members: [...content.members, { name: '', role: '', description: '', imageUrl: '' }],
    })
  }

  const removeMember = (index: number) => {
    onChange({
      ...content,
      members: content.members.filter((_, i) => i !== index),
    })
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-gray-700">Party Members</h4>
        <button
          type="button"
          onClick={addMember}
          className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-800"
        >
          <Plus className="h-4 w-4" />
          Add Member
        </button>
      </div>

      {content.members.length === 0 && (
        <p className="mt-3 text-sm text-gray-500">
          No members yet. Add your bridesmaids, groomsmen, flower girls, ring bearers, and anyone
          else in the wedding party.
        </p>
      )}

      <div className="mt-3 space-y-4">
        {content.members.map((member, index) => (
          <div
            key={index}
            className={`rounded-lg border border-gray-200 p-4 ${
              index > 0 ? 'border-t border-gray-100' : ''
            }`}
          >
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wide text-gray-400">
                Member {index + 1}
              </span>
              <button
                type="button"
                onClick={() => removeMember(index)}
                className="flex items-center gap-1 text-sm text-red-500 hover:text-red-700"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Remove
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-gray-700">Name</label>
                <input
                  type="text"
                  value={member.name}
                  onChange={(e) => updateMember(index, { name: e.target.value })}
                  placeholder="Jane Smith"
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Role</label>
                <input
                  type="text"
                  value={member.role}
                  onChange={(e) => updateMember(index, { role: e.target.value })}
                  placeholder="Maid of Honor"
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="mt-3">
              <label className="text-sm font-medium text-gray-700">Bio (optional)</label>
              <textarea
                value={member.description ?? ''}
                onChange={(e) =>
                  updateMember(index, {
                    description: e.target.value || undefined,
                  })
                }
                placeholder="A short bio or how they know the couple..."
                rows={2}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="mt-3">
              <label className="text-sm font-medium text-gray-700">Photo URL (optional)</label>
              <input
                type="text"
                value={member.imageUrl ?? ''}
                onChange={(e) =>
                  updateMember(index, {
                    imageUrl: e.target.value || undefined,
                  })
                }
                placeholder="https://example.com/photo.jpg"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
