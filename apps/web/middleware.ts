import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import type { NextFetchEvent, NextRequest } from 'next/server'
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

/**
 * Detect wedding website subdomain from the X-Wedding-Host header
 * (set by the Cloudflare Worker for *.planfortwo.com requests).
 * Returns the subdomain slug or null if this is a normal app request.
 */
function getWeddingSubdomain(request: NextRequest): string | null {
  const hostname = (request.headers.get('x-wedding-host') ?? '').split(':')[0] ?? ''
  const match = hostname.match(/^([a-z0-9-]+)\.planfortwo\.com$/)
  const subdomain = match?.[1]
  if (subdomain && !RESERVED_SUBDOMAINS.has(subdomain)) {
    return subdomain
  }
  return null
}

// Clerk middleware handler — only used for non-subdomain (app) requests
const clerkHandler = clerkMiddleware(async (auth, request) => {
  if (!isPublicRoute(request)) {
    await auth.protect()
  }
})

export default function middleware(request: NextRequest, event: NextFetchEvent) {
  // Wedding subdomain requests bypass Clerk entirely.
  // Clerk's client-side JS causes a redirect when the browser domain
  // (e.g. jabby.planfortwo.com) doesn't match the configured Clerk domain.
  const subdomain = getWeddingSubdomain(request)
  if (subdomain) {
    const url = new URL(`/s/${subdomain}`, request.url)
    return NextResponse.rewrite(url)
  }

  // All other requests go through Clerk auth
  return clerkHandler(request, event)
}

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}
