import Link from 'next/link'

export function SiteFooter() {
  return (
    <footer className="border-border bg-background border-t px-5 py-12 sm:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <Link href="/" className="text-foreground font-serif text-lg font-bold">
              PlanForTwo
            </Link>
            <p className="text-muted-foreground mt-2 max-w-xs text-sm leading-relaxed">
              Wedding planning software for couples who want simplicity over complexity.
            </p>
          </div>

          <div className="flex gap-16">
            <div>
              <h4 className="text-muted-foreground text-xs font-semibold uppercase tracking-widest">
                Product
              </h4>
              <ul className="mt-3 space-y-2">
                <li>
                  <Link
                    href="/features"
                    className="text-muted-foreground hover:text-foreground text-sm"
                  >
                    Features
                  </Link>
                </li>
                <li>
                  <Link
                    href="/features#pricing"
                    className="text-muted-foreground hover:text-foreground text-sm"
                  >
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link
                    href="/sign-up"
                    className="text-muted-foreground hover:text-foreground text-sm"
                  >
                    Get started
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-muted-foreground text-xs font-semibold uppercase tracking-widest">
                Account
              </h4>
              <ul className="mt-3 space-y-2">
                <li>
                  <Link
                    href="/sign-in"
                    className="text-muted-foreground hover:text-foreground text-sm"
                  >
                    Sign in
                  </Link>
                </li>
                <li>
                  <Link
                    href="/sign-up"
                    className="text-muted-foreground hover:text-foreground text-sm"
                  >
                    Create account
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="border-border mt-10 border-t pt-6">
          <p className="text-muted-foreground/50 mb-2 text-[11px] italic">
            &ldquo;Therefore what God has joined together, let no one separate.&rdquo; — Mark 10:9
          </p>
          <p className="text-muted-foreground text-xs">
            &copy; {new Date().getFullYear()} PlanForTwo. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
