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
    verifyMembership: vi.fn().mockResolvedValue({
      id: 'member-1',
      weddingId: 'a0000000-0000-0000-0000-000000000001',
      userId: 'db-user-id',
      role: 'owner',
      joinedAt: new Date(),
    }),
    findByUserId: vi.fn(),
  },
}))

vi.mock('../services/seating-charts.js', () => ({
  seatingChartService: {
    listCharts: vi.fn(),
    getChart: vi.fn(),
    createChart: vi.fn(),
    updateChart: vi.fn(),
    deleteChart: vi.fn(),
    addTable: vi.fn(),
    updateTable: vi.fn(),
    deleteTable: vi.fn(),
    addElement: vi.fn(),
    deleteElement: vi.fn(),
    assignGuest: vi.fn(),
    unassignGuest: vi.fn(),
    getAssignments: vi.fn(),
    listRelationships: vi.fn(),
    createRelationship: vi.fn(),
    deleteRelationship: vi.fn(),
    checkConflicts: vi.fn(),
    cloneChart: vi.fn(),
  },
}))

vi.mock('../services/features.js', () => ({
  featureService: {
    getFeatures: vi.fn().mockResolvedValue({
      tier: 'full',
      canAddTasks: true,
      canEditChecklist: true,
      canDeleteTasks: true,
      canReorderTasks: true,
      canCustomizeCategories: true,
      canAddNotes: true,
      canAddAttachments: true,
      maxGuests: null,
      canEditGuests: true,
      canDeleteGuests: true,
      canBulkImport: true,
      canRsvp: true,
      canSeatingChart: true,
      canVendorManagement: true,
      canCustomDomain: true,
      canDataExport: true,
      canBudgetCategories: true,
      canBudgetExpenses: true,
      canBudgetAnalytics: true,
      canBudgetExport: true,
      canPaymentSchedule: true,
      canWebsiteBuilder: true,
      canWebsiteAnalytics: true,
      canWebsiteCustomSections: true,
    }),
  },
}))

import { seatingChartsRoute } from './seating-charts.js'
import { seatingChartService } from '../services/seating-charts.js'
import { featureService } from '../services/features.js'
import { userService } from '../services/users.js'
import { weddingService } from '../services/weddings.js'

const mockedService = vi.mocked(seatingChartService)
const mockedFeatureService = vi.mocked(featureService)

const WEDDING_ID = 'a0000000-0000-0000-0000-000000000001'
const CHART_ID = 'c0000000-0000-0000-0000-000000000001'
const TABLE_ID = 'd0000000-0000-0000-0000-000000000001'

const FULL_GATES = {
  tier: 'full' as const,
  canAddTasks: true,
  canEditChecklist: true,
  canDeleteTasks: true,
  canReorderTasks: true,
  canCustomizeCategories: true,
  canAddNotes: true,
  canAddAttachments: true,
  maxGuests: null,
  canEditGuests: true,
  canDeleteGuests: true,
  canBulkImport: true,
  canRsvp: true,
  canSeatingChart: true,
  canVendorManagement: true,
  canCustomDomain: true,
  canDataExport: true,
  canBudgetCategories: true,
  canBudgetExpenses: true,
  canBudgetAnalytics: true,
  canBudgetExport: true,
  canPaymentSchedule: true,
  canWebsiteBuilder: true,
  canWebsiteAnalytics: true,
  canWebsiteCustomSections: true,
}

const FREE_GATES = {
  tier: 'free' as const,
  canAddTasks: false,
  canEditChecklist: false,
  canDeleteTasks: false,
  canReorderTasks: false,
  canCustomizeCategories: false,
  canAddNotes: false,
  canAddAttachments: false,
  maxGuests: 15,
  canEditGuests: false,
  canDeleteGuests: false,
  canBulkImport: false,
  canRsvp: false,
  canSeatingChart: false,
  canVendorManagement: false,
  canCustomDomain: false,
  canDataExport: false,
  canBudgetCategories: false,
  canBudgetExpenses: false,
  canBudgetAnalytics: false,
  canBudgetExport: false,
  canPaymentSchedule: false,
  canWebsiteBuilder: false,
  canWebsiteAnalytics: false,
  canWebsiteCustomSections: false,
}

function createApp() {
  const app = new Hono()
  app.route('/seating-charts', seatingChartsRoute)
  return app
}

function authHeaders(): Record<string, string> {
  return { Authorization: 'Bearer test-valid-token', 'Content-Type': 'application/json' }
}

