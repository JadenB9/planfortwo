import Link from 'next/link'

export function SiteFooter() {
  return (
    <footer className="border-t border-gray-100 bg-white px-5 py-12 sm:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <Link href="/" className="font-serif text-lg font-bold text-gray-900">
              PlanForTwo
            </Link>
            <p className="mt-2 max-w-xs text-sm leading-relaxed text-gray-400">
              Wedding planning software for couples who want simplicity over complexity.
            </p>
          </div>

          <div className="flex gap-16">
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-widest text-gray-400">
                Product
              </h4>
              <ul className="mt-3 space-y-2">
                <li>
                  <Link href="/features" className="text-sm text-gray-500 hover:text-gray-900">
                    Features
                  </Link>
                </li>
                <li>
                  <Link
                    href="/features#pricing"
                    className="text-sm text-gray-500 hover:text-gray-900"
                  >
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link href="/sign-up" className="text-sm text-gray-500 hover:text-gray-900">
                    Get started
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-semibold uppercase tracking-widest text-gray-400">
                Account
              </h4>
              <ul className="mt-3 space-y-2">
                <li>
                  <Link href="/sign-in" className="text-sm text-gray-500 hover:text-gray-900">
                    Sign in
                  </Link>
                </li>
                <li>
                  <Link href="/sign-up" className="text-sm text-gray-500 hover:text-gray-900">
                    Create account
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-10 border-t border-gray-100 pt-6">
          <p className="mb-2 text-[11px] italic text-gray-300">
            &ldquo;Therefore what God has joined together, let no one separate.&rdquo; — Mark 10:9
          </p>
          <p className="text-xs text-gray-400">
            &copy; {new Date().getFullYear()} PlanForTwo. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
