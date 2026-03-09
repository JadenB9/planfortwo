'use client'

import { useState } from 'react'
import type { GuestWithTags, Household, GuestTag } from '@planfortwo/types'
import { GuestTagBadge } from './guest-tag-badge'
import { GuestForm } from './guest-form'
import type { GuestFormData } from './guest-form'

interface GuestDetailProps {
  guest: GuestWithTags
  households: Household[]
  tags: GuestTag[]
  guests?: GuestWithTags[]
  onUpdate: (data: GuestFormData) => Promise<void>
  onDelete: () => Promise<void>
  onClose: () => void
  canEdit: boolean
  canDelete: boolean
}

const RSVP_COLORS: Record<string, string> = {
  accepted: 'bg-green-50 text-green-700 border-green-200',
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  declined: 'bg-red-50 text-red-700 border-red-200',
  maybe: 'bg-blue-50 text-blue-700 border-blue-200',
}

export function GuestDetail({
  guest,
  households,
  tags,
  guests,
  onUpdate,
  onDelete,
  onClose,
  canEdit,
  canDelete,
}: GuestDetailProps) {
  const [editing, setEditing] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    setDeleting(true)
    try {
      await onDelete()
    } catch {
      setDeleting(false)
    }
  }

  if (editing) {
    return (
      <GuestForm
        guest={guest}
        households={households}
        tags={tags}
        guests={guests}
        onSubmit={async (data) => {
          await onUpdate(data)
          setEditing(false)
        }}
        onClose={() => setEditing(false)}
      />
    )
  }

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md border-l border-gray-200 bg-white shadow-xl">
      <div className="flex h-full flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <h2 className="font-serif text-lg font-semibold text-gray-900">
            {guest.firstName} {guest.lastName}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
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

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-5">
            {/* RSVP Status */}
            <div className={`rounded-xl border px-4 py-3 ${RSVP_COLORS[guest.rsvpStatus] ?? ''}`}>
              <p className="text-xs font-medium uppercase tracking-wider">RSVP Status</p>
              <p className="mt-0.5 text-sm font-semibold capitalize">{guest.rsvpStatus}</p>
              {guest.rsvpRespondedAt && (
                <p className="mt-1 text-xs opacity-70">
                  Responded {new Date(guest.rsvpRespondedAt).toLocaleDateString()}
                </p>
              )}
            </div>

            {/* Contact */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                Contact
              </h3>
              <div className="mt-2 space-y-1 text-sm text-gray-700">
                {guest.email && <p>{guest.email}</p>}
                {guest.phone && <p>{guest.phone}</p>}
                {!guest.email && !guest.phone && <p className="text-gray-400">No contact info</p>}
              </div>
            </div>

            {/* Details */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                Details
              </h3>
              <div className="mt-2 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Household</span>
                  <span className="text-gray-900">{guest.household?.name ?? '--'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Side</span>
                  <span className="capitalize text-gray-900">{guest.side ?? '--'}</span>
                </div>
                {guest.dietary?.notes && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Dietary</span>
                    <span className="text-gray-900">{guest.dietary.notes}</span>
                  </div>
                )}
                {guest.songRequest && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Song Request</span>
                    <span className="text-gray-900">{guest.songRequest}</span>
                  </div>
                )}
                {guest.rsvpNotes && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Notes</span>
                    <span className="text-gray-900">{guest.rsvpNotes}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Badges */}
            <div className="flex flex-wrap gap-2">
              {guest.isVip && (
                <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
                  VIP
                </span>
              )}
              {guest.isChild && (
                <span className="rounded-full bg-purple-50 px-2.5 py-1 text-xs font-medium text-purple-700">
                  Child{guest.age ? ` (age ${guest.age})` : ''}
                </span>
              )}
              {guest.hasPlusOne && (
                <span className="rounded-full bg-pink-50 px-2.5 py-1 text-xs font-medium text-pink-700">
                  +1{guest.plusOneName ? `: ${guest.plusOneName}` : ''}
                  {guest.plusOneConfirmed ? ' (confirmed)' : ''}
                </span>
              )}
            </div>

            {/* Tags */}
            {guest.tags.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Tags
                </h3>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {guest.tags.map((tag) => (
                    <GuestTagBadge key={tag.id} tag={tag} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        {(canEdit || canDelete) && (
          <div className="flex gap-3 border-t border-gray-200 px-6 py-4">
            {canEdit && (
              <button
                onClick={() => setEditing(true)}
                className="bg-wedding-600 hover:bg-wedding-700 flex-1 rounded-xl px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors"
              >
                Edit
              </button>
            )}
            {canDelete && (
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="rounded-xl border border-red-300 px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50"
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
