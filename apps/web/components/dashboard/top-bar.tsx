'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { UserButton } from '@clerk/nextjs'
import { Settings, ExternalLink, Moon, Sun } from 'lucide-react'
import { NAV_GROUPS } from '@/lib/navigation'
import { useTheme } from '@/components/theme-provider'

export function TopBar() {
  const [menuOpen, setMenuOpen] = useState(false)
  const pathname = usePathname()
  const { isDark, toggleDark } = useTheme()

  const closeMenu = useCallback(() => setMenuOpen(false), [])

  useEffect(() => {
    if (!menuOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeMenu()
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [menuOpen, closeMenu])

  return (
    <>
      <header className="border-b border-border bg-white dark:border-gray-800 dark:bg-gray-950">
        <div className="flex h-16 items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="rounded-lg p-2 text-muted-foreground hover:bg-muted lg:hidden dark:text-gray-400 dark:hover:bg-gray-800"
              aria-label="Toggle menu"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>

            <Link
              href="/dashboard"
              className="font-serif text-lg font-bold text-foreground lg:hidden dark:text-gray-100"
            >
              Plan<span className="text-wedding-600">For</span>Two
            </Link>
          </div>

          <UserButton>
            <UserButton.MenuItems>
              <UserButton.Link
                label="Wedding Settings"
                labelIcon={<Settings className="h-4 w-4" />}
                href="/settings"
              />
            </UserButton.MenuItems>
          </UserButton>
        </div>
      </header>

      {menuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/20" onClick={closeMenu} />

          {/* Menu panel */}
          <div className="absolute bottom-0 left-0 top-0 flex w-72 flex-col overflow-y-auto bg-white shadow-xl sm:w-80 dark:bg-gray-950">
            {/* Header with close button */}
            <div className="flex h-16 items-center justify-between border-b border-border px-4 sm:px-6 dark:border-gray-800">
              <div className="flex items-center gap-3">
                <button
                  onClick={closeMenu}
                  className="rounded-lg p-2 text-muted-foreground hover:bg-muted dark:text-gray-400 dark:hover:bg-gray-800"
                  aria-label="Close menu"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>

                <Link
                  href="/dashboard"
                  onClick={closeMenu}
                  className="font-serif text-lg font-bold text-foreground dark:text-gray-100"
                >
                  Plan<span className="text-wedding-600">For</span>Two
                </Link>
              </div>

              <UserButton>
                <UserButton.MenuItems>
                  <UserButton.Link
                    label="Wedding Settings"
                    labelIcon={<Settings className="h-4 w-4" />}
                    href="/settings"
                  />
                </UserButton.MenuItems>
              </UserButton>
            </div>

            {/* Nav links */}
            <nav className="flex-1 overflow-y-auto px-4 py-4">
              <div className="space-y-4">
                {NAV_GROUPS.map((group) => (
                  <div key={group.label}>
                    <p className="mb-1 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground dark:text-gray-500">
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
                              else closeMenu()
                            }}
                            className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                              isActive
                                ? 'bg-wedding-50 text-wedding-700 dark:bg-wedding-950 dark:text-wedding-300'
                                : item.comingSoon
                                  ? 'text-muted-foreground dark:text-gray-600'
                                  : 'text-foreground hover:bg-muted dark:text-gray-300 dark:hover:bg-gray-800'
                            }`}
                          >
                            <Icon
                              className={`h-4 w-4 flex-shrink-0 ${isActive ? 'text-wedding-600' : 'text-muted-foreground dark:text-gray-500'}`}
                            />
                            <span>{item.label}</span>
                            {item.comingSoon && (
                              <span className="ml-auto rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
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

            {/* Bottom section */}
            <div className="space-y-2 border-t border-border p-4 dark:border-gray-800">
              <Link
                href="/settings"
                onClick={closeMenu}
                className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                  pathname === '/settings'
                    ? 'bg-wedding-50 text-wedding-700 dark:bg-wedding-950 dark:text-wedding-300'
                    : 'text-foreground hover:bg-muted dark:text-gray-300 dark:hover:bg-gray-800'
                }`}
              >
                <Settings
                  className={`h-4 w-4 flex-shrink-0 ${pathname === '/settings' ? 'text-wedding-600' : 'text-muted-foreground dark:text-gray-500'}`}
                />
                Wedding Settings
              </Link>
              <div className="flex items-center justify-between px-3 py-1.5">
                <Link
                  href="/"
                  onClick={closeMenu}
                  className="flex items-center gap-2 text-xs text-muted-foreground transition-colors hover:text-muted-foreground dark:text-gray-500 dark:hover:text-gray-300"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Visit Home Page
                </Link>
                <button
                  onClick={toggleDark}
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-muted-foreground dark:text-gray-500 dark:hover:bg-gray-800 dark:hover:text-gray-300"
                  title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
                >
                  {isDark ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
