import { createHash } from 'node:crypto'
import { isIP } from 'node:net'
import type { Context } from 'hono'

const DIRECT_IP_HEADERS = ['cf-connecting-ip', 'true-client-ip', 'x-real-ip'] as const

function normalizeIpCandidate(value: string | null | undefined): string | null {
  if (!value) return null

  const trimmed = value.trim()
  if (!trimmed) return null

  if (isIP(trimmed)) return trimmed.toLowerCase()

  const bracketMatch = trimmed.match(/^\[([^\]]+)\](?::\d+)?$/)
  if (bracketMatch?.[1] && isIP(bracketMatch[1])) {
    return bracketMatch[1].toLowerCase()
  }

  const withoutPort = trimmed.replace(/:\d+$/, '')
  if (isIP(withoutPort)) return withoutPort.toLowerCase()

  return null
}

function getForwardedForIp(value: string | null | undefined): string | null {
  if (!value) return null

  for (const candidate of value.split(',')) {
    const normalized = normalizeIpCandidate(candidate)
    if (normalized) return normalized
  }

  return null
}

export function getClientIp(c: Context): string | null {
  if (process.env.TRUST_PROXY_HEADERS === 'false') return null

  for (const header of DIRECT_IP_HEADERS) {
    const ip = normalizeIpCandidate(c.req.header(header))
    if (ip) return ip
  }

  return getForwardedForIp(c.req.header('x-forwarded-for'))
}

export function getClientIdentifier(c: Context): string {
  const ip = getClientIp(c) ?? 'unknown'
  const userAgent = c.req.header('user-agent')?.trim() ?? 'unknown'
  const userAgentHash = createHash('sha256').update(userAgent).digest('hex').slice(0, 16)
  return `${ip}:${userAgentHash}`
}
