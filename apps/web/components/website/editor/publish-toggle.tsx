'use client'

import { Button } from '@/components/ui/button'
import { Globe, GlobeLock } from 'lucide-react'

interface PublishToggleProps {
  isPublished: boolean
  subdomain: string | null
  onPublish: () => void
  onUnpublish: () => void
}

export function PublishToggle({
  isPublished,
  subdomain,
  onPublish,
  onUnpublish,
}: PublishToggleProps) {
  const siteUrl = subdomain ? `/s/${subdomain}` : null

  return (
    <div className="rounded-xl border bg-white p-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          {isPublished ? (
            <Globe className="h-5 w-5 text-green-600" />
          ) : (
            <GlobeLock className="h-5 w-5 text-gray-400" />
          )}
          <div>
            <p className="text-sm font-semibold text-gray-900">
              {isPublished ? 'Published' : 'Unpublished'}
            </p>
            {isPublished && siteUrl && (
              <a
                href={siteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-wedding-600 text-xs hover:underline"
              >
                {siteUrl}
              </a>
            )}
          </div>
        </div>
        {isPublished ? (
          <Button variant="outline" size="sm" onClick={onUnpublish}>
            Unpublish
          </Button>
        ) : (
          <Button size="sm" onClick={onPublish} disabled={!subdomain}>
            Publish
          </Button>
        )}
      </div>
      {!subdomain && !isPublished && (
        <p className="mt-2 text-xs text-gray-500">Set a subdomain in Settings before publishing.</p>
      )}
    </div>
  )
}
