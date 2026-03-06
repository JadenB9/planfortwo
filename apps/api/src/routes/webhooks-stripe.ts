import { Hono } from 'hono'
import type Stripe from 'stripe'
import { purchaseService } from '../services/payments.js'

export const stripeWebhookRoute = new Hono()

stripeWebhookRoute.post('/', async (c) => {
  const stripe = purchaseService.getStripe()
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET is not configured')
    return c.json({ error: 'Webhook not configured' }, 500)
  }

  const signature = c.req.header('stripe-signature')
  if (!signature) {
    return c.json({ error: 'Missing stripe-signature header' }, 400)
  }

  const rawBody = await c.req.text()

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret)
  } catch (err) {
    console.error('Stripe webhook signature verification failed:', err)
    return c.json({ error: 'Invalid signature' }, 400)
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    try {
      await purchaseService.handleCheckoutCompleted(session)
      console.log(`Checkout completed for wedding ${session.metadata?.weddingId}`)
    } catch (err) {
      console.error('Failed to process checkout completion:', err)
      return c.json({ error: 'Processing failed' }, 500)
    }
  }

  return c.json({ received: true })
})
