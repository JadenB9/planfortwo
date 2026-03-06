import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { eq } from 'drizzle-orm'
import { db, guests } from '@planfortwo/db'
import {
  rsvpLookupSchema,
  rsvpNameLookupSchema,
  rsvpSubmissionSchema,
  rsvpBatchSubmissionSchema,
  rsvpGuestIdLookupSchema,
} from '@planfortwo/validators'
import { authMiddleware } from '../middleware/auth.js'
import { resolveUserMiddleware } from '../middleware/resolve-user.js'
import { resolveWeddingMiddleware } from '../middleware/resolve-wedding.js'
import { rsvpService } from '../services/rsvp.js'

type Env = {
  Variables: {
    clerkUserId: string
    dbUserId: string
    dbUser: { id: string; email: string; firstName: string; lastName: string }
    weddingId: string
    membershipRole: string
  }
}

export const rsvpRoute = new Hono<Env>()

// ── Public Endpoints (no auth) ──

// GET /rsvp/lookup?token=X or ?code=X
rsvpRoute.get(
  '/lookup',
  zValidator('query', rsvpLookupSchema, (result, c) => {
    if (!result.success) {
      return c.json(
        { error: 'Token or code is required', code: 'VALIDATION_ERROR', statusCode: 400 },
        400,
      )
    }
  }),
  async (c) => {
    const { token, code } = c.req.valid('query')

    let result
    if (token) {
      result = await rsvpService.lookupByToken(token)
    } else if (code) {
      result = await rsvpService.lookupByCode(code)
    }

    if (!result) {
      return c.json({ error: 'Guest not found', code: 'GUEST_NOT_FOUND', statusCode: 404 }, 404)
    }

    return c.json({ data: result })
  },
)

// POST /rsvp/lookup-by-name
rsvpRoute.post(
  '/lookup-by-name',
  zValidator('json', rsvpNameLookupSchema, (result, c) => {
    if (!result.success) {
      return c.json({ error: 'Validation failed', code: 'VALIDATION_ERROR', statusCode: 400 }, 400)
    }
  }),
  async (c) => {
    const { weddingId, firstName, lastName } = c.req.valid('json')

    const result = await rsvpService.lookupByName(weddingId, firstName, lastName)

    if (result.type === 'none') {
      return c.json(
        { error: 'No guests found matching that name', code: 'GUEST_NOT_FOUND', statusCode: 404 },
        404,
      )
    }

    return c.json({ data: result })
  },
)

// POST /rsvp/lookup-by-guest-id
rsvpRoute.post(
  '/lookup-by-guest-id',
  zValidator('json', rsvpGuestIdLookupSchema, (result, c) => {
    if (!result.success) {
      return c.json({ error: 'Validation failed', code: 'VALIDATION_ERROR', statusCode: 400 }, 400)
    }
  }),
  async (c) => {
    const { guestId, weddingId } = c.req.valid('json')

    const expired = await rsvpService.isDeadlinePassed(weddingId)
    if (expired) {
      return c.json(
        { error: 'RSVP deadline has passed', code: 'RSVP_EXPIRED', statusCode: 410 },
        410,
      )
    }

    const result = await rsvpService.lookupByGuestId(guestId, weddingId)

    if (!result) {
      return c.json({ error: 'Guest not found', code: 'GUEST_NOT_FOUND', statusCode: 404 }, 404)
    }

    return c.json({ data: result })
  },
)

// POST /rsvp/submit — single guest RSVP
rsvpRoute.post(
  '/submit',
  zValidator('json', rsvpSubmissionSchema, (result, c) => {
    if (!result.success) {
      return c.json({ error: 'Validation failed', code: 'VALIDATION_ERROR', statusCode: 400 }, 400)
    }
  }),
  async (c) => {
    const submission = c.req.valid('json')

    // Verify the guest exists and the rsvpToken matches to prevent unauthorized modifications
    const [guest] = await db
      .select({ weddingId: guests.weddingId, rsvpToken: guests.rsvpToken })
      .from(guests)
      .where(eq(guests.id, submission.guestId))
      .limit(1)

    if (!guest) {
      return c.json({ error: 'Guest not found', code: 'GUEST_NOT_FOUND', statusCode: 404 }, 404)
    }

    // Require rsvpToken to prevent unauthenticated RSVP modifications
    const token = c.req.query('token')
    if (!token || token !== guest.rsvpToken) {
      return c.json(
        { error: 'Invalid or missing RSVP token', code: 'UNAUTHORIZED', statusCode: 403 },
        403,
      )
    }

    try {
      const updated = await rsvpService.submitRsvp(submission, guest.weddingId)
      return c.json({ data: updated })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Submit failed'
      if (message === 'RSVP deadline has passed') {
        return c.json({ error: message, code: 'RSVP_EXPIRED', statusCode: 410 }, 410)
      }
      return c.json({ error: message, code: 'SUBMIT_FAILED', statusCode: 400 }, 400)
    }
  },
)

