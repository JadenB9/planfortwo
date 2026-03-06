'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { ChevronDown, Sparkles, ExternalLink, CheckCircle, Settings } from 'lucide-react'
import { staggerContainer, navItem, springSmooth } from '@/lib/animations'
import { NAV_GROUPS } from '@/lib/navigation'
import { useWedding } from '@/hooks/use-wedding'

export function Sidebar() {
  const pathname = usePathname()
  const { data: weddingData, loading: weddingLoading } = useWedding()
  const tier = weddingData?.wedding.tier
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({
    Details: true,
    More: true,
  })

  const toggleGroup = (label: string) => {
    setCollapsed((prev) => ({ ...prev, [label]: !prev[label] }))
  }

  return (
    <aside className="sticky top-0 hidden h-screen w-64 flex-col border-r border-gray-200 bg-white lg:flex">
      <div className="flex h-16 items-center border-b border-gray-200 px-6">
        <Link href="/dashboard" className="font-serif text-xl font-bold text-gray-900">
          Plan<span className="text-wedding-600">For</span>Two
        </Link>
      </div>

      <motion.nav
        className="mt-4 flex-1 space-y-4 overflow-y-auto px-3"
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
      >
        {NAV_GROUPS.map((group) => {
          const isCollapsible = group.label === 'Details' || group.label === 'More'
          const isOpen = !collapsed[group.label]

          return (
            <div key={group.label}>
              {isCollapsible ? (
                <button
                  onClick={() => toggleGroup(group.label)}
                  className="mb-1 flex w-full items-center justify-between px-3 text-xs font-semibold uppercase tracking-wider text-gray-400"
                >
                  <span>{group.label}</span>
                  <ChevronDown
                    className={`h-3.5 w-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                  />
                </button>
              ) : (
                <p className="mb-1 px-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
                  {group.label}
                </p>
              )}

              {(!isCollapsible || isOpen) && (
                <div className="space-y-0.5">
                  {group.items.map((item) => {
                    const isActive = pathname === item.href
                    const Icon = item.icon

                    return (
                      <motion.div
                        key={item.href}
                        variants={navItem}
                        transition={{ duration: 0.3, ...springSmooth }}
                      >
                        <Link
                          href={item.comingSoon ? '#' : item.href}
                          className={`flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
                            isActive
                              ? 'bg-wedding-50 text-wedding-700'
                              : item.comingSoon
                                ? 'cursor-default text-gray-400'
                                : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                          }`}
                          onClick={item.comingSoon ? (e) => e.preventDefault() : undefined}
                        >
                          <Icon
                            className={`h-4 w-4 flex-shrink-0 ${isActive ? 'text-wedding-600' : 'text-gray-400'}`}
                          />
                          <span>{item.label}</span>
                          {item.comingSoon && (
                            <span className="ml-auto rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
                              Soon
                            </span>
                          )}
                        </Link>
                      </motion.div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </motion.nav>

      {/* Bottom section */}
      <div className="mt-auto space-y-2 border-t border-gray-200 p-3">
        <Link
          href="/settings"
          className={`flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
            pathname === '/settings'
              ? 'bg-wedding-50 text-wedding-700'
              : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
          }`}
        >
          <Settings
            className={`h-4 w-4 flex-shrink-0 ${pathname === '/settings' ? 'text-wedding-600' : 'text-gray-400'}`}
          />
          Wedding Settings
        </Link>
        {weddingLoading ? null : tier === 'full' ? (
          <div className="bg-sage-50 border-sage-200 text-sage-700 flex items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium">
            <CheckCircle className="h-4 w-4" />
            Full Plan Active
          </div>
        ) : (
          <Link
            href="/upgrade"
            className="bg-wedding-600 hover:bg-wedding-700 flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors"
          >
            <Sparkles className="h-4 w-4" />
            Upgrade Plan
          </Link>
        )}
        <Link
          href="/"
          className="flex items-center gap-2 px-3 py-2 text-xs text-gray-400 transition-colors hover:text-gray-600"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          Visit Home Page
        </Link>
      </div>
    </aside>
  )
}
