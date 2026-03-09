'use client'

import type { GuestWithTags } from '@planfortwo/types'
import { GuestTagBadge } from './guest-tag-badge'
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
  if (guests.length === 0) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center">
        <svg
          className="mx-auto h-12 w-12 text-gray-300"
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
        <p className="mt-3 text-sm text-gray-500">
          No guests yet. Add your first guest to get started.
        </p>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50/50">
              <th className="px-4 py-3 font-serif font-semibold text-gray-900">Name</th>
              <th className="px-4 py-3 font-serif font-semibold text-gray-900">RSVP</th>
              <th className="px-4 py-3 font-serif font-semibold text-gray-900">Invite</th>
              <th className="px-4 py-3 font-serif font-semibold text-gray-900">Tags</th>
              <th className="px-4 py-3 font-serif font-semibold text-gray-900">+1</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
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
                      className="shrink-0 rounded-md p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                      title="Edit guest"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    {onDeleteGuest && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          if (window.confirm(`Remove ${guest.firstName} ${guest.lastName}?`)) {
                            onDeleteGuest(guest)
                          }
                        }}
                        disabled={deletingGuestId === guest.id}
                        className="shrink-0 rounded-md p-1 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                        title="Remove guest"
                      >
                        {deletingGuestId === guest.id ? (
                          <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-gray-300 border-t-red-600" />
                        ) : (
                          <Trash2 className="h-3.5 w-3.5" />
                        )}
                      </button>
                    )}
                    <div onClick={() => onSelectGuest(guest)} className="cursor-pointer">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">
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
                      {guest.email && <p className="text-xs text-gray-500">{guest.email}</p>}
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
                  {guest.inviteSentAt ? (
                    <span className="flex items-center gap-1 text-xs text-green-600">
                      <MailCheck className="h-3.5 w-3.5" />
                      Sent
                    </span>
                  ) : guest.email ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onSendInvite?.(guest)
                      }}
                      disabled={sendingInviteId === guest.id}
                      className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 disabled:opacity-50"
                    >
                      {sendingInviteId === guest.id ? (
                        <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
                      ) : (
                        <Send className="h-3.5 w-3.5" />
                      )}
                      Send
                    </button>
                  ) : (
                    <span className="flex items-center gap-1 text-xs text-gray-400">
                      <Mail className="h-3.5 w-3.5" />
                      No email
                    </span>
                  )}
                </td>
                <td className="px-4 py-3" onClick={() => onSelectGuest(guest)}>
                  <div className="flex flex-wrap gap-1">
                    {guest.tags.map((tag) => (
                      <GuestTagBadge key={tag.id} tag={tag} />
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-600" onClick={() => onSelectGuest(guest)}>
                  {guest.hasPlusOne ? (
                    <span className="text-green-600">{guest.plusOneName ?? 'Yes'}</span>
                  ) : (
                    <span className="text-gray-400">No</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
