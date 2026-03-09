import { eq, and, asc, inArray } from 'drizzle-orm'
import {
  db,
  seatingCharts,
  seatingTables,
  venueElements,
  tableAssignments,
  guestRelationships,
} from '@planfortwo/db'
import type {
  CreateSeatingChartInput,
  UpdateSeatingChartInput,
  CreateSeatingTableInput,
  UpdateSeatingTableInput,
  CreateVenueElementInput,
  AssignGuestInput,
  CreateGuestRelationshipInput,
} from '@planfortwo/validators'
import { activityService } from './activity.js'

export const seatingChartService = {
  async listCharts(weddingId: string) {
    return db
      .select()
      .from(seatingCharts)
      .where(eq(seatingCharts.weddingId, weddingId))
      .orderBy(asc(seatingCharts.createdAt))
  },

  async getChart(chartId: string, weddingId: string) {
    const [chart] = await db
      .select()
      .from(seatingCharts)
      .where(and(eq(seatingCharts.id, chartId), eq(seatingCharts.weddingId, weddingId)))

    if (!chart) return null

    const tables = await db.select().from(seatingTables).where(eq(seatingTables.chartId, chartId))

    const elements = await db.select().from(venueElements).where(eq(venueElements.chartId, chartId))

    const tableIds = tables.map((t) => t.id)
    const allAssignments =
      tableIds.length > 0
        ? await db
            .select()
            .from(tableAssignments)
            .where(inArray(tableAssignments.tableId, tableIds))
        : []

    return { ...chart, tables, elements, assignments: allAssignments }
  },

  async createChart(data: CreateSeatingChartInput, userId: string) {
    const [chart] = await db
      .insert(seatingCharts)
      .values({
        weddingId: data.weddingId,
        name: data.name,
        eventName: data.eventName,
      })
      .returning()

    if (chart) {
      await activityService.log({
        weddingId: data.weddingId,
        userId,
        action: 'seating_chart_created',
        entityType: 'seating_chart',
        entityId: chart.id,
        metadata: { type: 'seating_chart', name: data.name },
      })
    }

    return chart!
  },

  async updateChart(chartId: string, weddingId: string, data: UpdateSeatingChartInput) {
    const updateData: Record<string, unknown> = {}
    if (data.name !== undefined) updateData.name = data.name
    if (data.eventName !== undefined) updateData.eventName = data.eventName
    if (data.canvasData !== undefined) updateData.canvasData = data.canvasData
    if (data.width !== undefined) updateData.width = data.width
    if (data.height !== undefined) updateData.height = data.height

    const [updated] = await db
      .update(seatingCharts)
      .set(updateData)
      .where(and(eq(seatingCharts.id, chartId), eq(seatingCharts.weddingId, weddingId)))
      .returning()

    return updated ?? null
  },

  async deleteChart(chartId: string, weddingId: string) {
    const [deleted] = await db
      .delete(seatingCharts)
      .where(and(eq(seatingCharts.id, chartId), eq(seatingCharts.weddingId, weddingId)))
      .returning()
    return !!deleted
  },

  async addTable(data: CreateSeatingTableInput) {
    const [table] = await db
      .insert(seatingTables)
      .values({
        chartId: data.chartId,
        label: data.label,
        tableType: data.tableType,
        capacity: data.capacity,
        posX: data.posX,
        posY: data.posY,
      })
      .returning()
    return table!
  },

  async updateTable(tableId: string, data: UpdateSeatingTableInput, weddingId?: string) {
    if (weddingId) {
      const [table] = await db
        .select({ chartId: seatingTables.chartId })
        .from(seatingTables)
        .where(eq(seatingTables.id, tableId))
      if (!table) return null
      const [chart] = await db
        .select({ id: seatingCharts.id })
        .from(seatingCharts)
        .where(and(eq(seatingCharts.id, table.chartId), eq(seatingCharts.weddingId, weddingId)))
      if (!chart) return null
    }
    const updateData: Record<string, unknown> = {}
    if (data.label !== undefined) updateData.label = data.label
    if (data.tableType !== undefined) updateData.tableType = data.tableType
    if (data.capacity !== undefined) updateData.capacity = data.capacity
    if (data.posX !== undefined) updateData.posX = data.posX
    if (data.posY !== undefined) updateData.posY = data.posY
    if (data.rotation !== undefined) updateData.rotation = data.rotation
    if (data.width !== undefined) updateData.width = data.width
    if (data.height !== undefined) updateData.height = data.height

    const [updated] = await db
      .update(seatingTables)
      .set(updateData)
      .where(eq(seatingTables.id, tableId))
      .returning()
    return updated ?? null
  },

  async deleteTable(tableId: string, weddingId?: string) {
    if (weddingId) {
      const [table] = await db
        .select({ chartId: seatingTables.chartId })
        .from(seatingTables)
        .where(eq(seatingTables.id, tableId))
      if (!table) return
      const [chart] = await db
        .select({ id: seatingCharts.id })
        .from(seatingCharts)
        .where(and(eq(seatingCharts.id, table.chartId), eq(seatingCharts.weddingId, weddingId)))
      if (!chart) return
    }
    await db.delete(seatingTables).where(eq(seatingTables.id, tableId))
  },

  async addElement(data: CreateVenueElementInput) {
    const [element] = await db
      .insert(venueElements)
      .values({
        chartId: data.chartId,
        elementType: data.elementType,
        label: data.label,
        posX: data.posX,
        posY: data.posY,
        width: data.width,
        height: data.height,
      })
      .returning()
    return element!
  },

  async deleteElement(elementId: string, weddingId?: string) {
    if (weddingId) {
      const [el] = await db
        .select({ chartId: venueElements.chartId })
        .from(venueElements)
        .where(eq(venueElements.id, elementId))
      if (!el) return
      const [chart] = await db
        .select({ id: seatingCharts.id })
        .from(seatingCharts)
        .where(and(eq(seatingCharts.id, el.chartId), eq(seatingCharts.weddingId, weddingId)))
      if (!chart) return
    }
    await db.delete(venueElements).where(eq(venueElements.id, elementId))
  },

  async assignGuest(data: AssignGuestInput, weddingId: string) {
    // Verify the table belongs to a chart owned by this wedding
    const [table] = await db
      .select({ chartId: seatingTables.chartId })
      .from(seatingTables)
      .where(eq(seatingTables.id, data.tableId))
    if (!table) {
      throw new Error('Table not found')
    }
    const [chart] = await db
      .select({ id: seatingCharts.id })
      .from(seatingCharts)
      .where(and(eq(seatingCharts.id, table.chartId), eq(seatingCharts.weddingId, weddingId)))
    if (!chart) {
      throw new Error('Table not found')
    }

    if (data.guestId) {
      const existing = await db
        .select()
        .from(tableAssignments)
        .where(eq(tableAssignments.guestId, data.guestId))

      if (existing.length > 0) {
        await db.delete(tableAssignments).where(eq(tableAssignments.guestId, data.guestId))
      }
    }

    const [assignment] = await db
      .insert(tableAssignments)
      .values({
        tableId: data.tableId,
        guestId: data.guestId ?? null,
        guestName: data.guestName ?? null,
        seatNumber: data.seatNumber,
      })
      .returning()
    return assignment!
  },

  async unassignSeat(assignmentId: string, weddingId?: string) {
    if (weddingId) {
      const [assignment] = await db
        .select({ tableId: tableAssignments.tableId })
        .from(tableAssignments)
        .where(eq(tableAssignments.id, assignmentId))
      if (!assignment) return
      const [table] = await db
        .select({ chartId: seatingTables.chartId })
        .from(seatingTables)
        .where(eq(seatingTables.id, assignment.tableId))
      if (!table) return
      const [chart] = await db
        .select({ id: seatingCharts.id })
        .from(seatingCharts)
        .where(and(eq(seatingCharts.id, table.chartId), eq(seatingCharts.weddingId, weddingId)))
      if (!chart) return
    }
    await db.delete(tableAssignments).where(eq(tableAssignments.id, assignmentId))
  },

  async unassignGuest(guestId: string) {
    await db.delete(tableAssignments).where(eq(tableAssignments.guestId, guestId))
  },

  async getAssignments(chartId: string) {
    const tables = await db.select().from(seatingTables).where(eq(seatingTables.chartId, chartId))

    const tableIds = tables.map((t) => t.id)
    const allAssigns =
      tableIds.length > 0
        ? await db
            .select()
            .from(tableAssignments)
            .where(inArray(tableAssignments.tableId, tableIds))
        : []

    return allAssigns.map((a) => ({
      tableId: a.tableId,
      guestId: a.guestId,
      guestName: a.guestName,
      seatNumber: a.seatNumber,
    }))
  },

  async listRelationships(weddingId: string) {
    return db.select().from(guestRelationships).where(eq(guestRelationships.weddingId, weddingId))
  },

  async createRelationship(data: CreateGuestRelationshipInput) {
    const [rel] = await db
      .insert(guestRelationships)
      .values({
        weddingId: data.weddingId,
        guestAId: data.guestAId,
        guestBId: data.guestBId,
        relationshipType: data.relationshipType,
        notes: data.notes,
      })
      .returning()
    return rel!
  },

  async deleteRelationship(relationshipId: string, weddingId?: string) {
    if (weddingId) {
      const [rel] = await db
        .select({ weddingId: guestRelationships.weddingId })
        .from(guestRelationships)
        .where(eq(guestRelationships.id, relationshipId))
      if (!rel || rel.weddingId !== weddingId) return
    }
    await db.delete(guestRelationships).where(eq(guestRelationships.id, relationshipId))
  },

  async checkConflicts(chartId: string, weddingId: string) {
    const relationships = await db
      .select()
      .from(guestRelationships)
      .where(eq(guestRelationships.weddingId, weddingId))

    const tables = await db.select().from(seatingTables).where(eq(seatingTables.chartId, chartId))

    const tableIds = tables.map((t) => t.id)
    const allAssigns =
      tableIds.length > 0
        ? await db
            .select()
            .from(tableAssignments)
            .where(inArray(tableAssignments.tableId, tableIds))
        : []

    // Build guest-to-table map and per-table count map
    const guestTableMap = new Map<string, string>()
    const tableCountMap = new Map<string, number>()
    for (const a of allAssigns) {
      if (a.guestId) guestTableMap.set(a.guestId, a.tableId)
      tableCountMap.set(a.tableId, (tableCountMap.get(a.tableId) ?? 0) + 1)
    }

    const conflicts: {
      guestAId: string
      guestBId: string
      type: string
      issue: string
    }[] = []

    for (const rel of relationships) {
      const tableA = guestTableMap.get(rel.guestAId)
      const tableB = guestTableMap.get(rel.guestBId)

      if (rel.relationshipType === 'keep_apart' && tableA && tableB && tableA === tableB) {
        conflicts.push({
          guestAId: rel.guestAId,
          guestBId: rel.guestBId,
          type: 'keep_apart',
          issue: 'Guests who should be kept apart are at the same table',
        })
      }

      if (rel.relationshipType === 'must_together' && tableA && tableB && tableA !== tableB) {
        conflicts.push({
          guestAId: rel.guestAId,
          guestBId: rel.guestBId,
          type: 'must_together',
          issue: 'Guests who must sit together are at different tables',
        })
      }
    }

    const capacityWarnings: {
      tableId: string
      label: string
      capacity: number
      assigned: number
    }[] = []
    for (const table of tables) {
      const assignedCount = tableCountMap.get(table.id) ?? 0
      if (assignedCount > table.capacity) {
        capacityWarnings.push({
          tableId: table.id,
          label: table.label,
          capacity: table.capacity,
          assigned: assignedCount,
        })
      }
    }

    return { conflicts, capacityWarnings }
  },

  async cloneChart(chartId: string, weddingId: string, newName: string) {
    const chart = await this.getChart(chartId, weddingId)
    if (!chart) return null

    const [newChart] = await db
      .insert(seatingCharts)
      .values({
        weddingId,
        name: newName,
        eventName: chart.eventName,
        canvasData: chart.canvasData,
        width: chart.width,
        height: chart.height,
      })
      .returning()

    for (const table of chart.tables) {
      const [newTable] = await db
        .insert(seatingTables)
        .values({
          chartId: newChart!.id,
          label: table.label,
          tableType: table.tableType,
          capacity: table.capacity,
          posX: table.posX,
          posY: table.posY,
          rotation: table.rotation,
          width: table.width,
          height: table.height,
        })
        .returning()

      const assigns = chart.assignments.filter((a) => a.tableId === table.id)
      for (const assign of assigns) {
        await db.insert(tableAssignments).values({
          tableId: newTable!.id,
          guestId: assign.guestId ?? null,
          guestName: assign.guestName ?? null,
          seatNumber: assign.seatNumber,
        })
      }
    }

    for (const el of chart.elements) {
      await db.insert(venueElements).values({
        chartId: newChart!.id,
        elementType: el.elementType,
        label: el.label,
        posX: el.posX,
        posY: el.posY,
        width: el.width,
        height: el.height,
        rotation: el.rotation,
      })
    }

    return newChart!
  },
}
