import crypto from 'node:crypto'
import { eq, and } from 'drizzle-orm'
import { db, partnerInvitations, weddingMembers } from '@planfortwo/db'
import { userService } from './users.js'
import { emailService } from './email.js'

const INVITATION_EXPIRY_DAYS = 7

export const invitationService = {
  async createAndSend(
    weddingId: string,
    invitedByUserId: string,
    email: string,
  ) {
    const token = crypto.randomUUID()
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + INVITATION_EXPIRY_DAYS)

    const [invitation] = await db
      .insert(partnerInvitations)
      .values({
        weddingId,
        invitedByUserId,
        email,
        token,
        status: 'pending',
        expiresAt,
      })
      .returning()

    if (!invitation) {
      throw new Error('Failed to create invitation')
    }

    const inviter = await userService.findById(invitedByUserId)
    const inviterName = inviter
      ? `${inviter.firstName} ${inviter.lastName}`
      : 'Your partner'

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
    const inviteUrl = `${appUrl}/invite/${token}`

    await emailService.sendPartnerInvite(email, inviterName, inviteUrl)

    return invitation
  },

  async accept(token: string, userId: string) {
    const invitation = await this.findByToken(token)

    if (!invitation) {
      throw new Error('Invitation not found')
    }

    if (invitation.status !== 'pending') {
      throw new Error(`Invitation has already been ${invitation.status}`)
    }

    if (new Date() > invitation.expiresAt) {
      await db
        .update(partnerInvitations)
        .set({ status: 'expired' })
        .where(eq(partnerInvitations.id, invitation.id))

      throw new Error('Invitation has expired')
    }

    // Add user as partner member and update invitation in a transaction
    const result = await db.transaction(async (tx) => {
      await tx.insert(weddingMembers).values({
        weddingId: invitation.weddingId,
        userId,
        role: 'partner',
        joinedAt: new Date(),
      })

      await tx
        .update(partnerInvitations)
        .set({ status: 'accepted' })
        .where(eq(partnerInvitations.id, invitation.id))

      return invitation.weddingId
    })

    return result
  },

  async findByToken(token: string) {
    const results = await db
      .select()
      .from(partnerInvitations)
      .where(eq(partnerInvitations.token, token))

    return results[0] ?? null
  },
}
