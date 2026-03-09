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
  // Try multiple sources for the hostname
  const weddingHost = request.headers.get('x-wedding-host')
  const hostHeader = request.headers.get('host')
  const urlHostname = request.nextUrl.hostname

  // Use whichever source has the actual subdomain
  const hostname = (weddingHost ?? hostHeader ?? urlHostname ?? '').split(':')[0] ?? ''

  // Detect wedding website subdomains (e.g. jabby.planfortwo.com)
  const match = hostname.match(/^([a-z0-9-]+)\.planfortwo\.com$/)
  const subdomain = match?.[1]
  if (subdomain && !RESERVED_SUBDOMAINS.has(subdomain)) {
    const url = new URL(`/s/${subdomain}`, request.url)
    const response = NextResponse.rewrite(url)
    // Debug header — remove after verifying
    response.headers.set('x-debug-host', `wh:${weddingHost}|h:${hostHeader}|url:${urlHostname}`)
    return response
  }

  if (!isPublicRoute(request)) {
    await auth.protect()
  }

  // Debug header on non-rewritten responses — remove after verifying
  const response = NextResponse.next()
  response.headers.set('x-debug-host', `wh:${weddingHost}|h:${hostHeader}|url:${urlHostname}`)
  return response
})

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}
