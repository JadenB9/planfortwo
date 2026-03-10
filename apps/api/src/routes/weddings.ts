import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import {
  onboardingSchema,
  invitePartnerSchema,
  inviteMemberSchema,
  updateWeddingSchema,
} from '@planfortwo/validators'
import type { TimelineTemplate } from '@planfortwo/types'
import { authMiddleware } from '../middleware/auth.js'
import { resolveUserMiddleware } from '../middleware/resolve-user.js'
import { weddingService } from '../services/weddings.js'
import { invitationService } from '../services/invitations.js'
import { checklistService } from '../services/checklist.js'

type Env = {
  Variables: {
    clerkUserId: string
    dbUserId: string
    dbUser: { id: string; email: string; firstName: string; lastName: string }
  }
}

export const weddingsRoute = new Hono<Env>()

weddingsRoute.use('*', authMiddleware, resolveUserMiddleware)

// GET /weddings/mine -- fetch the current user's wedding + members + countdown
weddingsRoute.get('/mine', async (c) => {
  const dbUserId = c.get('dbUserId')

  const wedding = await weddingService.findByUserId(dbUserId)

  if (!wedding) {
    return c.json({ error: 'No wedding found', code: 'WEDDING_NOT_FOUND', statusCode: 404 }, 404)
  }

  const members = await weddingService.getMembers(wedding.id)

  let daysUntilWedding: number | null = null
  if (wedding.date) {
    const weddingDate = new Date(wedding.date)
    const now = new Date()
    const diffMs = weddingDate.getTime() - now.getTime()
    daysUntilWedding = Math.ceil(diffMs / (1000 * 60 * 60 * 24))
  }

  return c.json({
    data: {
      wedding,
      members,
      daysUntilWedding,
    },
  })
})

// PUT /weddings/:id -- update wedding details
weddingsRoute.put(
  '/:id',
  zValidator('json', updateWeddingSchema, (result, c) => {
    if (!result.success) {
      return c.json({ error: 'Validation failed', code: 'VALIDATION_ERROR', statusCode: 400 }, 400)
    }
  }),
  async (c) => {
    const weddingId = c.req.param('id')
    const dbUserId = c.get('dbUserId')

    const membership = await weddingService.verifyMembership(weddingId, dbUserId)
    if (!membership) {
      return c.json(
        { error: 'Not a member of this wedding', code: 'FORBIDDEN', statusCode: 403 },
        403,
      )
    }

    const data = c.req.valid('json')
    const updateData: Record<string, unknown> = {}
    if (data.name !== undefined) updateData.name = data.name
    if (data.date !== undefined) updateData.date = data.date ? new Date(data.date) : null
    if (data.venue !== undefined) updateData.venue = data.venue
    if (data.city !== undefined) updateData.city = data.city
    if (data.state !== undefined) updateData.state = data.state
    if (data.country !== undefined) updateData.country = data.country
    if (data.guestCountEstimate !== undefined)
      updateData.guestCountEstimate = data.guestCountEstimate
    if (data.budgetTotal !== undefined)
      updateData.budgetTotal = data.budgetTotal != null ? String(data.budgetTotal) : null
    if (data.style !== undefined) updateData.style = data.style
    if (data.themeColors !== undefined) updateData.themeColors = data.themeColors

    const updated = await weddingService.update(weddingId, updateData)

    if (!updated) {
      return c.json({ error: 'No fields to update', code: 'NO_CHANGES', statusCode: 400 }, 400)
    }

    return c.json({ data: updated })
  },
)

// POST /weddings/:id/onboarding -- complete the onboarding wizard
weddingsRoute.post(
  '/:id/onboarding',
  zValidator('json', onboardingSchema, (result, c) => {
    if (!result.success) {
      return c.json({ error: 'Validation failed', code: 'VALIDATION_ERROR', statusCode: 400 }, 400)
    }
  }),
  async (c) => {
    const weddingId = c.req.param('id')
    const dbUserId = c.get('dbUserId')

    const membership = await weddingService.verifyMembership(weddingId, dbUserId)
    if (!membership) {
      return c.json(
        { error: 'Not a member of this wedding', code: 'FORBIDDEN', statusCode: 403 },
        403,
      )
    }

    const validated = c.req.valid('json')

    // Map nullable fields to undefined for the service layer
    const onboardingData = {
      name: `${validated.partnerFirstName} & Partner`,
      guestCountEstimate: validated.guestCountEstimate ?? undefined,
      budgetTotal: validated.budgetTotal != null ? String(validated.budgetTotal) : undefined,
      style: validated.style ?? undefined,
      timelineTemplate: validated.timelineTemplate,
      date: validated.weddingDate ? new Date(validated.weddingDate) : undefined,
    }

    const updated = await weddingService.completeOnboarding(weddingId, onboardingData)

    if (!updated) {
      return c.json(
        { error: 'Failed to complete onboarding', code: 'UPDATE_FAILED', statusCode: 500 },
        500,
      )
    }

    // Seed checklist after successful onboarding
    const seeded = await checklistService.hasBeenSeeded(weddingId)
    if (!seeded) {
      await checklistService.seedChecklist(
        weddingId,
        updated.timelineTemplate as TimelineTemplate,
        updated.date ? new Date(updated.date) : null,
        dbUserId,
      )
    }

    return c.json({ data: updated })
  },
)

