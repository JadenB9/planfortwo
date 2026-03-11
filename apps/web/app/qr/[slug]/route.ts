import { NextRequest, NextResponse } from 'next/server'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  // Fire-and-forget: track this QR scan via the existing analytics endpoint
  const xff = request.headers.get('x-forwarded-for') ?? ''
  const ua = request.headers.get('user-agent') ?? ''

  fetch(`${API_URL}/website-public/${encodeURIComponent(slug)}/track`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-forwarded-for': xff,
      'user-agent': ua,
    },
    body: JSON.stringify({ path: 'qr-scan', referrer: 'qr-code' }),
  }).catch(() => {})

  // 302 redirect to the public wedding website
  return NextResponse.redirect(new URL(`/s/${encodeURIComponent(slug)}`, request.url), 302)
}
