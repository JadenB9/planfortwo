'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', comingSoon: false },
  { href: '/checklist', label: 'Checklist', comingSoon: true },
  { href: '/guests', label: 'Guest List', comingSoon: true },
  { href: '/budget', label: 'Budget', comingSoon: true },
  { href: '/website', label: 'Website', comingSoon: true },
] as const

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="hidden w-64 border-r border-gray-200 bg-white lg:block">
      <div className="flex h-16 items-center border-b border-gray-200 px-6">
        <Link href="/dashboard" className="font-serif text-xl font-bold text-gray-900">
          Plan<span className="text-wedding-600">For</span>Two
        </Link>
      </div>

      <nav className="mt-4 space-y-1 px-3">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href

          return (
            <Link
              key={item.href}
              href={item.comingSoon ? '#' : item.href}
              className={`flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-wedding-50 text-wedding-700'
                  : item.comingSoon
                    ? 'cursor-default text-gray-400'
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
              }`}
              onClick={item.comingSoon ? (e) => e.preventDefault() : undefined}
            >
              <span>{item.label}</span>
              {item.comingSoon && (
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
                  Soon
                </span>
              )}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
