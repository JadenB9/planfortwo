'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@clerk/nextjs'
import { motion } from 'framer-motion'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  ChevronDown,
  ExternalLink,
  CheckCircle,
  Settings,
  GripVertical,
  ChevronsUpDown,
  Crown,
  Heart,
  Users,
  UserCog,
  Moon,
  Sun,
} from 'lucide-react'
import { staggerContainer, navItem as navItemVariant, springSmooth } from '@/lib/animations'
import type { NavItem } from '@/lib/navigation'
import { useSidebarOrder } from '@/hooks/use-sidebar-order'
import { useWedding } from '@/hooks/use-wedding'
import { useTheme } from '@/components/theme-provider'
import { useNotificationBadges } from '@/hooks/use-notification-badges'
import { api } from '@/lib/api'
import { toast } from 'sonner'

const BADGE_MAP: Record<string, 'inbox' | 'music' | 'photos' | 'messages' | 'prayers'> = {
  '/inbox': 'inbox',
  '/music': 'music',
  '/photos': 'photos',
  '/messages': 'messages',
  '/prayers': 'prayers',
}

function SortableNavItem({
  item,
  isActive,
  websiteSubdomain,
  badgeCount,
  dragEndTimeRef,
}: {
  item: NavItem
  isActive: boolean
  websiteSubdomain: string | null
  badgeCount: number
  dragEndTimeRef: { current: number }
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.href,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
    position: 'relative' as const,
  }

  const Icon = item.icon

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <motion.div variants={navItemVariant} transition={{ duration: 0.3, ...springSmooth }}>
        <Link
          href={item.comingSoon ? '#' : item.href}
          className={`group flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
            isDragging
              ? 'bg-wedding-50 ring-wedding-200 dark:bg-wedding-950 dark:ring-wedding-800 shadow-md ring-1'
              : isActive
                ? 'bg-wedding-50 text-wedding-700 dark:bg-wedding-950 dark:text-wedding-300'
                : item.comingSoon
                  ? 'cursor-default text-muted-foreground dark:text-gray-600'
                  : 'text-foreground hover:bg-muted hover:text-foreground dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-gray-100'
          }`}
          onClick={(e) => {
            if (item.comingSoon) {
              e.preventDefault()
              return
            }
            if (Date.now() - dragEndTimeRef.current < 200) {
              e.preventDefault()
              return
            }
            if (isActive) {
              e.preventDefault()
              return
            }
          }}
          draggable={false}
        >
          <span
            {...listeners}
            className="flex shrink-0 cursor-grab items-center opacity-0 transition-opacity active:cursor-grabbing group-hover:opacity-100"
            aria-label={`Drag to reorder ${item.label}`}
          >
            <GripVertical className="text-muted-foreground/50 h-3.5 w-3.5" />
          </span>
          <div className="relative flex-shrink-0">
            <Icon
              className={`h-4 w-4 ${isActive ? 'text-wedding-600' : 'text-muted-foreground dark:text-gray-500'}`}
            />
            {badgeCount > 0 && (
              <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-red-500" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <span>{item.label}</span>
            {item.href === '/website' && websiteSubdomain && (
              <p
                className={`truncate text-xs ${isActive ? 'text-wedding-500' : 'text-muted-foreground'}`}
              >
                {websiteSubdomain}.planfortwo.com
              </p>
            )}
          </div>
          {item.comingSoon && (
            <span className="bg-muted text-muted-foreground ml-auto rounded-full px-2 py-0.5 text-xs">
              Soon
            </span>
          )}
        </Link>
      </motion.div>
    </div>
  )
}

const ROLE_ICONS: Record<string, typeof Crown> = {
  owner: Crown,
  partner: Heart,
  planner: UserCog,
  family: Users,
}

export function Sidebar() {
  const pathname = usePathname()
  const { getToken } = useAuth()
  const {
    data: weddingData,
    loading: weddingLoading,
    allWeddings,
    websiteSubdomain,
  } = useWedding()
  const badges = useNotificationBadges()
  const { isDark, toggleDark } = useTheme()
  const tier = weddingData?.wedding.tier
  const weddingId = weddingData?.wedding.id ?? null
  const { orderedGroups, reorderGroup } = useSidebarOrder()
  const dragEndTimeRef = useRef(0)
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({
    Details: false,
    More: false,
  })
  const [switcherOpen, setSwitcherOpen] = useState(false)
  const [switching, setSwitching] = useState(false)
  const switcherRef = useRef<HTMLDivElement>(null)

  // Close switcher when clicking outside
  useEffect(() => {
    if (!switcherOpen) return
    const handleClick = (e: MouseEvent) => {
      if (switcherRef.current && !switcherRef.current.contains(e.target as Node)) {
        setSwitcherOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [switcherOpen])

  const handleSwitchWedding = async (targetWeddingId: string) => {
    if (targetWeddingId === weddingId || switching) return
    setSwitching(true)
    try {
      const token = await getToken()
      if (!token) return
      await api.weddings.setActive(targetWeddingId, token)
      setSwitcherOpen(false)
      toast.success('Switched wedding')
      window.location.reload()
    } catch {
      toast.error('Failed to switch wedding')
      setSwitching(false)
    }
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const toggleGroup = (label: string) => {
    setCollapsed((prev) => ({ ...prev, [label]: !prev[label] }))
  }

  const handleDragEnd = useCallback(
    (groupLabel: string, items: NavItem[]) => (event: DragEndEvent) => {
      const { active, over } = event
      if (!over || active.id === over.id) return

      const oldIndex = items.findIndex((item) => item.href === active.id)
      const newIndex = items.findIndex((item) => item.href === over.id)
      if (oldIndex === -1 || newIndex === -1) return

      reorderGroup(groupLabel, oldIndex, newIndex)
    },
    [reorderGroup],
  )

  return (
    <aside className="border-border bg-background sticky top-0 hidden h-screen w-64 flex-col border-r lg:flex dark:border-gray-800 dark:bg-gray-950">
      <div className="border-border flex h-16 items-center border-b px-6 dark:border-gray-800">
        <Link
          href="/dashboard"
          className="text-foreground font-serif text-xl font-bold dark:text-gray-100"
        >
          Plan<span className="text-wedding-600">For</span>Two
        </Link>
      </div>

      {/* Wedding Switcher — shows role, switch between weddings if multiple */}
      {allWeddings.length >= 1 && (
        <div
          className="border-border relative border-b px-3 py-2 dark:border-gray-800"
          ref={switcherRef}
        >
          <button
            onClick={() => allWeddings.length > 1 && setSwitcherOpen((prev) => !prev)}
            className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left transition-colors ${allWeddings.length > 1 ? 'hover:bg-muted cursor-pointer dark:hover:bg-gray-800' : 'cursor-default'}`}
          >
            <div className="min-w-0 flex-1">
              <p className="text-foreground truncate text-sm font-medium dark:text-gray-100">
                {weddingData?.wedding.name ?? 'Loading...'}
              </p>
              <p className="text-muted-foreground truncate text-xs capitalize">
                {allWeddings.find((w) => w.id === weddingId)?.role ?? ''}
              </p>
            </div>
            {allWeddings.length > 1 && (
              <ChevronsUpDown className="text-muted-foreground h-4 w-4 shrink-0" />
            )}
          </button>

          {switcherOpen && (
            <div className="border-border bg-background absolute left-3 right-3 top-full z-50 mt-1 overflow-hidden rounded-lg border shadow-lg dark:border-gray-700 dark:bg-gray-900">
              <p className="text-muted-foreground px-3 py-2 text-xs font-semibold uppercase tracking-wider dark:text-gray-500">
                Your Weddings
              </p>
              {allWeddings.map((w) => {
                const RoleIcon = ROLE_ICONS[w.role] ?? Users
                const isActive = w.id === weddingId
                return (
                  <button
                    key={w.id}
                    onClick={() => void handleSwitchWedding(w.id)}
                    disabled={isActive || switching}
                    className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors ${
                      isActive ? 'bg-wedding-50 text-wedding-700' : 'text-foreground hover:bg-muted'
                    } ${switching ? 'opacity-50' : ''}`}
                  >
                    <RoleIcon
                      className={`h-3.5 w-3.5 shrink-0 ${isActive ? 'text-wedding-500' : 'text-muted-foreground'}`}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{w.name}</p>
                      <p className="text-muted-foreground text-xs">{w.role}</p>
                    </div>
                    {w.tier === 'full' && (
                      <span className="bg-sage-100 text-sage-700 rounded-full px-1.5 py-0.5 text-[10px] font-medium">
                        Full
                      </span>
                    )}
                    {isActive && <CheckCircle className="text-wedding-600 h-3.5 w-3.5 shrink-0" />}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      )}

      <motion.nav
        className="mt-4 flex-1 space-y-4 overflow-y-auto px-3"
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
      >
        {orderedGroups.map((group) => {
          const isCollapsible = group.label === 'Details' || group.label === 'More'
          const isOpen = !collapsed[group.label]

          return (
            <div key={group.label}>
              {isCollapsible ? (
                <button
                  onClick={() => toggleGroup(group.label)}
                  className="text-muted-foreground mb-1 flex w-full items-center justify-between px-3 text-xs font-semibold uppercase tracking-wider dark:text-gray-500"
                >
                  <span>{group.label}</span>
                  <ChevronDown
                    className={`h-3.5 w-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                  />
                </button>
              ) : (
                <p className="text-muted-foreground mb-1 px-3 text-xs font-semibold uppercase tracking-wider dark:text-gray-500">
                  {group.label}
                </p>
              )}

              {(!isCollapsible || isOpen) && (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={(event) => {
                    dragEndTimeRef.current = Date.now()
                    handleDragEnd(group.label, group.items)(event)
                  }}
                  onDragCancel={() => {
                    dragEndTimeRef.current = Date.now()
                  }}
                >
                  <SortableContext
                    items={group.items.map((item) => item.href)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-0.5">
                      {group.items.map((item) => {
                        const isActive = pathname === item.href
                        const badgeKey = BADGE_MAP[item.href]
                        const badgeCount = badgeKey ? badges[badgeKey] : 0
                        return (
                          <SortableNavItem
                            key={item.href}
                            item={item}
                            isActive={isActive}
                            websiteSubdomain={websiteSubdomain}
                            badgeCount={badgeCount}
                            dragEndTimeRef={dragEndTimeRef}
                          />
                        )
                      })}
                    </div>
                  </SortableContext>
                </DndContext>
              )}
            </div>
          )
        })}
      </motion.nav>

      {/* Bottom section */}
      <div className="border-border mt-auto space-y-2 border-t p-3 dark:border-gray-800">
        <Link
          href="/settings"
          className={`flex items-center justify-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
            pathname === '/settings'
              ? 'bg-wedding-50 text-wedding-700 dark:bg-wedding-950 dark:text-wedding-300'
              : 'text-foreground hover:bg-muted hover:text-foreground dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-gray-100'
          }`}
        >
          <Settings
            className={`h-4 w-4 flex-shrink-0 ${pathname === '/settings' ? 'text-wedding-600' : 'text-muted-foreground dark:text-gray-500'}`}
          />
          Wedding Settings
        </Link>
        {weddingLoading || !weddingData ? null : tier === 'full' ? (
          <div className="bg-sage-50 border-sage-200 text-sage-700 dark:bg-sage-950 dark:border-sage-800 dark:text-sage-400 flex items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium">
            <CheckCircle className="h-4 w-4" />
            Full Plan Active
          </div>
        ) : (
          <Link
            href="/upgrade"
            className="bg-wedding-600 hover:bg-wedding-700 flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors"
          >
            Upgrade Plan
          </Link>
        )}
        <div className="flex items-center justify-between px-3 py-1.5">
          <Link
            href="/"
            className="text-muted-foreground hover:text-muted-foreground flex items-center gap-2 text-xs transition-colors dark:text-gray-500 dark:hover:text-gray-300"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Visit Home Page
          </Link>
          <button
            onClick={toggleDark}
            className="text-muted-foreground hover:bg-muted hover:text-muted-foreground flex h-7 w-7 items-center justify-center rounded-lg transition-colors dark:text-gray-500 dark:hover:bg-gray-800 dark:hover:text-gray-300"
            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {isDark ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>
    </aside>
  )
}
