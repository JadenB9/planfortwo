import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Hono } from 'hono'

vi.mock('../services/payments.js', () => ({
  purchaseService: {
    getStripe: vi.fn().mockReturnValue({
      webhooks: {
        constructEvent: vi.fn(),
      },
    }),
    handleCheckoutCompleted: vi.fn().mockResolvedValue(undefined),
  },
}))

import { stripeWebhookRoute } from './webhooks-stripe.js'
import { purchaseService } from '../services/payments.js'

function createApp() {
  const app = new Hono()
  app.route('/webhooks/stripe', stripeWebhookRoute)
  return app
}

const VALID_CHECKOUT_EVENT = {
  type: 'checkout.session.completed',
  data: {
    object: {
      id: 'cs_test_abc123',
      metadata: { weddingId: 'a0000000-0000-0000-0000-000000000001' },
      payment_intent: 'pi_test_abc123',
    },
  },
}

describe('Stripe Webhook Route', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv('STRIPE_WEBHOOK_SECRET', 'whsec_test')

    const stripe = purchaseService.getStripe()
    vi.mocked(stripe.webhooks.constructEvent).mockReturnValue(VALID_CHECKOUT_EVENT as never)
    vi.mocked(purchaseService.handleCheckoutCompleted).mockResolvedValue(undefined)
  })

  it('returns 500 when STRIPE_WEBHOOK_SECRET not configured', async () => {
    vi.stubEnv('STRIPE_WEBHOOK_SECRET', '')

    const app = createApp()
    const res = await app.request('/webhooks/stripe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'stripe-signature': 'sig_test',
      },
      body: JSON.stringify(VALID_CHECKOUT_EVENT),
    })

    expect(res.status).toBe(500)
    const json = await res.json()
    expect(json.error).toBe('Webhook not configured')
  })

  it('returns 400 when stripe-signature header missing', async () => {
    const app = createApp()
    const res = await app.request('/webhooks/stripe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(VALID_CHECKOUT_EVENT),
    })

    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toBe('Missing stripe-signature header')
  })

  it('returns 400 when signature verification fails', async () => {
    const stripe = purchaseService.getStripe()
    vi.mocked(stripe.webhooks.constructEvent).mockImplementation(() => {
      throw new Error('Signature verification failed')
    })

    const app = createApp()
    const res = await app.request('/webhooks/stripe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'stripe-signature': 'bad_sig',
      },
      body: JSON.stringify(VALID_CHECKOUT_EVENT),
    })

    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toBe('Invalid signature')
  })

  it('returns 200 with received:true for valid checkout.session.completed event', async () => {
    const app = createApp()
    const res = await app.request('/webhooks/stripe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'stripe-signature': 'sig_valid',
      },
      body: JSON.stringify(VALID_CHECKOUT_EVENT),
    })

    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.received).toBe(true)
  })

  it('calls handleCheckoutCompleted for checkout.session.completed', async () => {
    const app = createApp()
    await app.request('/webhooks/stripe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'stripe-signature': 'sig_valid',
      },
      body: JSON.stringify(VALID_CHECKOUT_EVENT),
    })

    expect(purchaseService.handleCheckoutCompleted).toHaveBeenCalledWith(
      VALID_CHECKOUT_EVENT.data.object,
    )
  })

  it('returns 200 for non-checkout events', async () => {
    const nonCheckoutEvent = {
      type: 'payment_intent.succeeded',
      data: { object: { id: 'pi_test_abc123' } },
    }

    const stripe = purchaseService.getStripe()
    vi.mocked(stripe.webhooks.constructEvent).mockReturnValue(nonCheckoutEvent as never)

    const app = createApp()
    const res = await app.request('/webhooks/stripe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'stripe-signature': 'sig_valid',
      },
      body: JSON.stringify(nonCheckoutEvent),
    })

    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.received).toBe(true)
    expect(purchaseService.handleCheckoutCompleted).not.toHaveBeenCalled()
  })

  it('returns 500 when handleCheckoutCompleted throws', async () => {
    vi.mocked(purchaseService.handleCheckoutCompleted).mockRejectedValue(
      new Error('DB connection failed'),
    )

    const app = createApp()
    const res = await app.request('/webhooks/stripe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'stripe-signature': 'sig_valid',
      },
      body: JSON.stringify(VALID_CHECKOUT_EVENT),
    })

    expect(res.status).toBe(500)
    const json = await res.json()
    expect(json.error).toBe('Processing failed')
  })
})
