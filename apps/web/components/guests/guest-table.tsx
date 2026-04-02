'use client'

import { useState } from 'react'
import type { GuestWithTags } from '@planfortwo/types'
import { GuestTagBadge } from './guest-tag-badge'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { Mail, MailCheck, Pencil, Send, Trash2 } from 'lucide-react'

interface GuestTableProps {
  guests: GuestWithTags[]
  onSelectGuest: (guest: GuestWithTags) => void
  onEditGuest: (guest: GuestWithTags) => void
  onDeleteGuest?: (guest: GuestWithTags) => void
  onSendInvite?: (guest: GuestWithTags) => void
  sendingInviteId?: string | null
  deletingGuestId?: string | null
}

const RSVP_BADGE: Record<string, string> = {
  accepted: 'bg-green-50 text-green-700',
  pending: 'bg-amber-50 text-amber-700',
  declined: 'bg-red-50 text-red-700',
  maybe: 'bg-blue-50 text-blue-700',
}

export function GuestTable({
  guests,
  onSelectGuest,
  onEditGuest,
  onDeleteGuest,
  onSendInvite,
  sendingInviteId,
  deletingGuestId,
}: GuestTableProps) {
  const [deleteConfirmGuest, setDeleteConfirmGuest] = useState<GuestWithTags | null>(null)

  if (guests.length === 0) {
    return (
      <div className="border-border bg-background rounded-2xl border p-8 text-center">
        <svg
          className="text-muted-foreground/50 mx-auto h-12 w-12"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
        <p className="text-muted-foreground mt-3 text-sm">
          No guests yet. Add your first guest to get started.
        </p>
      </div>
    )
  }

  return (
    <div className="border-border bg-background overflow-hidden rounded-2xl border shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-border bg-muted/50 border-b">
              <th className="text-foreground px-4 py-3 font-serif font-semibold">Name</th>
              <th className="text-foreground px-4 py-3 font-serif font-semibold">RSVP</th>
              <th className="text-foreground px-4 py-3 font-serif font-semibold">Invite</th>
              <th className="text-foreground hidden px-4 py-3 font-serif font-semibold sm:table-cell">
                Tags
              </th>
              <th className="text-foreground hidden px-4 py-3 font-serif font-semibold sm:table-cell">
                +1
              </th>
            </tr>
          </thead>
          <tbody className="divide-border divide-y">
            {guests.map((guest) => (
              <tr
                key={guest.id}
                className="hover:bg-wedding-50/30 cursor-pointer transition-colors"
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onEditGuest(guest)
                      }}
                      className="text-muted-foreground hover:bg-muted hover:text-muted-foreground shrink-0 rounded-md p-1 transition-colors"
                      title="Edit guest"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    {onDeleteGuest && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setDeleteConfirmGuest(guest)
                        }}
                        disabled={deletingGuestId === guest.id}
                        className="text-muted-foreground shrink-0 rounded-md p-1 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                        title="Remove guest"
                      >
                        {deletingGuestId === guest.id ? (
                          <div className="border-border h-3.5 w-3.5 animate-spin rounded-full border-2 border-t-red-600" />
                        ) : (
                          <Trash2 className="h-3.5 w-3.5" />
                        )}
                      </button>
                    )}
                    <div onClick={() => onSelectGuest(guest)} className="cursor-pointer">
                      <div className="flex items-center gap-2">
                        <span className="text-foreground font-medium">
                          {guest.firstName} {guest.lastName}
                        </span>
                        {guest.isVip && (
                          <span className="rounded-full bg-amber-50 px-1.5 py-0.5 text-xs font-medium text-amber-700">
                            VIP
                          </span>
                        )}
                        {guest.isChild && (
                          <span className="rounded-full bg-purple-50 px-1.5 py-0.5 text-xs font-medium text-purple-700">
                            Child
                          </span>
                        )}
                      </div>
                      {guest.email && (
                        <p className="text-muted-foreground text-xs">{guest.email}</p>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3" onClick={() => onSelectGuest(guest)}>
                  <span
                    className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium capitalize ${RSVP_BADGE[guest.rsvpStatus] ?? ''}`}
                  >
                    {guest.rsvpStatus}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {guest.email ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onSendInvite?.(guest)
                      }}
                      disabled={sendingInviteId === guest.id}
                      className={`flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium transition-colors disabled:opacity-50 ${
                        guest.inviteSentAt
                          ? 'text-green-600 hover:bg-green-50 hover:text-green-700'
                          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                      }`}
                    >
                      {sendingInviteId === guest.id ? (
                        <div className="border-border h-3.5 w-3.5 animate-spin rounded-full border-2 border-t-gray-600" />
                      ) : guest.inviteSentAt ? (
                        <MailCheck className="h-3.5 w-3.5" />
                      ) : (
                        <Send className="h-3.5 w-3.5" />
                      )}
                      {guest.inviteSentAt ? 'Resend' : 'Send'}
                    </button>
                  ) : (
                    <span className="text-muted-foreground flex items-center gap-1 text-xs">
                      <Mail className="h-3.5 w-3.5" />
                      No email
                    </span>
                  )}
                </td>
                <td className="hidden px-4 py-3 sm:table-cell" onClick={() => onSelectGuest(guest)}>
                  <div className="flex flex-wrap gap-1">
                    {guest.tags.map((tag) => (
                      <GuestTagBadge key={tag.id} tag={tag} />
                    ))}
                  </div>
                </td>
                <td
                  className="text-muted-foreground hidden px-4 py-3 sm:table-cell"
                  onClick={() => onSelectGuest(guest)}
                >
                  {guest.hasPlusOne ? (
                    <span className="text-green-600">{guest.plusOneName ?? 'Yes'}</span>
                  ) : (
                    <span className="text-muted-foreground">No</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Delete guest confirmation */}
      <ConfirmDialog
        open={!!deleteConfirmGuest}
        onOpenChange={(open) => !open && setDeleteConfirmGuest(null)}
        title="Remove Guest"
        description={
          deleteConfirmGuest
            ? `Are you sure you want to remove ${deleteConfirmGuest.firstName} ${deleteConfirmGuest.lastName}? This action cannot be undone.`
            : ''
        }
        confirmLabel="Remove"
        variant="danger"
        onConfirm={() => {
          if (deleteConfirmGuest && onDeleteGuest) {
            onDeleteGuest(deleteConfirmGuest)
          }
          setDeleteConfirmGuest(null)
        }}
      />
    </div>
  )
}
