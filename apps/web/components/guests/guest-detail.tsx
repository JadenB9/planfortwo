'use client'

import { useState } from 'react'
import type { GuestWithTags, Household, GuestTag, RsvpStatus } from '@planfortwo/types'
import { GuestTagBadge } from './guest-tag-badge'
import { GuestForm } from './guest-form'
import type { GuestFormData } from './guest-form'

interface GuestDetailProps {
  guest: GuestWithTags
  households: Household[]
  tags: GuestTag[]
  guests?: GuestWithTags[]
  onUpdate: (data: GuestFormData) => Promise<void>
  onRsvpChange?: (status: RsvpStatus) => Promise<void>
  onDelete: () => Promise<void>
  onClose: () => void
  canEdit: boolean
  canDelete: boolean
}

export function GuestDetail({
  guest,
  households,
  tags,
  guests,
  onUpdate,
  onRsvpChange,
  onDelete,
  onClose,
  canEdit,
  canDelete,
}: GuestDetailProps) {
  const [editing, setEditing] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [changingRsvp, setChangingRsvp] = useState(false)

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
    <div className="border-border bg-background fixed inset-y-0 right-0 z-50 w-full max-w-md border-l shadow-xl">
      <div className="flex h-full flex-col">
        {/* Header */}
        <div className="border-border flex items-center justify-between border-b px-6 py-4">
          <h2 className="text-foreground font-serif text-lg font-semibold">
            {guest.firstName} {guest.lastName}
          </h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-muted-foreground">
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
            <div>
              <p className="text-muted-foreground mb-2 text-xs font-semibold uppercase tracking-wider">
                RSVP Status
              </p>
              <div className="flex flex-wrap gap-2">
                {(['accepted', 'maybe', 'declined', 'pending'] as RsvpStatus[]).map((status) => {
                  const active = guest.rsvpStatus === status
                  const baseStyles: Record<string, string> = {
                    accepted: active
                      ? 'bg-green-600 text-white border-green-600'
                      : 'border-border text-muted-foreground hover:border-green-400 hover:text-green-600',
                    maybe: active
                      ? 'bg-amber-500 text-white border-amber-500'
                      : 'border-border text-muted-foreground hover:border-amber-400 hover:text-amber-600',
                    declined: active
                      ? 'bg-red-600 text-white border-red-600'
                      : 'border-border text-muted-foreground hover:border-red-400 hover:text-red-600',
                    pending: active
                      ? 'bg-gray-700 text-white border-gray-700'
                      : 'border-border text-muted-foreground hover:border-border hover:text-foreground',
                  }
                  return (
                    <button
                      key={status}
                      disabled={changingRsvp || !canEdit}
                      onClick={async () => {
                        if (active || !onRsvpChange) return
                        setChangingRsvp(true)
                        try {
                          await onRsvpChange(status)
                        } finally {
                          setChangingRsvp(false)
                        }
                      }}
                      className={`rounded-lg border px-3 py-1.5 text-xs font-medium capitalize transition-colors ${baseStyles[status]} ${!canEdit ? 'cursor-default' : 'cursor-pointer'}`}
                    >
                      {status}
                    </button>
                  )
                })}
              </div>
              {guest.rsvpRespondedAt && (
                <p className="text-muted-foreground mt-2 text-xs">
                  Responded {new Date(guest.rsvpRespondedAt).toLocaleDateString()}
                </p>
              )}
            </div>

            {/* Contact */}
            <div>
              <h3 className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">
                Contact
              </h3>
              <div className="text-foreground mt-2 space-y-1 text-sm">
                {guest.email && <p>{guest.email}</p>}
                {guest.phone && <p>{guest.phone}</p>}
                {!guest.email && !guest.phone && (
                  <p className="text-muted-foreground">No contact info</p>
                )}
              </div>
            </div>

            {/* Details */}
            <div>
              <h3 className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">
                Details
              </h3>
              <div className="mt-2 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Household</span>
                  <span className="text-foreground">{guest.household?.name ?? '--'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Side</span>
                  <span className="text-foreground capitalize">{guest.side ?? '--'}</span>
                </div>
                {guest.dietary?.notes && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Dietary</span>
                    <span className="text-foreground">{guest.dietary.notes}</span>
                  </div>
                )}
                {guest.songRequest && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Song Request</span>
                    <span className="text-foreground">{guest.songRequest}</span>
                  </div>
                )}
                {guest.rsvpNotes && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Notes</span>
                    <span className="text-foreground">{guest.rsvpNotes}</span>
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
                <h3 className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">
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
          <div className="border-border flex gap-3 border-t px-6 py-4">
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
