import { eq, sql, asc } from 'drizzle-orm'
import { db, budgetCategories, budgetItems, weddings } from '@planfortwo/db'
import { tipDefaults } from '@planfortwo/db'
import type {
  BudgetAnalytics,
  CategoryBreakdown,
  MonthlySpending,
  TipSuggestion,
  SplitCostSummary,
  CsvImportResult,
} from '@planfortwo/types'
import Papa from 'papaparse'
import PDFDocument from 'pdfkit'

function toNum(val: string | null | undefined): number {
  if (!val) return 0
  const n = parseFloat(val)
  return Number.isNaN(n) ? 0 : n
}

export const budgetAnalyticsService = {
  async getAnalytics(weddingId: string): Promise<BudgetAnalytics> {
    const [wedding] = await db
      .select({
        budgetTotal: weddings.budgetTotal,
        guestCountEstimate: weddings.guestCountEstimate,
      })
      .from(weddings)
      .where(eq(weddings.id, weddingId))

    const totalBudget = toNum(wedding?.budgetTotal)
    const guestEstimate = wedding?.guestCountEstimate ?? 0

    // Category allocations
    const categoryRows = await db
      .select()
      .from(budgetCategories)
      .where(eq(budgetCategories.weddingId, weddingId))
      .orderBy(asc(budgetCategories.sortOrder))

    const totalAllocated = categoryRows.reduce((acc, c) => acc + toNum(c.allocatedAmount), 0)

    // Item-level aggregates
    const [itemAgg] = await db
      .select({
        totalSpent: sql<string>`coalesce(sum(${budgetItems.amount}), '0')`,
        totalPaid: sql<string>`coalesce(sum(${budgetItems.paidAmount}), '0')`,
      })
      .from(budgetItems)
      .where(eq(budgetItems.weddingId, weddingId))

    const totalSpent = toNum(itemAgg?.totalSpent)
    const totalPaid = toNum(itemAgg?.totalPaid)
    const totalUnpaid = totalSpent - totalPaid

    const burnRate = totalBudget > 0 ? totalSpent / totalBudget : 0
    const perGuestCost = guestEstimate > 0 ? totalSpent / guestEstimate : 0

    // Category breakdown — spending per category
    const spendingByCategory = await db
      .select({
        categoryId: budgetItems.categoryId,
        spent: sql<string>`coalesce(sum(${budgetItems.amount}), '0')`,
      })
      .from(budgetItems)
      .where(eq(budgetItems.weddingId, weddingId))
      .groupBy(budgetItems.categoryId)

    const spendMap = new Map<string, number>()
    for (const row of spendingByCategory) {
      spendMap.set(row.categoryId, toNum(row.spent))
    }

    // Projected total: if categories with spending represent only a portion
    // of total allocation, scale up to estimate the full budget usage
    const allocatedWithSpending = categoryRows.reduce((acc, c) => {
      const hasSpending = (spendMap.get(c.id) ?? 0) > 0
      return hasSpending ? acc + toNum(c.allocatedAmount) : acc
    }, 0)

    const projectedTotal =
      allocatedWithSpending > 0 && totalSpent > 0
        ? totalSpent * (totalAllocated / allocatedWithSpending)
        : totalSpent

    const categoryBreakdown: CategoryBreakdown[] = categoryRows.map((c) => {
      const allocated = toNum(c.allocatedAmount)
      const spent = spendMap.get(c.id) ?? 0
      const remaining = allocated - spent
      const percentUsed = allocated > 0 ? (spent / allocated) * 100 : 0

      return {
        categoryId: c.id,
        name: c.name,
        color: c.color,
        allocated,
        spent,
        remaining,
        percentUsed: Math.round(percentUsed * 100) / 100,
      }
    })

    // Monthly spending
    const monthlyRows = await db
      .select({
        month: sql<string>`to_char(${budgetItems.createdAt}, 'YYYY-MM')`,
        amount: sql<string>`coalesce(sum(${budgetItems.amount}), '0')`,
      })
      .from(budgetItems)
      .where(eq(budgetItems.weddingId, weddingId))
      .groupBy(sql`to_char(${budgetItems.createdAt}, 'YYYY-MM')`)
      .orderBy(sql`to_char(${budgetItems.createdAt}, 'YYYY-MM')`)

    const monthlySpending: MonthlySpending[] = monthlyRows.map((r) => ({
      month: r.month,
      amount: toNum(r.amount),
    }))

    return {
      totalBudget,
      totalAllocated,
      totalSpent,
      totalPaid,
      totalUnpaid,
      burnRate: Math.round(burnRate * 10000) / 10000,
      perGuestCost: Math.round(perGuestCost * 100) / 100,
      projectedTotal: Math.round(projectedTotal * 100) / 100,
      categoryBreakdown,
      monthlySpending,
    }
  },

  async getTipSuggestions(weddingId: string): Promise<TipSuggestion[]> {
    const items = await db
      .select({
        amount: budgetItems.amount,
        categoryName: budgetCategories.name,
      })
      .from(budgetItems)
      .innerJoin(budgetCategories, eq(budgetItems.categoryId, budgetCategories.id))
      .where(eq(budgetItems.weddingId, weddingId))

    const suggestions: TipSuggestion[] = []

    for (const tip of tipDefaults) {
      const vendorLower = tip.vendorType.toLowerCase()

      // Find items whose category name contains the vendor type (fuzzy match)
      const matching = items.filter(
        (item) =>
          item.categoryName.toLowerCase().includes(vendorLower) ||
          vendorLower.includes(item.categoryName.toLowerCase()),
      )

      const itemTotal = matching.reduce((acc, m) => acc + toNum(m.amount), 0)

      let suggestedAmount: number
      let minAmount: number
      let maxAmount: number

      if (tip.tipType === 'percent') {
        suggestedAmount = itemTotal * (tip.suggested / 100)
        minAmount = itemTotal * (tip.min / 100)
        maxAmount = itemTotal * (tip.max / 100)
      } else {
        suggestedAmount = tip.suggested
        minAmount = tip.min
        maxAmount = tip.max
      }

      suggestions.push({
        vendorType: tip.vendorType,
        suggestedAmount: Math.round(suggestedAmount * 100) / 100,
        suggestedPercent: tip.suggested,
        min: Math.round(minAmount * 100) / 100,
        max: Math.round(maxAmount * 100) / 100,
      })
    }

    return suggestions
  },

  async getSplitSummary(weddingId: string): Promise<SplitCostSummary> {
    const rows = await db
      .select({
        payer: budgetItems.payer,
        total: sql<string>`coalesce(sum(${budgetItems.amount}), '0')`,
      })
      .from(budgetItems)
      .where(eq(budgetItems.weddingId, weddingId))
      .groupBy(budgetItems.payer)

    const payerMap = new Map<string, number>()
    let grandTotal = 0

    for (const row of rows) {
      const amount = toNum(row.total)
      payerMap.set(row.payer, amount)
      grandTotal += amount
    }

    function payerEntry(key: string) {
      const total = payerMap.get(key) ?? 0
      const percentage = grandTotal > 0 ? Math.round((total / grandTotal) * 10000) / 100 : 0
      return { total, percentage }
    }

    return {
      couple: payerEntry('couple'),
      brideFamily: payerEntry('bride_family'),
      groomFamily: payerEntry('groom_family'),
      other: payerEntry('other'),
    }
  },

  async exportCsv(weddingId: string): Promise<string> {
    const items = await db
      .select({
        categoryName: budgetCategories.name,
        vendorName: budgetItems.vendorName,
        description: budgetItems.description,
        amount: budgetItems.amount,
        paidAmount: budgetItems.paidAmount,
        paymentStatus: budgetItems.paymentStatus,
        payer: budgetItems.payer,
        dueDate: budgetItems.dueDate,
        notes: budgetItems.notes,
      })
      .from(budgetItems)
      .innerJoin(budgetCategories, eq(budgetItems.categoryId, budgetCategories.id))
      .where(eq(budgetItems.weddingId, weddingId))
      .orderBy(asc(budgetCategories.sortOrder), asc(budgetItems.sortOrder))

    const rows = items.map((item) => ({
      Category: item.categoryName,
      Vendor: item.vendorName ?? '',
      Description: item.description,
      Amount: toNum(item.amount).toFixed(2),
      Paid: toNum(item.paidAmount).toFixed(2),
      Status: item.paymentStatus,
      Payer: item.payer,
      'Due Date': item.dueDate ? item.dueDate.toISOString().split('T')[0] : '',
      Notes: item.notes ?? '',
    }))

    return Papa.unparse(rows)
  },

  async importCsv(weddingId: string, csvContent: string, userId: string): Promise<CsvImportResult> {
    const result: CsvImportResult = { imported: 0, skipped: 0, errors: [] }

    const parsed = Papa.parse<Record<string, string>>(csvContent, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h: string) => h.trim(),
    })

    // Surface critical parse errors
    for (const err of parsed.errors) {
      if (err.type === 'Delimiter' || err.type === 'Quotes') {
        result.errors.push(`Row ${err.row}: ${err.message}`)
      }
    }

    if (parsed.data.length === 0) {
      result.errors.push('CSV file is empty or has no data rows.')
      return result
    }

    // Load existing categories for this wedding to map Category name -> id
    const existingCategories = await db
      .select()
      .from(budgetCategories)
      .where(eq(budgetCategories.weddingId, weddingId))

    const categoryMap = new Map<string, string>()
    for (const cat of existingCategories) {
      categoryMap.set(cat.name.toLowerCase(), cat.id)
    }

    // Load existing budget items to skip duplicates (match on description + category + amount)
    const existingItems = await db
      .select({
        description: budgetItems.description,
        categoryId: budgetItems.categoryId,
        amount: budgetItems.amount,
      })
      .from(budgetItems)
      .where(eq(budgetItems.weddingId, weddingId))

    const existingSet = new Set(
      existingItems.map(
        (item) => `${item.categoryId}|${item.description}|${toNum(item.amount).toFixed(2)}`,
      ),
    )

    // Get current max sort order
    const [maxOrder] = await db
      .select({ max: sql<number>`coalesce(max(${budgetItems.sortOrder}), -1)` })
      .from(budgetItems)
      .where(eq(budgetItems.weddingId, weddingId))

    let nextSortOrder = (maxOrder?.max ?? -1) + 1

    // Track categories we create during import so we don't create duplicates
    let nextCategorySortOrder = existingCategories.length

    const validPaymentStatuses = ['unpaid', 'deposit', 'partial', 'paid'] as const
    const validPayers = ['couple', 'bride_family', 'groom_family', 'other'] as const

    for (let i = 0; i < parsed.data.length; i++) {
      const row = parsed.data[i]!

      const categoryName = (row['Category'] ?? '').trim()
      const description = (row['Description'] ?? '').trim()
      const amountStr = (row['Amount'] ?? '').trim()

      // Skip rows without required fields
      if (!description) {
        result.skipped++
        continue
      }

      const amount = parseFloat(amountStr)
      if (isNaN(amount)) {
        result.errors.push(`Row ${i + 1}: Invalid amount "${amountStr}"`)
        result.skipped++
        continue
      }

      // Resolve or create category
      let categoryId = categoryMap.get(categoryName.toLowerCase())
      if (!categoryId && categoryName) {
        // Create a new category for this import
        const [newCat] = await db
          .insert(budgetCategories)
          .values({
            weddingId,
            name: categoryName,
            icon: 'receipt',
            color: '#6b7280',
            allocatedAmount: '0',
            sortOrder: nextCategorySortOrder++,
            isDefault: false,
          })
          .returning()

        if (newCat) {
          categoryId = newCat.id
          categoryMap.set(categoryName.toLowerCase(), newCat.id)
        }
      }

      if (!categoryId) {
        result.errors.push(`Row ${i + 1}: No category specified and no default available`)
        result.skipped++
        continue
      }

      // Check for duplicate (idempotent import)
      const dedupeKey = `${categoryId}|${description}|${amount.toFixed(2)}`
      if (existingSet.has(dedupeKey)) {
        result.skipped++
        continue
      }

      // Parse optional fields
      const paidAmount = parseFloat((row['Paid'] ?? '0').trim()) || 0
      const statusRaw = (row['Status'] ?? 'unpaid').trim().toLowerCase()
      const paymentStatus = validPaymentStatuses.includes(
        statusRaw as (typeof validPaymentStatuses)[number],
      )
        ? (statusRaw as (typeof validPaymentStatuses)[number])
        : 'unpaid'
      const payerRaw = (row['Payer'] ?? 'couple').trim().toLowerCase()
      const payer = validPayers.includes(payerRaw as (typeof validPayers)[number])
        ? (payerRaw as (typeof validPayers)[number])
        : 'couple'
      const dueDateStr = (row['Due Date'] ?? '').trim()
      const dueDate = dueDateStr ? new Date(dueDateStr) : null
      const notes = (row['Notes'] ?? '').trim() || null
      const vendorName = (row['Vendor'] ?? '').trim() || null

      try {
        await db.insert(budgetItems).values({
          weddingId,
          categoryId,
          vendorName,
          description,
          amount: amount.toString(),
          paidAmount: paidAmount.toString(),
          paymentStatus,
          payer,
          dueDate: dueDate && !isNaN(dueDate.getTime()) ? dueDate : null,
          notes,
          sortOrder: nextSortOrder++,
        })

        existingSet.add(dedupeKey)
        result.imported++
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error'
        result.errors.push(`Row ${i + 1}: ${message}`)
        result.skipped++
      }
    }

    return result
  },

  async exportPdf(weddingId: string): Promise<Buffer> {
    const analytics = await this.getAnalytics(weddingId)

    const [wedding] = await db
      .select({ name: weddings.name })
      .from(weddings)
      .where(eq(weddings.id, weddingId))

    const weddingName = wedding?.name ?? 'Wedding'

    const items = await db
      .select({
        categoryName: budgetCategories.name,
        vendorName: budgetItems.vendorName,
        description: budgetItems.description,
        amount: budgetItems.amount,
        paidAmount: budgetItems.paidAmount,
        paymentStatus: budgetItems.paymentStatus,
      })
      .from(budgetItems)
      .innerJoin(budgetCategories, eq(budgetItems.categoryId, budgetCategories.id))
      .where(eq(budgetItems.weddingId, weddingId))
      .orderBy(asc(budgetCategories.sortOrder), asc(budgetItems.sortOrder))

    return new Promise<Buffer>((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50 })
      const chunks: Uint8Array[] = []

      doc.on('data', (chunk: Uint8Array) => chunks.push(chunk))
      doc.on('end', () => resolve(Buffer.concat(chunks)))
      doc.on('error', reject)

      // Title
      doc.fontSize(20).text(`${weddingName} - Budget Report`, { align: 'center' })
      doc.moveDown(0.5)
      doc
        .fontSize(10)
        .fillColor('#666666')
        .text(
          `Generated ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`,
          { align: 'center' },
        )
      doc.moveDown(1)

      // Summary
      doc.fontSize(14).fillColor('#000000').text('Budget Summary')
      doc.moveDown(0.3)
      doc.fontSize(10)
      doc.text(
        `Total Budget: $${analytics.totalBudget.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      )
      doc.text(
        `Total Allocated: $${analytics.totalAllocated.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      )
      doc.text(
        `Total Spent: $${analytics.totalSpent.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      )
      doc.text(
        `Total Paid: $${analytics.totalPaid.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      )
      doc.text(
        `Total Unpaid: $${analytics.totalUnpaid.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      )
      doc.text(
        `Per-Guest Cost: $${analytics.perGuestCost.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      )
      doc.moveDown(1)

      // Category breakdown
      doc.fontSize(14).text('Category Breakdown')
      doc.moveDown(0.3)
      doc.fontSize(9)

      const colX = [50, 180, 270, 360, 440]
      const headerY = doc.y
      doc.font('Helvetica-Bold')
      doc.text('Category', colX[0]!, headerY)
      doc.text('Allocated', colX[1]!, headerY)
      doc.text('Spent', colX[2]!, headerY)
      doc.text('Remaining', colX[3]!, headerY)
      doc.text('% Used', colX[4]!, headerY)
      doc.font('Helvetica')

      doc.moveDown(0.3)
      doc.moveTo(50, doc.y).lineTo(540, doc.y).strokeColor('#cccccc').stroke()
      doc.moveDown(0.2)

      for (const cat of analytics.categoryBreakdown) {
        const y = doc.y
        if (y > 700) {
          doc.addPage()
        }
        const rowY = doc.y
        doc.text(cat.name, colX[0]!, rowY, { width: 120 })
        doc.text(`$${cat.allocated.toFixed(2)}`, colX[1]!, rowY)
        doc.text(`$${cat.spent.toFixed(2)}`, colX[2]!, rowY)
        doc.text(`$${cat.remaining.toFixed(2)}`, colX[3]!, rowY)
        doc.text(`${cat.percentUsed.toFixed(1)}%`, colX[4]!, rowY)
        doc.moveDown(0.2)
      }

      doc.moveDown(1)

      // Expense list
      if (items.length > 0) {
        doc.fontSize(14).text('Expenses')
        doc.moveDown(0.3)
        doc.fontSize(9)

        const expColX = [50, 160, 290, 380, 450]
        const expHeaderY = doc.y
        doc.font('Helvetica-Bold')
        doc.text('Category', expColX[0]!, expHeaderY)
        doc.text('Vendor / Description', expColX[1]!, expHeaderY)
        doc.text('Amount', expColX[2]!, expHeaderY)
        doc.text('Paid', expColX[3]!, expHeaderY)
        doc.text('Status', expColX[4]!, expHeaderY)
        doc.font('Helvetica')

        doc.moveDown(0.3)
        doc.moveTo(50, doc.y).lineTo(540, doc.y).strokeColor('#cccccc').stroke()
        doc.moveDown(0.2)

        for (const item of items) {
          if (doc.y > 700) {
            doc.addPage()
          }
          const rowY = doc.y
          doc.text(item.categoryName, expColX[0]!, rowY, { width: 100 })
          doc.text(item.vendorName ?? item.description, expColX[1]!, rowY, { width: 120 })
          doc.text(`$${toNum(item.amount).toFixed(2)}`, expColX[2]!, rowY)
          doc.text(`$${toNum(item.paidAmount).toFixed(2)}`, expColX[3]!, rowY)
          doc.text(item.paymentStatus, expColX[4]!, rowY)
          doc.moveDown(0.2)
        }
      }

      doc.end()
    })
  },
}
