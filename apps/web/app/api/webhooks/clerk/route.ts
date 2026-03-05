import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { Webhook } from 'svix'
import { eq } from 'drizzle-orm'
import { db, users, weddings, weddingMembers } from '@planfortwo/db'

interface ClerkWebhookEvent {
  type: string
  data: {
    id: string
    email_addresses?: Array<{ email_address: string }>
    first_name?: string
    last_name?: string
    image_url?: string | null
  }
}

export async function POST(req: Request) {
  const headerPayload = await headers()
  const svixId = headerPayload.get('svix-id')
  const svixTimestamp = headerPayload.get('svix-timestamp')
  const svixSignature = headerPayload.get('svix-signature')

  if (!svixId || !svixTimestamp || !svixSignature) {
    return NextResponse.json(
      { error: 'Missing required Svix headers', code: 'MISSING_HEADERS' },
      { status: 400 },
    )
  }

  const body = await req.text()

  let event: ClerkWebhookEvent

  try {
    const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET!)
    event = wh.verify(body, {
      'svix-id': svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': svixSignature,
    }) as ClerkWebhookEvent
  } catch {
    return NextResponse.json(
      { error: 'Invalid webhook signature', code: 'INVALID_SIGNATURE' },
      { status: 400 },
    )
  }

  try {
    switch (event.type) {
      case 'user.created': {
        const primaryEmail = event.data.email_addresses?.[0]?.email_address ?? ''
        await db.transaction(async (tx) => {
          const [user] = await tx
            .insert(users)
            .values({
              clerkId: event.data.id,
              email: primaryEmail,
              firstName: event.data.first_name ?? '',
              lastName: event.data.last_name ?? '',
              avatarUrl: event.data.image_url ?? null,
            })
            .returning()

          if (!user) {
            throw new Error('Failed to create user')
          }

          const [wedding] = await tx.insert(weddings).values({ name: 'Our Wedding' }).returning()

          if (!wedding) {
            throw new Error('Failed to create default wedding')
          }

          await tx.insert(weddingMembers).values({
            weddingId: wedding.id,
            userId: user.id,
            role: 'owner',
            joinedAt: new Date(),
          })
        })
        break
      }

      case 'user.updated': {
        const primaryEmail = event.data.email_addresses?.[0]?.email_address ?? ''
        await db
          .update(users)
          .set({
            email: primaryEmail,
            firstName: event.data.first_name ?? '',
            lastName: event.data.last_name ?? '',
            avatarUrl: event.data.image_url ?? null,
          })
          .where(eq(users.clerkId, event.data.id))
        break
      }

      case 'user.deleted': {
        await db.delete(users).where(eq(users.clerkId, event.data.id))
        break
      }

      default:
        break
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error(`Error handling webhook event ${event.type}:`, error)
    return NextResponse.json(
      { error: 'Webhook handler failed', code: 'HANDLER_ERROR' },
      { status: 500 },
    )
  }
}
