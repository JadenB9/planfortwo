import { Hono } from 'hono'
import { Webhook } from 'svix'
import { inboxService } from '../services/inbox.js'

export const resendWebhookRoute = new Hono()

resendWebhookRoute.post('/', async (c) => {
  const webhookSecret = process.env.RESEND_WEBHOOK_SECRET
  if (!webhookSecret) {
    console.error('[resend-webhook] RESEND_WEBHOOK_SECRET not configured')
    return c.json({ error: 'Webhook not configured' }, 500)
  }

  const svixId = c.req.header('svix-id')
  const svixTimestamp = c.req.header('svix-timestamp')
  const svixSignature = c.req.header('svix-signature')

  if (!svixId || !svixTimestamp || !svixSignature) {
    return c.json({ error: 'Missing signature headers' }, 400)
  }

  const rawBody = await c.req.text()

  let payload: Record<string, unknown>
  try {
    const wh = new Webhook(webhookSecret)
    payload = wh.verify(rawBody, {
      'svix-id': svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': svixSignature,
    }) as Record<string, unknown>
  } catch {
    return c.json({ error: 'Invalid signature' }, 400)
  }

  const eventType = payload.type as string

  if (eventType === 'email.received') {
    const data = payload.data as Record<string, unknown>
    const toAddresses = (data.to as string[]) ?? []
    const fromAddress = data.from as string
    const subject = (data.subject as string) ?? '(No Subject)'
    const emailId = data.email_id as string

    for (const toAddr of toAddresses) {
      const localPart = toAddr.split('@')[0]?.toLowerCase()
      if (!localPart) continue

      const address = await inboxService.findAddressByLocalPart(localPart)
      if (!address) continue

      let textBody: string | undefined
      let htmlBody: string | undefined

      try {
        const resendApiKey = process.env.RESEND_API_KEY
        if (resendApiKey && emailId) {
          const response = await fetch('https://api.resend.com/emails/receiving', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${resendApiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email_id: emailId }),
          })

          if (response.ok) {
            const emailContent = (await response.json()) as Record<string, unknown>
            textBody = (emailContent.text as string) ?? undefined
            htmlBody = (emailContent.html as string) ?? undefined
          }
        }
      } catch (err) {
        console.error('[resend-webhook] Failed to fetch email content:', err)
      }

      await inboxService.storeInboundEmail(address.id, {
        resendEmailId: emailId,
        fromAddress,
        toAddress: toAddr,
        subject,
        textBody,
        htmlBody,
      })
    }
  }

  return c.json({ received: true })
})
