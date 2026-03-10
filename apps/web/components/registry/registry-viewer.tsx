'use client'

/**
 * Opens a registry URL in a new browser tab.
 * Most external sites (Amazon, Target, Zola, etc.) block iframe embedding
 * via X-Frame-Options, so we skip the iframe approach entirely.
 */
export function openRegistryLink(url: string) {
  window.open(url, '_blank', 'noopener,noreferrer')
}
