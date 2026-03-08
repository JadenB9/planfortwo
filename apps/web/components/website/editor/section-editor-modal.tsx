'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2 } from 'lucide-react'
import { sectionLabels } from '@/lib/section-icons'
import type { WebsiteSectionType } from '@planfortwo/types'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

interface SectionEditorModalProps {
  open: boolean
  onClose: () => void
  onSaved: () => void
  sectionId: string
  sectionTitle: string
  sectionType: string
  children: React.ReactNode
  title?: string
  content: Record<string, unknown>
  authToken: string
  weddingId: string
}

export function SectionEditorModal({
  open,
  onClose,
  onSaved,
  sectionId,
  sectionTitle: defaultTitle,
  sectionType,
  children,
  title,
  content,
  authToken,
  weddingId,
}: SectionEditorModalProps) {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sectionTitle, setSectionTitle] = useState(title ?? defaultTitle)

  useEffect(() => {
    setSectionTitle(title ?? defaultTitle)
  }, [title, defaultTitle])

  useEffect(() => {
    if (open) {
      setError(null)
    }
  }, [open])

  const typeLabel = sectionLabels[sectionType as WebsiteSectionType] ?? sectionType

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    try {
      const res = await fetch(`${API_URL}/website-sections/${sectionId}?weddingId=${weddingId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ title: sectionTitle, content }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => null)
        throw new Error(body?.error ?? body?.message ?? 'Failed to save section')
      }
      onSaved()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save section')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="flex max-h-[85vh] w-full max-w-2xl flex-col gap-0 p-0">
        <DialogHeader className="border-b px-6 py-4">
          <DialogTitle>Edit {typeLabel}</DialogTitle>
          <DialogDescription>
            Customize the content for your {typeLabel.toLowerCase()} section.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 space-y-6 overflow-y-auto px-6 py-5">
          <div className="space-y-2">
            <Label htmlFor="section-title">Section Title</Label>
            <Input
              id="section-title"
              value={sectionTitle}
              onChange={(e) => setSectionTitle(e.target.value)}
              placeholder={typeLabel}
            />
          </div>

          {children}
        </div>

        {error && (
          <div className="border-t bg-red-50 px-6 py-3">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <DialogFooter className="border-t px-6 py-4">
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
