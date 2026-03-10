import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Hono } from 'hono'

vi.mock('@clerk/backend', () => ({
  verifyToken: vi.fn().mockResolvedValue({ sub: 'clerk_user_123' }),
}))

vi.mock('../services/users.js', () => ({
  userService: {
    findByClerkId: vi.fn().mockResolvedValue({
      id: 'db-user-id',
      email: 'test@example.com',
      firstName: 'Jane',
      lastName: 'Doe',
    }),
    findById: vi.fn().mockResolvedValue({
      id: 'db-user-id',
      email: 'test@example.com',
      firstName: 'Jane',
      lastName: 'Doe',
    }),
  },
}))

vi.mock('../services/weddings.js', () => ({
  weddingService: {
    findByUserId: vi.fn(),
    completeOnboarding: vi.fn(),
    verifyMembership: vi.fn(),
    getMembers: vi.fn(),
  },
}))

vi.mock('../services/invitations.js', () => ({
  invitationService: {
    createAndSend: vi.fn(),
    accept: vi.fn(),
    cancel: vi.fn(),
    getPendingByWedding: vi.fn(),
  },
}))

vi.mock('../services/checklist.js', () => ({
  checklistService: {
    hasBeenSeeded: vi.fn().mockResolvedValue(true),
    seedChecklist: vi.fn().mockResolvedValue(undefined),
  },
}))

import { weddingsRoute } from './weddings.js'
import { weddingService } from '../services/weddings.js'
import { invitationService } from '../services/invitations.js'

const mockedWeddingService = vi.mocked(weddingService)
const mockedInvitationService = vi.mocked(invitationService)

function createApp() {
  const app = new Hono()
  app.route('/weddings', weddingsRoute)
  return app
}

function authHeaders(): Record<string, string> {
  return {
    Authorization: 'Bearer test-valid-token',
    'Content-Type': 'application/json',
  }
}

const mockWedding = {
  id: 'wedding-1',
  name: 'Our Wedding',
  date: new Date('2026-09-15').toISOString(),
  venue: null,
  city: null,
  state: null,
  country: 'US',
  guestCountEstimate: null,
  budgetTotal: null,
  style: null,
  timelineTemplate: '12-month' as const,
  websiteSlug: null,
  websitePublished: false,
  onboardingCompleted: false,
  tier: 'free' as const,
  stripeCustomerId: null,
  createdAt: new Date(),
  updatedAt: new Date(),
}

