'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import type { WebsiteConfig } from '@planfortwo/types'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'

interface SettingsPanelProps {
  config: WebsiteConfig
  onUpdate: (data: Record<string, unknown>) => void
  onCheckSubdomain: (subdomain: string) => Promise<boolean>
}

function useDebouncedUpdate(onUpdate: (data: Record<string, unknown>) => void, delay = 600) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pending = useRef<Record<string, unknown>>({})

  const flush = useCallback(() => {
    if (timer.current) clearTimeout(timer.current)
    if (Object.keys(pending.current).length > 0) {
      onUpdate({ ...pending.current })
      pending.current = {}
    }
  }, [onUpdate])

  const update = useCallback(
    (data: Record<string, unknown>) => {
      pending.current = { ...pending.current, ...data }
      if (timer.current) clearTimeout(timer.current)
      timer.current = setTimeout(flush, delay)
    },
    [flush, delay],
  )

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current)
    }
  }, [])

  return { update, flush }
}

export function SettingsPanel({ config, onUpdate, onCheckSubdomain }: SettingsPanelProps) {
  const [subdomain, setSubdomain] = useState(config.subdomain ?? '')
  const [subdomainAvailable, setSubdomainAvailable] = useState<boolean | null>(null)
  const [checking, setChecking] = useState(false)
  const [metaTitle, setMetaTitle] = useState(config.metaTitle ?? '')
  const [metaDescription, setMetaDescription] = useState(config.metaDescription ?? '')
  const [hashtag, setHashtag] = useState(config.hashtag ?? '')

  const { update: debouncedUpdate, flush } = useDebouncedUpdate(onUpdate)

  useEffect(() => {
    setSubdomain(config.subdomain ?? '')
    setMetaTitle(config.metaTitle ?? '')
    setMetaDescription(config.metaDescription ?? '')
    setHashtag(config.hashtag ?? '')
  }, [config.subdomain, config.metaTitle, config.metaDescription, config.hashtag])

  const handleCheckSubdomain = async () => {
    if (!subdomain.trim()) return
    setChecking(true)
    const available = await onCheckSubdomain(subdomain)
    setSubdomainAvailable(available)
    setChecking(false)
  }

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">Website Settings</h3>

      <div className="space-y-2">
        <Label>Subdomain</Label>
        <div className="flex gap-2">
          <Input
            value={subdomain}
            onChange={(e) => {
              setSubdomain(e.target.value)
              setSubdomainAvailable(null)
            }}
            placeholder="your-wedding"
          />
          <Button variant="outline" onClick={handleCheckSubdomain} disabled={checking}>
            {checking ? 'Checking...' : 'Check'}
          </Button>
        </div>
        {subdomainAvailable !== null && (
          <p className={`text-sm ${subdomainAvailable ? 'text-green-600' : 'text-red-600'}`}>
            {subdomainAvailable ? 'Available!' : 'Already taken'}
          </p>
        )}
        {subdomainAvailable && (
          <Button size="sm" onClick={() => onUpdate({ subdomain })}>
            Save Subdomain
          </Button>
        )}
      </div>

      <div className="space-y-2">
        <Label>Privacy</Label>
        <Select
          value={config.privacyMode}
          onValueChange={(value) => onUpdate({ privacyMode: value })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="public">Public</SelectItem>
            <SelectItem value="password">Password Protected</SelectItem>
            <SelectItem value="unlisted">Unlisted</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Meta Title</Label>
        <Input
          value={metaTitle}
          onChange={(e) => {
            setMetaTitle(e.target.value)
            debouncedUpdate({ metaTitle: e.target.value || null })
          }}
          onBlur={flush}
          placeholder="Our Wedding"
        />
      </div>

      <div className="space-y-2">
        <Label>Meta Description</Label>
        <Textarea
          value={metaDescription}
          onChange={(e) => {
            setMetaDescription(e.target.value)
            debouncedUpdate({ metaDescription: e.target.value || null })
          }}
          onBlur={flush}
          placeholder="Join us to celebrate..."
          rows={2}
        />
      </div>

      <div className="space-y-2">
        <Label>Wedding Hashtag</Label>
        <Input
          value={hashtag}
          onChange={(e) => {
            setHashtag(e.target.value)
            debouncedUpdate({ hashtag: e.target.value || null })
          }}
          onBlur={flush}
          placeholder="#SmithWedding2026"
        />
      </div>
    </div>
  )
}