describe('Seating Chart Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv('CLERK_SECRET_KEY', 'sk_test_fake')
    vi.mocked(userService.findByClerkId).mockResolvedValue({
      id: 'db-user-id',
      email: 'test@example.com',
      firstName: 'Jane',
      lastName: 'Doe',
    })
    vi.mocked(weddingService.verifyMembership).mockResolvedValue({
      id: 'member-1',
      weddingId: WEDDING_ID,
      userId: 'db-user-id',
      role: 'owner',
      joinedAt: new Date(),
    })
    mockedService.getChart.mockResolvedValue({
      id: CHART_ID,
      weddingId: WEDDING_ID,
      name: 'Reception',
      eventName: null,
      canvasData: null,
      floorPlanUrl: null,
      width: 1200,
      height: 800,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as never)
    mockedFeatureService.getFeatures.mockResolvedValue(FULL_GATES)
  })

  describe('GET /seating-charts', () => {
    it('should list charts for a wedding', async () => {
      const mockCharts = [
        {
          id: CHART_ID,
          weddingId: WEDDING_ID,
          name: 'Reception',
          eventName: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]
      mockedService.listCharts.mockResolvedValue(mockCharts as never)

      const app = createApp()
      const res = await app.request(`/seating-charts?weddingId=${WEDDING_ID}`, {
        method: 'GET',
        headers: authHeaders(),
      })
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.data).toHaveLength(1)
      expect(body.data[0].name).toBe('Reception')
    })
  })

  describe('POST /seating-charts', () => {
    it('should create a seating chart', async () => {
      mockedService.createChart.mockResolvedValue({
        id: CHART_ID,
        weddingId: WEDDING_ID,
        name: 'Reception',
        eventName: null,
        canvasData: null,
        width: 1200,
        height: 800,
        floorPlanUrl: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as never)

      const app = createApp()
      const res = await app.request(`/seating-charts?weddingId=${WEDDING_ID}`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ weddingId: WEDDING_ID, name: 'Reception' }),
      })
      expect(res.status).toBe(201)
      const body = await res.json()
      expect(body.data.name).toBe('Reception')
    })

    it('should return 403 on free tier', async () => {
      mockedFeatureService.getFeatures.mockResolvedValue(FREE_GATES)
      const app = createApp()
      const res = await app.request(`/seating-charts?weddingId=${WEDDING_ID}`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ weddingId: WEDDING_ID, name: 'Test' }),
      })
      expect(res.status).toBe(403)
    })
  })

  describe('POST /seating-charts/:id/tables', () => {
    it('should add a table', async () => {
      mockedService.addTable.mockResolvedValue({
        id: TABLE_ID,
        chartId: CHART_ID,
        label: 'Table 1',
        tableType: 'round',
        capacity: 8,
        posX: 100,
        posY: 100,
        rotation: 0,
        width: 100,
        height: 100,
        createdAt: new Date(),
      } as never)

      const app = createApp()
      const res = await app.request(`/seating-charts/${CHART_ID}/tables?weddingId=${WEDDING_ID}`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ chartId: CHART_ID, label: 'Table 1' }),
      })
      expect(res.status).toBe(201)
      const body = await res.json()
      expect(body.data.label).toBe('Table 1')
    })
  })

  describe('POST /seating-charts/assignments', () => {
    it('should assign a guest to a table', async () => {
      const guestId = 'e0000000-0000-0000-0000-000000000001'
      mockedService.assignGuest.mockResolvedValue({
        id: 'f0000000-0000-0000-0000-000000000001',
        tableId: TABLE_ID,
        guestId,
        seatNumber: 1,
        createdAt: new Date(),
      } as never)

      const app = createApp()
      const res = await app.request(`/seating-charts/assignments?weddingId=${WEDDING_ID}`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ tableId: TABLE_ID, guestId, seatNumber: 1 }),
      })
      expect(res.status).toBe(201)
      const body = await res.json()
      expect(body.data.guestId).toBe(guestId)
    })
  })

  describe('GET /seating-charts/:id/conflicts', () => {
    it('should return conflicts and capacity warnings', async () => {
      mockedService.checkConflicts.mockResolvedValue({
        conflicts: [],
        capacityWarnings: [],
      } as never)

      const app = createApp()
      const res = await app.request(
        `/seating-charts/${CHART_ID}/conflicts?weddingId=${WEDDING_ID}`,
        {
          method: 'GET',
          headers: authHeaders(),
        },
      )
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.data.conflicts).toEqual([])
      expect(body.data.capacityWarnings).toEqual([])
    })
  })

  describe('POST /seating-charts/:id/clone', () => {
    it('should clone a chart', async () => {
      mockedService.cloneChart.mockResolvedValue({
        id: 'b0000000-0000-0000-0000-000000000002',
        weddingId: WEDDING_ID,
        name: 'Reception Copy',
        eventName: null,
        canvasData: null,
        floorPlanUrl: null,
        width: 1200,
        height: 800,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as never)

      const app = createApp()
      const res = await app.request(`/seating-charts/${CHART_ID}/clone?weddingId=${WEDDING_ID}`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ name: 'Reception Copy' }),
      })
      expect(res.status).toBe(201)
      const body = await res.json()
      expect(body.data.name).toBe('Reception Copy')
    })
  })

  describe('POST /seating-charts/relationships', () => {
    it('should create a guest relationship', async () => {
      const guestA = 'e0000000-0000-0000-0000-000000000001'
      const guestB = 'e0000000-0000-0000-0000-000000000002'
      mockedService.createRelationship.mockResolvedValue({
        id: 'f0000000-0000-0000-0000-000000000002',
        weddingId: WEDDING_ID,
        guestAId: guestA,
        guestBId: guestB,
        relationshipType: 'keep_apart',
        notes: null,
        createdAt: new Date(),
      } as never)

      const app = createApp()
      const res = await app.request(`/seating-charts/relationships?weddingId=${WEDDING_ID}`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          weddingId: WEDDING_ID,
          guestAId: guestA,
          guestBId: guestB,
          relationshipType: 'keep_apart',
        }),
      })
      expect(res.status).toBe(201)
      const body = await res.json()
      expect(body.data.relationshipType).toBe('keep_apart')
    })
  })
})