describe('Wedding Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv('CLERK_SECRET_KEY', 'sk_test_fake')
  })

  describe('GET /weddings/mine', () => {
    it('should return 404 when no wedding is found', async () => {
      mockedWeddingService.findByUserId.mockResolvedValue(null)

      const app = createApp()
      const res = await app.request('/weddings/mine', {
        method: 'GET',
        headers: authHeaders(),
      })

      expect(res.status).toBe(404)
      const body = await res.json()
      expect(body.code).toBe('WEDDING_NOT_FOUND')
    })

    it('should return wedding data with members and daysUntilWedding', async () => {
      mockedWeddingService.findByUserId.mockResolvedValue(mockWedding as never)
      mockedWeddingService.getMembers.mockResolvedValue([])

      const app = createApp()
      const res = await app.request('/weddings/mine', {
        method: 'GET',
        headers: authHeaders(),
      })

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.data.wedding.id).toBe('wedding-1')
      expect(body.data.members).toEqual([])
      expect(typeof body.data.daysUntilWedding).toBe('number')
    })
  })

  describe('POST /weddings/:id/onboarding', () => {
    it('should return 403 when user is not a member', async () => {
      mockedWeddingService.verifyMembership.mockResolvedValue(null)

      const app = createApp()
      const res = await app.request('/weddings/wedding-1/onboarding', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          partnerFirstName: 'John',
          partnerLastName: 'Smith',
          timelineTemplate: '12-month',
        }),
      })

      expect(res.status).toBe(403)
      const body = await res.json()
      expect(body.code).toBe('FORBIDDEN')
    })

    it('should return 400 for invalid body', async () => {
      const app = createApp()
      const res = await app.request('/weddings/wedding-1/onboarding', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ budgetTotal: 'not-a-number' }),
      })

      expect(res.status).toBe(400)
      const body = await res.json()
      expect(body.code).toBe('VALIDATION_ERROR')
    })

    it('should complete onboarding successfully', async () => {
      mockedWeddingService.verifyMembership.mockResolvedValue({
        id: 'member-1',
        weddingId: 'wedding-1',
        userId: 'db-user-id',
        role: 'owner',
        joinedAt: new Date(),
      } as never)
      mockedWeddingService.completeOnboarding.mockResolvedValue({
        ...mockWedding,
        onboardingCompleted: true,
      } as never)

      const app = createApp()
      const res = await app.request('/weddings/wedding-1/onboarding', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          partnerFirstName: 'John',
          partnerLastName: 'Smith',
          timelineTemplate: '12-month',
        }),
      })

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.data.onboardingCompleted).toBe(true)
    })
  })

  describe('POST /weddings/:id/invite-partner', () => {
    it('should return 403 when user is not a member', async () => {
      mockedWeddingService.verifyMembership.mockResolvedValue(null)

      const app = createApp()
      const res = await app.request('/weddings/wedding-1/invite-partner', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ email: 'partner@example.com' }),
      })

      expect(res.status).toBe(403)
      const body = await res.json()
      expect(body.code).toBe('FORBIDDEN')
    })

    it('should return 403 when user is not the owner', async () => {
      mockedWeddingService.verifyMembership.mockResolvedValue({
        id: 'member-1',
        weddingId: 'wedding-1',
        userId: 'db-user-id',
        role: 'partner',
        joinedAt: new Date(),
      } as never)

      const app = createApp()
      const res = await app.request('/weddings/wedding-1/invite-partner', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ email: 'partner@example.com' }),
      })

      expect(res.status).toBe(403)
      const body = await res.json()
      expect(body.code).toBe('FORBIDDEN')
    })

    it('should create and send invitation when user is owner', async () => {
      mockedWeddingService.verifyMembership.mockResolvedValue({
        id: 'member-1',
        weddingId: 'wedding-1',
        userId: 'db-user-id',
        role: 'owner',
        joinedAt: new Date(),
      } as never)
      mockedInvitationService.createAndSend.mockResolvedValue({
        id: 'invite-1',
        weddingId: 'wedding-1',
        invitedByUserId: 'db-user-id',
        email: 'partner@example.com',
        token: 'token-abc',
        status: 'pending',
        createdAt: new Date(),
        expiresAt: new Date(),
      } as never)

      const app = createApp()
      const res = await app.request('/weddings/wedding-1/invite-partner', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ email: 'partner@example.com' }),
      })

      expect(res.status).toBe(201)
      const body = await res.json()
      expect(body.data.email).toBe('partner@example.com')
    })

    it('should return 400 for invalid email', async () => {
      const app = createApp()
      const res = await app.request('/weddings/wedding-1/invite-partner', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ email: 'not-an-email' }),
      })

      expect(res.status).toBe(400)
      const body = await res.json()
      expect(body.code).toBe('VALIDATION_ERROR')
    })
  })

  describe('POST /weddings/accept-invite/:token', () => {
    it('should accept a valid invitation', async () => {
      mockedInvitationService.accept.mockResolvedValue('wedding-1')
      mockedWeddingService.findByUserId.mockResolvedValue(mockWedding as never)

      const app = createApp()
      const res = await app.request('/weddings/accept-invite/token-abc', {
        method: 'POST',
        headers: authHeaders(),
      })

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.data.id).toBe('wedding-1')
    })

    it('should return 404 for invalid token', async () => {
      mockedInvitationService.accept.mockRejectedValue(new Error('Invitation not found'))

      const app = createApp()
      const res = await app.request('/weddings/accept-invite/bad-token', {
        method: 'POST',
        headers: authHeaders(),
      })

      expect(res.status).toBe(404)
      const body = await res.json()
      expect(body.code).toBe('INVITATION_NOT_FOUND')
    })

    it('should return 410 for expired invitation', async () => {
      mockedInvitationService.accept.mockRejectedValue(new Error('Invitation has expired'))

      const app = createApp()
      const res = await app.request('/weddings/accept-invite/expired-token', {
        method: 'POST',
        headers: authHeaders(),
      })

      expect(res.status).toBe(410)
      const body = await res.json()
      expect(body.code).toBe('INVITATION_EXPIRED')
    })

    it('should return 409 for already accepted invitation', async () => {
      mockedInvitationService.accept.mockRejectedValue(
        new Error('Invitation has already been accepted'),
      )

      const app = createApp()
      const res = await app.request('/weddings/accept-invite/used-token', {
        method: 'POST',
        headers: authHeaders(),
      })

      expect(res.status).toBe(409)
      const body = await res.json()
      expect(body.code).toBe('INVITATION_USED')
    })
  })

  describe('DELETE /weddings/:id/invitations/:invitationId', () => {
    it('should return 403 when user is not a member', async () => {
      mockedWeddingService.verifyMembership.mockResolvedValue(null)

      const app = createApp()
      const res = await app.request('/weddings/wedding-1/invitations/invite-1', {
        method: 'DELETE',
        headers: authHeaders(),
      })

      expect(res.status).toBe(403)
      const body = await res.json()
      expect(body.code).toBe('FORBIDDEN')
    })

    it('should return 403 when user is not the owner', async () => {
      mockedWeddingService.verifyMembership.mockResolvedValue({
        id: 'member-1',
        weddingId: 'wedding-1',
        userId: 'db-user-id',
        role: 'partner',
        joinedAt: new Date(),
      } as never)

      const app = createApp()
      const res = await app.request('/weddings/wedding-1/invitations/invite-1', {
        method: 'DELETE',
        headers: authHeaders(),
      })

      expect(res.status).toBe(403)
      const body = await res.json()
      expect(body.code).toBe('FORBIDDEN')
    })

    it('should cancel a pending invitation when user is owner', async () => {
      mockedWeddingService.verifyMembership.mockResolvedValue({
        id: 'member-1',
        weddingId: 'wedding-1',
        userId: 'db-user-id',
        role: 'owner',
        joinedAt: new Date(),
      } as never)
      mockedInvitationService.cancel.mockResolvedValue({
        id: 'invite-1',
        weddingId: 'wedding-1',
        status: 'cancelled',
      } as never)

      const app = createApp()
      const res = await app.request('/weddings/wedding-1/invitations/invite-1', {
        method: 'DELETE',
        headers: authHeaders(),
      })

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.data.cancelled).toBe(true)
      expect(mockedInvitationService.cancel).toHaveBeenCalledWith('invite-1', 'wedding-1')
    })

    it('should return 404 when invitation not found or already processed', async () => {
      mockedWeddingService.verifyMembership.mockResolvedValue({
        id: 'member-1',
        weddingId: 'wedding-1',
        userId: 'db-user-id',
        role: 'owner',
        joinedAt: new Date(),
      } as never)
      mockedInvitationService.cancel.mockResolvedValue(null)

      const app = createApp()
      const res = await app.request('/weddings/wedding-1/invitations/invite-1', {
        method: 'DELETE',
        headers: authHeaders(),
      })

      expect(res.status).toBe(404)
      const body = await res.json()
      expect(body.code).toBe('NOT_FOUND')
    })
  })
})