// POST /rsvp/submit-batch — household batch RSVP
rsvpRoute.post(
  '/submit-batch',
  zValidator('json', rsvpBatchSubmissionSchema, (result, c) => {
    if (!result.success) {
      return c.json({ error: 'Validation failed', code: 'VALIDATION_ERROR', statusCode: 400 }, 400)
    }
  }),
  async (c) => {
    const { submissions } = c.req.valid('json')

    // Verify the first guest exists and the rsvpToken matches
    const [firstGuest] = await db
      .select({
        weddingId: guests.weddingId,
        rsvpToken: guests.rsvpToken,
        householdId: guests.householdId,
      })
      .from(guests)
      .where(eq(guests.id, submissions[0]!.guestId))
      .limit(1)

    if (!firstGuest) {
      return c.json({ error: 'Guest not found', code: 'GUEST_NOT_FOUND', statusCode: 404 }, 404)
    }

    // Require rsvpToken to prevent unauthenticated batch modifications
    const token = c.req.query('token')
    if (!token || token !== firstGuest.rsvpToken) {
      return c.json(
        { error: 'Invalid or missing RSVP token', code: 'UNAUTHORIZED', statusCode: 403 },
        403,
      )
    }

    try {
      const updated = await rsvpService.submitBatchRsvp(submissions, firstGuest.weddingId)
      return c.json({ data: updated })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Submit failed'
      if (message === 'RSVP deadline has passed') {
        return c.json({ error: message, code: 'RSVP_EXPIRED', statusCode: 410 }, 410)
      }
      return c.json({ error: message, code: 'SUBMIT_FAILED', statusCode: 400 }, 400)
    }
  },
)

// ── Auth-Required Endpoint ──

// GET /rsvp/dashboard?weddingId=X — guest stats for admin dashboard
rsvpRoute.get(
  '/dashboard',
  authMiddleware,
  resolveUserMiddleware,
  resolveWeddingMiddleware,
  async (c) => {
    const weddingId = c.get('weddingId')

    const allGuests = await db
      .select({
        isChild: guests.isChild,
        hasPlusOne: guests.hasPlusOne,
        plusOneConfirmed: guests.plusOneConfirmed,
        rsvpStatus: guests.rsvpStatus,
        dietary: guests.dietary,
        mealChoice: guests.mealChoice,
      })
      .from(guests)
      .where(eq(guests.weddingId, weddingId))

    const totalGuests = allGuests.length
    const adults = allGuests.filter((g) => !g.isChild).length
    const children = allGuests.filter((g) => g.isChild).length
    const plusOnes = allGuests.filter((g) => g.hasPlusOne).length
    const rsvpAccepted = allGuests.filter((g) => g.rsvpStatus === 'accepted').length
    const rsvpDeclined = allGuests.filter((g) => g.rsvpStatus === 'declined').length
    const rsvpPending = allGuests.filter((g) => g.rsvpStatus === 'pending').length
    const rsvpMaybe = allGuests.filter((g) => g.rsvpStatus === 'maybe').length
    const confirmedPlusOnes = allGuests.filter((g) => g.hasPlusOne && g.plusOneConfirmed).length

    const dietarySummary = {
      vegetarian: 0,
      vegan: 0,
      glutenFree: 0,
      kosher: 0,
      halal: 0,
      withAllergies: 0,
    }

    const mealChoiceSummary: Record<string, number> = {}

    for (const g of allGuests) {
      const d = g.dietary as Record<string, unknown> | null
      if (d) {
        if (d.vegetarian) dietarySummary.vegetarian++
        if (d.vegan) dietarySummary.vegan++
        if (d.glutenFree) dietarySummary.glutenFree++
        if (d.kosher) dietarySummary.kosher++
        if (d.halal) dietarySummary.halal++
        if (d.allergies && Array.isArray(d.allergies) && d.allergies.length > 0) {
          dietarySummary.withAllergies++
        }
      }

      if (g.mealChoice) {
        mealChoiceSummary[g.mealChoice] = (mealChoiceSummary[g.mealChoice] ?? 0) + 1
      }
    }

    return c.json({
      data: {
        totalGuests,
        adults,
        children,
        plusOnes,
        rsvpAccepted,
        rsvpDeclined,
        rsvpPending,
        rsvpMaybe,
        confirmedPlusOnes,
        dietarySummary,
        mealChoiceSummary,
      },
    })
  },
)