// POST /weddings/:id/invite-partner -- send a partner invitation email
weddingsRoute.post(
  '/:id/invite-partner',
  zValidator('json', invitePartnerSchema, (result, c) => {
    if (!result.success) {
      return c.json({ error: 'Validation failed', code: 'VALIDATION_ERROR', statusCode: 400 }, 400)
    }
  }),
  async (c) => {
    const weddingId = c.req.param('id')
    const dbUserId = c.get('dbUserId')

    const membership = await weddingService.verifyMembership(weddingId, dbUserId)
    if (!membership) {
      return c.json(
        { error: 'Not a member of this wedding', code: 'FORBIDDEN', statusCode: 403 },
        403,
      )
    }

    if (membership.role !== 'owner') {
      return c.json(
        { error: 'Only the owner can invite a partner', code: 'FORBIDDEN', statusCode: 403 },
        403,
      )
    }

    const { email } = c.req.valid('json')

    try {
      const invitation = await invitationService.createAndSend(weddingId, dbUserId, email)
      return c.json({ data: invitation }, 201)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to send invitation'
      const code = message.toUpperCase().includes('RESEND')
        ? 'EMAIL_NOT_CONFIGURED'
        : 'EMAIL_SEND_FAILED'

      console.error('Partner invite failed:', err)
      return c.json({ error: 'Failed to send invitation', code, statusCode: 500 }, 500)
    }
  },
)

// POST /weddings/accept-invite/:token -- accept a partner invitation
weddingsRoute.post('/accept-invite/:token', async (c) => {
  const token = c.req.param('token')
  const dbUserId = c.get('dbUserId')

  try {
    const weddingId = await invitationService.accept(token, dbUserId)
    const wedding = await weddingService.findByUserId(dbUserId)

    return c.json({ data: wedding ?? { id: weddingId } })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to accept invitation'
    console.error('Accept invite failed:', err)

    if (message.includes('not found')) {
      return c.json(
        { error: 'Invitation not found', code: 'INVITATION_NOT_FOUND', statusCode: 404 },
        404,
      )
    }
    if (message.includes('expired')) {
      return c.json(
        { error: 'Invitation has expired', code: 'INVITATION_EXPIRED', statusCode: 410 },
        410,
      )
    }
    if (message.includes('already been')) {
      return c.json(
        { error: 'Invitation has already been used', code: 'INVITATION_USED', statusCode: 409 },
        409,
      )
    }

    return c.json(
      { error: 'Failed to accept invitation', code: 'INVITATION_FAILED', statusCode: 400 },
      400,
    )
  }
})

// DELETE /weddings/:id/invitations/:invitationId -- cancel a pending invitation
weddingsRoute.delete('/:id/invitations/:invitationId', async (c) => {
  const weddingId = c.req.param('id')
  const invitationId = c.req.param('invitationId')
  const dbUserId = c.get('dbUserId')

  const membership = await weddingService.verifyMembership(weddingId, dbUserId)
  if (!membership) {
    return c.json(
      { error: 'Not a member of this wedding', code: 'FORBIDDEN', statusCode: 403 },
      403,
    )
  }

  if (membership.role !== 'owner') {
    return c.json(
      { error: 'Only the owner can cancel invitations', code: 'FORBIDDEN', statusCode: 403 },
      403,
    )
  }

  const cancelled = await invitationService.cancel(invitationId, weddingId)

  if (!cancelled) {
    return c.json(
      { error: 'Invitation not found or already processed', code: 'NOT_FOUND', statusCode: 404 },
      404,
    )
  }

  return c.json({ data: { cancelled: true } })
})

