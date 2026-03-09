'use client'

import { Button } from '@/components/ui/button'
import { Globe, GlobeLock, ExternalLink, Copy, Check } from 'lucide-react'
import { useState } from 'react'

interface PublishToggleProps {
  isPublished: boolean
  subdomain: string | null
  accessToken: string | null
  onPublish: () => void
  onUnpublish: () => void
}

function buildPublicUrl(subdomain: string | null, accessToken: string | null): string | null {
  if (!accessToken) return null
  if (subdomain) {
    return `https://${subdomain}.planfortwo.com/s/${accessToken}`
  }
  return `https://planfortwo.com/s/${accessToken}`
}

export function PublishToggle({
  isPublished,
  subdomain,
  accessToken,
  onPublish,
  onUnpublish,
}: PublishToggleProps) {
  const [copied, setCopied] = useState(false)
  const siteUrl = buildPublicUrl(subdomain, accessToken)

  const handleCopy = async () => {
    if (!siteUrl) return
    await navigator.clipboard.writeText(siteUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

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
              <div className="flex items-center gap-1.5">
                <a
                  href={siteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 hover:underline"
                >
                  {siteUrl}
                </a>
                <button
                  onClick={handleCopy}
                  className="text-gray-400 hover:text-gray-600"
                  title="Copy link"
                >
                  {copied ? (
                    <Check className="h-3 w-3 text-green-500" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                </button>
                <a
                  href={siteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-gray-600"
                  title="Open in new tab"
                >
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
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
