'use client'

import type { GuestTag } from '@planfortwo/types'

interface GuestTagBadgeProps {
  tag: GuestTag
  onRemove?: () => void
}

export function GuestTagBadge({ tag, onRemove }: GuestTagBadgeProps) {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium"
      style={{ backgroundColor: `${tag.color}20`, color: tag.color }}
    >
      <span
        className="inline-block h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: tag.color }}
      />
      {tag.name}
      {onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onRemove()
          }}
          className="ml-0.5 hover:opacity-70"
        >
          &times;
        </button>
      )}
    </span>
  )
}
