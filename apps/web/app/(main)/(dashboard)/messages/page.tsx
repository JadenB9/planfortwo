'use client'

import { ModerationPage } from '@/components/dashboard/moderation-page'
import type { ModerationPageConfig } from '@/components/dashboard/moderation-page'
import type { GuestbookEntry } from '@planfortwo/types'
import { api } from '@/lib/api'
import { MessageSquare } from 'lucide-react'

const config: ModerationPageConfig<GuestbookEntry> = {
  title: 'Messages',
  entityName: 'Message',
  entityNamePlural: 'messages',
  icon: MessageSquare,
  iconColor: 'text-blue-600 bg-blue-50',
  avatarColor: 'bg-wedding-100 text-wedding-700',
  emptyTitle: 'No Messages Yet',
  emptyDescription:
    'When guests leave messages in your wedding website guestbook, they will appear here for you to review and approve.',
  getText: (entry) => entry.message,
  api: api.guestbook,
}

export default function MessagesPage() {
  return <ModerationPage config={config} />
}
