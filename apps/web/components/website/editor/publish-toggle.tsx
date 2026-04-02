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
  // Prefer clean subdomain URL, fall back to path-based URL
  if (subdomain) return `https://${subdomain}.planfortwo.com`
  if (!accessToken) return null
  return `https://app.planfortwo.com/s/${accessToken}`
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
    <div className="bg-background rounded-xl border p-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          {isPublished ? (
            <Globe className="h-5 w-5 text-green-600" />
          ) : (
            <GlobeLock className="text-muted-foreground h-5 w-5" />
          )}
          <div>
            <p className="text-foreground text-sm font-semibold">
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
                  {siteUrl.replace('https://', '')}
                </a>
                <button
                  onClick={handleCopy}
                  className="text-muted-foreground hover:text-muted-foreground"
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
                  className="text-muted-foreground hover:text-muted-foreground"
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
        <p className="text-muted-foreground mt-2 text-xs">
          Set a subdomain in Settings before publishing.
        </p>
      )}
    </div>
  )
}
