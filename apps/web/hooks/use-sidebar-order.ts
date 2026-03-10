'use client'

import { useState, useCallback, useEffect } from 'react'
import { NAV_GROUPS, type NavGroup, type NavItem } from '@/lib/navigation'

const STORAGE_KEY = 'sidebar-nav-order'
const STORAGE_VERSION = 3

interface StoredOrder {
  version: number
  groups: Record<string, string[]>
}

function getDefaultOrder(): StoredOrder {
  const groups: Record<string, string[]> = {}
  for (const group of NAV_GROUPS) {
    groups[group.label] = group.items.map((item) => item.href)
  }
  return { version: STORAGE_VERSION, groups }
}

function loadOrder(): StoredOrder {
  if (typeof window === 'undefined') return getDefaultOrder()
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return getDefaultOrder()
    const parsed = JSON.parse(raw) as StoredOrder
    if (!parsed.groups || typeof parsed.groups !== 'object') return getDefaultOrder()
    // Reset to defaults if version doesn't match
    if (parsed.version !== STORAGE_VERSION) return getDefaultOrder()
    return parsed
  } catch {
    return getDefaultOrder()
  }
}

function saveOrder(order: StoredOrder): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(order))
  } catch {
    // localStorage may be full or unavailable
  }
}

/**
 * Reorder items in a group based on stored href order.
 * Any new items not in the stored order get appended at the end.
 * Any stored hrefs that no longer exist in the source are dropped.
 */
function applyOrder(sourceItems: NavItem[], storedHrefs: string[]): NavItem[] {
  const itemMap = new Map(sourceItems.map((item) => [item.href, item]))
  const ordered: NavItem[] = []

  // First, add items in stored order
  for (const href of storedHrefs) {
    const item = itemMap.get(href)
    if (item) {
      ordered.push(item)
      itemMap.delete(href)
    }
  }

  // Then append any new items not yet in the stored order
  for (const item of itemMap.values()) {
    ordered.push(item)
  }

  return ordered
}

export function useSidebarOrder() {
  const [order, setOrder] = useState<StoredOrder>(getDefaultOrder)

  // Load from localStorage on mount (client-side only)
  useEffect(() => {
    setOrder(loadOrder())
  }, [])

  const orderedGroups: NavGroup[] = NAV_GROUPS.map((group) => ({
    label: group.label,
    items: applyOrder(group.items, order.groups[group.label] ?? []),
  }))

  const reorderGroup = useCallback((groupLabel: string, oldIndex: number, newIndex: number) => {
    setOrder((prev) => {
      const group = NAV_GROUPS.find((g) => g.label === groupLabel)
      if (!group) return prev

      const currentHrefs = applyOrder(group.items, prev.groups[groupLabel] ?? []).map(
        (item) => item.href,
      )

      const updated = [...currentHrefs]
      const [moved] = updated.splice(oldIndex, 1)
      if (!moved) return prev
      updated.splice(newIndex, 0, moved)

      const next: StoredOrder = {
        version: STORAGE_VERSION,
        groups: { ...prev.groups, [groupLabel]: updated },
      }
      saveOrder(next)
      return next
    })
  }, [])

  const resetOrder = useCallback(() => {
    const defaultOrder = getDefaultOrder()
    setOrder(defaultOrder)
    saveOrder(defaultOrder)
  }, [])

  return { orderedGroups, reorderGroup, resetOrder }
}
