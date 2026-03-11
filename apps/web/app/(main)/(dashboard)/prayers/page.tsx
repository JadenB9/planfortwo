'use client'

import { ModerationPage } from '@/components/dashboard/moderation-page'
import type { ModerationPageConfig } from '@/components/dashboard/moderation-page'
import type { Prayer } from '@planfortwo/types'
import { api } from '@/lib/api'
import { Heart } from 'lucide-react'

const config: ModerationPageConfig<Prayer> = {
  title: 'Prayers',
  entityName: 'Prayer',
  entityNamePlural: 'prayers',
  icon: Heart,
  iconColor: 'text-rose-600 bg-rose-50',
  avatarColor: 'bg-rose-100 text-rose-700',
  emptyTitle: 'No Prayers Yet',
  emptyDescription:
    'When guests submit prayers through your wedding website, they will appear here for you to review and approve.',
  emptyExtra: (
    <p className="mx-auto mt-3 max-w-md text-xs italic text-gray-400">
      &ldquo;For where two or three gather in my name, there am I with them.&rdquo; — Matthew 18:20
    </p>
  ),
  getText: (entry) => entry.prayerText,
  textClassName: 'italic',
  api: api.prayers,
}

export default function PrayersPage() {
  return <ModerationPage config={config} />
}
