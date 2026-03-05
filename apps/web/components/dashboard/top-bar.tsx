'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { UserButton } from '@clerk/nextjs'
import { NAV_GROUPS } from '@/lib/navigation'

export function TopBar() {
  const [menuOpen, setMenuOpen] = useState(false)
  const pathname = usePathname()

  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 lg:hidden"
            aria-label="Toggle menu"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {menuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>

          <Link href="/dashboard" className="font-serif text-lg font-bold text-gray-900 lg:hidden">
            Plan<span className="text-wedding-600">For</span>Two
          </Link>
        </div>

        <UserButton />
      </div>

      {menuOpen && (
        <nav className="border-t border-gray-200 bg-white px-4 pb-4 pt-2 lg:hidden">
          <div className="space-y-4">
            {NAV_GROUPS.map((group) => (
              <div key={group.label}>
                <p className="mb-1 px-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
                  {group.label}
                </p>
                <div className="space-y-0.5">
                  {group.items.map((item) => {
                    const isActive = pathname === item.href
                    const Icon = item.icon

                    return (
                      <Link
                        key={item.href}
                        href={item.comingSoon ? '#' : item.href}
                        onClick={(e) => {
                          if (item.comingSoon) e.preventDefault()
                          else setMenuOpen(false)
                        }}
                        className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                          isActive
                            ? 'bg-wedding-50 text-wedding-700'
                            : item.comingSoon
                              ? 'text-gray-400'
                              : 'text-gray-700 hover:bg-gray-100'
                        }`}
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
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </nav>
      )}
    </header>
  )
}
