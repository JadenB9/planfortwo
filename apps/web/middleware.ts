import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/invite(.*)',
  '/features(.*)',
  '/s(.*)',
  '/rsvp(.*)',
  '/api/webhooks(.*)',
])

// Subdomains that are NOT wedding websites (i.e. part of the app itself)
const RESERVED_SUBDOMAINS = new Set(['www', 'app', 'api', 'mail', 'admin', ''])

export default clerkMiddleware(async (auth, request) => {
  const host = request.headers.get('host') ?? ''
  const hostname = host.split(':')[0] ?? '' // strip port for local dev

  // Detect wedding website subdomains (e.g. jabby.planfortwo.com)
  const match = hostname.match(/^([a-z0-9-]+)\.planfortwo\.com$/)
  const subdomain = match?.[1]
  if (subdomain && !RESERVED_SUBDOMAINS.has(subdomain)) {
    const url = new URL(`/s/${subdomain}`, request.url)
    return NextResponse.rewrite(url)
  }

  if (!isPublicRoute(request)) {
    await auth.protect()
  }
})

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}