// POST /weddings/:id/invitations/:invitationId/resend -- resend an invitation email
weddingsRoute.post('/:id/invitations/:invitationId/resend', async (c) => {
  const weddingId = c.req.param('id')
  const invitationId = c.req.param('invitationId')
  const dbUserId = c.get('dbUserId')

  const membership = await weddingService.verifyMembership(weddingId, dbUserId)
  if (!membership) {
    return c.json(
      { error: 'Not a member of this wedding', code: 'FORBIDDEN', statusCode: 403 },
      403,
    )
  }

  if (membership.role !== 'owner' && membership.role !== 'partner') {
    return c.json(
      { error: 'Only the couple can resend invitations', code: 'FORBIDDEN', statusCode: 403 },
      403,
    )
  }

  try {
    const invitation = await invitationService.resendInvitation(invitationId, weddingId)

    if (!invitation) {
      return c.json(
        {
          error: 'Invitation not found or already processed',
          code: 'NOT_FOUND',
          statusCode: 404,
        },
        404,
      )
    }

    return c.json({ data: { resent: true } })
  } catch (err) {
    console.error('Resend invitation failed:', err)
    const message = err instanceof Error ? err.message : 'Failed to resend invitation'
    return c.json({ error: message, code: 'EMAIL_SEND_FAILED', statusCode: 500 }, 500)
  }
})

// GET /weddings/:id/pending-invitations -- list pending invitations for a wedding
weddingsRoute.get('/:id/pending-invitations', async (c) => {
  const weddingId = c.req.param('id')
  const dbUserId = c.get('dbUserId')

  const membership = await weddingService.verifyMembership(weddingId, dbUserId)
  if (!membership) {
    return c.json(
      { error: 'Not a member of this wedding', code: 'FORBIDDEN', statusCode: 403 },
      403,
    )
  }

  const invitations = await invitationService.getPendingByWedding(weddingId)
  return c.json({ data: invitations })
})

// GET /weddings/:id/members -- list all members of a wedding
weddingsRoute.get('/:id/members', async (c) => {
  const weddingId = c.req.param('id')
  const dbUserId = c.get('dbUserId')

  const membership = await weddingService.verifyMembership(weddingId, dbUserId)
  if (!membership) {
    return c.json(
      { error: 'Not a member of this wedding', code: 'FORBIDDEN', statusCode: 403 },
      403,
    )
  }

  const members = await weddingService.getMembers(weddingId)
  return c.json({ data: members })
})

// POST /weddings/:id/members -- add a planner/family member by email
weddingsRoute.post(
  '/:id/members',
  zValidator('json', inviteMemberSchema, (result, c) => {
    if (!result.success) {
      return c.json({ error: 'Validation failed', code: 'VALIDATION_ERROR', statusCode: 400 }, 400)
    }
  }),
  async (c) => {
    const weddingId = c.req.param('id')
    const dbUserId = c.get('dbUserId')

    const membership = await weddingService.verifyMembership(weddingId, dbUserId)
    if (!membership) {
      return c.json(
        { error: 'Not a member of this wedding', code: 'FORBIDDEN', statusCode: 403 },
        403,
      )
    }

    if (membership.role !== 'owner' && membership.role !== 'partner') {
      return c.json(
        { error: 'Only the couple can add team members', code: 'FORBIDDEN', statusCode: 403 },
        403,
      )
    }

    const { email, role } = c.req.valid('json')
    const result = await weddingService.addMemberByEmail(weddingId, email, role, dbUserId)

    if ('error' in result) {
      return c.json({ error: result.error, code: 'ADD_MEMBER_FAILED', statusCode: 400 }, 400)
    }

    return c.json({ data: result }, 201)
  },
)

// DELETE /weddings/:id/members/:memberId -- remove a member
weddingsRoute.delete('/:id/members/:memberId', async (c) => {
  const weddingId = c.req.param('id')
  const memberId = c.req.param('memberId')
  const dbUserId = c.get('dbUserId')

  const membership = await weddingService.verifyMembership(weddingId, dbUserId)
  if (!membership) {
    return c.json(
      { error: 'Not a member of this wedding', code: 'FORBIDDEN', statusCode: 403 },
      403,
    )
  }

  if (membership.role !== 'owner' && membership.role !== 'partner') {
    return c.json(
      { error: 'Only the couple can remove team members', code: 'FORBIDDEN', statusCode: 403 },
      403,
    )
  }

  const result = await weddingService.removeMember(weddingId, memberId)

  if (!result) {
    return c.json({ error: 'Member not found', code: 'NOT_FOUND', statusCode: 404 }, 404)
  }

  if ('error' in result) {
    return c.json({ error: result.error, code: 'REMOVE_FAILED', statusCode: 400 }, 400)
  }

  return c.json({ data: { removed: true } })
})
