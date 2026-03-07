import crypto from 'node:crypto'
import { eq, and, ne, sql } from 'drizzle-orm'
import { db, partnerInvitations, weddingMembers, weddings } from '@planfortwo/db'
import { userService } from './users.js'
import { emailService } from './email.js'

const INVITATION_EXPIRY_DAYS = 7

export const invitationService = {
  async createAndSend(
    weddingId: string,
    invitedByUserId: string,
    email: string,
    role: 'partner' | 'planner' | 'family' = 'partner',
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
        role,
        status: 'pending',
        expiresAt,
      })
      .returning()

    if (!invitation) {
      throw new Error('Failed to create invitation')
    }

    const inviter = await userService.findById(invitedByUserId)
    const inviterName = inviter ? `${inviter.firstName} ${inviter.lastName}` : 'Your partner'

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
    const inviteUrl = `${appUrl}/invite/${token}`

    if (role === 'partner') {
      await emailService.sendPartnerInvite(email, inviterName, inviteUrl)
    } else {
      const roleLabel = role === 'planner' ? 'wedding planner' : 'family member'
      await emailService.sendTeamMemberInvite(email, inviterName, roleLabel, inviteUrl)
    }

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

    // Add user as member with the invitation's role, update invitation, and clean up any
    // auto-created empty wedding the user may have (race condition safety)
    const memberRole = invitation.role ?? 'partner'
    const result = await db.transaction(async (tx) => {
      await tx.insert(weddingMembers).values({
        weddingId: invitation.weddingId,
        userId,
        role: memberRole,
        joinedAt: new Date(),
      })

      await tx
        .update(partnerInvitations)
        .set({ status: 'accepted' })
        .where(eq(partnerInvitations.id, invitation.id))

      // Delete any auto-created empty weddings the user owns (only for partner invites)
      // Only delete weddings where the user is the sole member and onboarding was never completed
      if (memberRole !== 'partner') {
        return invitation.weddingId
      }

      const ownedMemberships = await tx
        .select({ weddingId: weddingMembers.weddingId })
        .from(weddingMembers)
        .where(
          and(
            eq(weddingMembers.userId, userId),
            eq(weddingMembers.role, 'owner'),
            ne(weddingMembers.weddingId, invitation.weddingId),
          ),
        )

      for (const m of ownedMemberships) {
        // Count members of this wedding — only delete if this user is the only one
        const memberCount = await tx
          .select({ count: sql<number>`count(*)::int` })
          .from(weddingMembers)
          .where(eq(weddingMembers.weddingId, m.weddingId))

        const count = memberCount[0]?.count ?? 0

        if (count === 1) {
          // Check that onboarding was never completed (it's truly an empty auto-created wedding)
          const [w] = await tx
            .select({ onboardingCompleted: weddings.onboardingCompleted })
            .from(weddings)
            .where(eq(weddings.id, m.weddingId))

          if (w && !w.onboardingCompleted) {
            await tx.delete(weddingMembers).where(eq(weddingMembers.weddingId, m.weddingId))
            await tx.delete(weddings).where(eq(weddings.id, m.weddingId))
          }
        }
      }

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

  async getPendingByWedding(weddingId: string) {
    const results = await db
      .select()
      .from(partnerInvitations)
      .where(
        and(eq(partnerInvitations.weddingId, weddingId), eq(partnerInvitations.status, 'pending')),
      )

    return results
  },

  async cancel(invitationId: string, weddingId: string) {
    const [invitation] = await db
      .select()
      .from(partnerInvitations)
      .where(
        and(
          eq(partnerInvitations.id, invitationId),
          eq(partnerInvitations.weddingId, weddingId),
          eq(partnerInvitations.status, 'pending'),
        ),
      )

    if (!invitation) {
      return null
    }

    const [updated] = await db
      .update(partnerInvitations)
      .set({ status: 'cancelled' })
      .where(eq(partnerInvitations.id, invitationId))
      .returning()

    return updated ?? null
  },
}
