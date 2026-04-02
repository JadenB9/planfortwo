'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, Trash2, Loader2, ExternalLink, Gift, Banknote } from 'lucide-react'
import { toast } from 'sonner'
import { api } from '@/lib/api'
import type { RegistryContent } from '@planfortwo/types'
import type { RegistryLink, CashFund } from '@planfortwo/types'

interface RegistryEditorProps {
  content: RegistryContent
  onChange: (content: RegistryContent) => void
  getToken: () => Promise<string | null>
  weddingId: string
}

const EMPTY_REGISTRIES: RegistryLink[] = []

export function RegistryEditor({ content, onChange, getToken, weddingId }: RegistryEditorProps) {
  const [links, setLinks] = useState<RegistryLink[]>([])
  const [funds, setFunds] = useState<CashFund[]>([])
  const [loading, setLoading] = useState(true)

  const registries = content.registries ?? EMPTY_REGISTRIES

  const fetchData = useCallback(async () => {
    try {
      const token = await getToken()
      if (!token || !weddingId) return

      const [linksRes, fundsRes] = await Promise.all([
        api.registry.listLinks(weddingId, token),
        api.registry.listFunds(weddingId, token),
      ])

      setLinks(linksRes.data ?? [])
      setFunds(fundsRes.data ?? [])
    } catch {
      toast.error('Failed to load registries')
    } finally {
      setLoading(false)
    }
  }, [getToken, weddingId])

  useEffect(() => {
    void fetchData()
  }, [fetchData])

  const isLinkSelected = useCallback(
    (link: RegistryLink): boolean => {
      return registries.some((r) => r.name === link.storeName && r.url === link.url)
    },
    [registries],
  )

  const isFundSelected = useCallback(
    (fund: CashFund): boolean => {
      return registries.some((r) => r.name === fund.name && r.isCashFund === true)
    },
    [registries],
  )

  function toggleLink(link: RegistryLink) {
    if (isLinkSelected(link)) {
      onChange({
        ...content,
        registries: registries.filter((r) => !(r.name === link.storeName && r.url === link.url)),
      })
    } else {
      onChange({
        ...content,
        registries: [
          ...registries,
          {
            name: link.storeName,
            url: link.url,
            logoUrl: link.logoUrl ?? undefined,
          },
        ],
      })
    }
  }

  function toggleFund(fund: CashFund) {
    if (isFundSelected(fund)) {
      onChange({
        ...content,
        registries: registries.filter((r) => !(r.name === fund.name && r.isCashFund === true)),
      })
    } else {
      onChange({
        ...content,
        registries: [
          ...registries,
          {
            name: fund.name,
            url: '',
            isCashFund: true,
            description: fund.description ?? undefined,
            goalAmount: fund.goalAmount,
            currentAmount: fund.currentAmount,
          },
        ],
      })
    }
  }

  function updateFundUrl(fundName: string, url: string) {
    const updated = registries.map((r) => (r.isCashFund && r.name === fundName ? { ...r, url } : r))
    onChange({ ...content, registries: updated })
  }

  function addCustomRegistry() {
    onChange({
      ...content,
      registries: [...registries, { name: '', url: '', logoUrl: '' }],
    })
  }

  function updateCustomRegistry(index: number, field: 'name' | 'url' | 'logoUrl', value: string) {
    const updated = registries.map((reg, i) => (i === index ? { ...reg, [field]: value } : reg))
    onChange({ ...content, registries: updated })
  }

  function removeRegistry(index: number) {
    onChange({
      ...content,
      registries: registries.filter((_, i) => i !== index),
    })
  }

  /** Identify custom entries -- those not matching any known link or fund */
  const isCustomEntry = useCallback(
    (reg: RegistryContent['registries'][number]): boolean => {
      if (reg.isCashFund) return false
      const matchesLink = links.some((l) => l.storeName === reg.name && l.url === reg.url)
      return !matchesLink
    },
    [links],
  )

  const customRegistries = registries
    .map((reg, index) => ({ reg, index }))
    .filter(({ reg }) => isCustomEntry(reg))

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <div className="space-y-5">
      {/* Message */}
      <div>
        <label htmlFor="registry-message" className="text-foreground text-sm font-medium">
          Message
        </label>
        <textarea
          id="registry-message"
          value={content.message ?? ''}
          onChange={(e) => onChange({ ...content, message: e.target.value })}
          placeholder="Your presence is the greatest gift, but if you'd like to honor us with something special..."
          rows={3}
          className="border-border mt-1 block w-full rounded-md border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      {/* Import from existing registries */}
      <div className="border-border border-t pt-4">
        <h3 className="text-foreground text-sm font-medium">Import from your registries</h3>
        <p className="text-muted-foreground mt-1 text-xs">
          Select registries and cash funds from your dashboard to display on your website.
        </p>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="text-muted-foreground h-6 w-6 animate-spin" />
            <span className="text-muted-foreground ml-2 text-sm">Loading registries...</span>
          </div>
        ) : links.length === 0 && funds.length === 0 ? (
          <div className="border-border bg-muted mt-3 flex flex-col items-center gap-3 rounded-lg border border-dashed p-8 text-center">
            <Gift className="text-muted-foreground h-8 w-8" />
            <div>
              <p className="text-foreground text-sm font-medium">No registries found</p>
              <p className="text-muted-foreground mt-1 text-xs">
                Add registry links or cash funds in the{' '}
                <a
                  href="/registry"
                  className="inline-flex items-center gap-1 font-medium text-blue-600 hover:text-blue-700"
                >
                  Registry <ExternalLink className="h-3 w-3" />
                </a>{' '}
                section first, or add custom registries below.
              </p>
            </div>
          </div>
        ) : (
          <div className="mt-3 space-y-4">
            {/* Registry Links */}
            {links.length > 0 && (
              <div>
                <div className="mb-2 flex items-center gap-1.5">
                  <Gift className="text-muted-foreground h-4 w-4" />
                  <span className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
                    Your Registries
                  </span>
                </div>
                <div className="space-y-2">
                  {links.map((link) => {
                    const selected = isLinkSelected(link)
                    return (
                      <button
                        key={link.id}
                        type="button"
                        onClick={() => toggleLink(link)}
                        className={`flex w-full items-center gap-3 rounded-lg border px-4 py-3 text-left transition-all ${
                          selected
                            ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-200'
                            : 'border-border bg-background hover:border-border hover:bg-muted'
                        }`}
                      >
                        {/* Toggle indicator */}
                        <div
                          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors ${
                            selected ? 'border-blue-500 bg-blue-500' : 'border-border bg-background'
                          }`}
                        >
                          {selected && (
                            <svg
                              className="h-3.5 w-3.5 text-white"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth={3}
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          )}
                        </div>

                        {/* Logo */}
                        {link.logoUrl && (
                          // Registry logos are third-party assets from arbitrary domains.
                          // Keep native img rendering instead of proxying them through Next's optimizer.
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={link.logoUrl}
                            alt=""
                            loading="lazy"
                            decoding="async"
                            referrerPolicy="no-referrer"
                            className="h-8 w-8 shrink-0 rounded-md object-contain"
                          />
                        )}

                        {/* Info */}
                        <div className="min-w-0 flex-1">
                          <p className="text-foreground truncate text-sm font-medium">
                            {link.storeName}
                          </p>
                          <p className="text-muted-foreground truncate text-xs">{link.url}</p>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Cash Funds */}
            {funds.length > 0 && (
              <div>
                <div className="mb-2 flex items-center gap-1.5">
                  <Banknote className="text-muted-foreground h-4 w-4" />
                  <span className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
                    Cash Funds
                  </span>
                </div>
                <div className="space-y-2">
                  {funds
                    .filter((f) => f.isActive)
                    .map((fund) => {
                      const selected = isFundSelected(fund)
                      const selectedEntry = selected
                        ? registries.find((r) => r.isCashFund && r.name === fund.name)
                        : null
                      const progress =
                        fund.goalAmount > 0
                          ? Math.min(100, Math.round((fund.currentAmount / fund.goalAmount) * 100))
                          : 0
                      return (
                        <div key={fund.id} className="space-y-0">
                          <button
                            type="button"
                            onClick={() => toggleFund(fund)}
                            className={`flex w-full items-center gap-3 rounded-lg border px-4 py-3 text-left transition-all ${
                              selected
                                ? 'rounded-b-none border-blue-500 bg-blue-50 ring-1 ring-blue-200'
                                : 'border-border bg-background hover:border-border hover:bg-muted'
                            }`}
                          >
                            {/* Toggle indicator */}
                            <div
                              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors ${
                                selected
                                  ? 'border-blue-500 bg-blue-500'
                                  : 'border-border bg-background'
                              }`}
                            >
                              {selected && (
                                <svg
                                  className="h-3.5 w-3.5 text-white"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                  strokeWidth={3}
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M5 13l4 4L19 7"
                                  />
                                </svg>
                              )}
                            </div>

                            {/* Info */}
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-2">
                                <p className="text-foreground truncate text-sm font-medium">
                                  {fund.name}
                                </p>
                                <span className="text-muted-foreground shrink-0 text-xs">
                                  {formatCurrency(fund.currentAmount)} /{' '}
                                  {formatCurrency(fund.goalAmount)}
                                </span>
                              </div>
                              {fund.goalAmount > 0 && (
                                <div className="bg-muted mt-1.5 h-1.5 w-full overflow-hidden rounded-full">
                                  <div
                                    className="h-full rounded-full bg-green-500 transition-all"
                                    style={{ width: `${progress}%` }}
                                  />
                                </div>
                              )}
                              {fund.description && (
                                <p className="text-muted-foreground mt-1 truncate text-xs">
                                  {fund.description}
                                </p>
                              )}
                            </div>
                          </button>
                          {selected && (
                            <div className="rounded-b-lg border border-t-0 border-blue-500 bg-blue-50 px-4 pb-3 pt-2">
                              <label className="text-muted-foreground text-xs font-medium">
                                Payment Link{' '}
                                <span className="text-muted-foreground font-normal">
                                  (Venmo, PayPal, CashApp, etc.)
                                </span>
                              </label>
                              <input
                                type="text"
                                value={selectedEntry?.url ?? ''}
                                onClick={(e) => e.stopPropagation()}
                                onChange={(e) => updateFundUrl(fund.name, e.target.value)}
                                placeholder="https://venmo.com/yourname"
                                className="border-border bg-background mt-1 block w-full rounded-md border px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                              />
                            </div>
                          )}
                        </div>
                      )
                    })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Custom Registries */}
      <div className="border-border border-t pt-4">
        <div className="flex items-center justify-between">
          <label className="text-foreground text-sm font-medium">Custom Registries</label>
          <button
            type="button"
            onClick={addCustomRegistry}
            className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-800"
          >
            <Plus className="h-4 w-4" />
            Add Custom
          </button>
        </div>

        {customRegistries.length === 0 && (
          <p className="text-muted-foreground mt-2 text-sm">
            Add registries not listed above by entering the name and URL manually.
          </p>
        )}

        <div className="mt-3 space-y-4">
          {customRegistries.map(({ reg, index }) => (
            <div key={index} className="border-border relative rounded-lg border p-4">
              <button
                type="button"
                onClick={() => removeRegistry(index)}
                className="absolute right-3 top-3 flex items-center gap-1 text-sm text-red-500 hover:text-red-700"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Remove
              </button>

              <div className="space-y-3 pr-20">
                <div>
                  <label
                    htmlFor={`reg-name-${index}`}
                    className="text-foreground text-sm font-medium"
                  >
                    Registry Name
                  </label>
                  <input
                    id={`reg-name-${index}`}
                    type="text"
                    value={reg.name}
                    onChange={(e) => updateCustomRegistry(index, 'name', e.target.value)}
                    placeholder="e.g. Amazon, Crate & Barrel, Zola"
                    className="border-border mt-1 block w-full rounded-md border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label
                    htmlFor={`reg-url-${index}`}
                    className="text-foreground text-sm font-medium"
                  >
                    Registry URL
                  </label>
                  <input
                    id={`reg-url-${index}`}
                    type="text"
                    value={reg.url}
                    onChange={(e) => updateCustomRegistry(index, 'url', e.target.value)}
                    placeholder="https://www.amazon.com/wedding/your-registry"
                    className="border-border mt-1 block w-full rounded-md border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label
                    htmlFor={`reg-logo-${index}`}
                    className="text-foreground text-sm font-medium"
                  >
                    Logo URL <span className="text-muted-foreground font-normal">(optional)</span>
                  </label>
                  <input
                    id={`reg-logo-${index}`}
                    type="text"
                    value={reg.logoUrl ?? ''}
                    onChange={(e) => updateCustomRegistry(index, 'logoUrl', e.target.value)}
                    placeholder="https://example.com/logo.png"
                    className="border-border mt-1 block w-full rounded-md border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Summary */}
      {registries.length > 0 && (
        <div className="bg-muted rounded-lg px-4 py-3">
          <p className="text-muted-foreground text-xs">
            {registries.length} {registries.length === 1 ? 'registry' : 'registries'} will be shown
            on your website.
          </p>
        </div>
      )}
    </div>
  )
}
