import { eq, and, desc, asc, sql, isNull, isNotNull, count } from 'drizzle-orm'
import {
  db,
  checklistCategories,
  checklistTasks,
  taskNotes,
  taskAttachments,
  users,
  defaultCategories,
  getTemplateTasks,
  budgetItems,
  weddings,
} from '@planfortwo/db'
import type {
  TimelineTemplate,
  DashboardStats,
  TasksByCategory,
} from '@planfortwo/types'
import type {
  CreateTaskInput,
  UpdateTaskInput,
  TaskFiltersInput,
  CreateCategoryInput,
  UpdateCategoryInput,
} from '@planfortwo/validators'
import { activityService } from './activity.js'

function calculateDueDate(
  weddingDate: Date | null,
  monthsBefore: number,
): Date | null {
  if (!weddingDate) return null
  const due = new Date(weddingDate)
  due.setMonth(due.getMonth() - monthsBefore)
  return due
}

export const checklistService = {
  async hasBeenSeeded(weddingId: string): Promise<boolean> {
    const [result] = await db
      .select({ cnt: count() })
      .from(checklistCategories)
      .where(eq(checklistCategories.weddingId, weddingId))

    return (result?.cnt ?? 0) > 0
  },

  async seedChecklist(
    weddingId: string,
    template: TimelineTemplate,
    weddingDate: Date | null,
    userId: string,
  ): Promise<void> {
    await db.transaction(async (tx) => {
      // Insert default categories and collect mapping of sortOrder index -> id
      const categoryIdBySortOrder = new Map<number, string>()

      for (const cat of defaultCategories) {
        const [inserted] = await tx
          .insert(checklistCategories)
          .values({
            weddingId,
            name: cat.name,
            color: cat.color,
            icon: cat.icon,
            sortOrder: cat.sortOrder,
            isDefault: true,
          })
          .returning({ id: checklistCategories.id, sortOrder: checklistCategories.sortOrder })

        if (inserted) {
          categoryIdBySortOrder.set(inserted.sortOrder, inserted.id)
        }
      }

      // Insert template tasks (categoryIndex maps to defaultCategories sortOrder)
      const templateTasks = getTemplateTasks(template)
      let sortOrder = 0

      for (const task of templateTasks) {
        const categoryId = categoryIdBySortOrder.get(task.categoryIndex)
        if (!categoryId) continue

        await tx.insert(checklistTasks).values({
          weddingId,
          categoryId,
          title: task.title,
          description: task.description,
          priority: task.priority,
          dueDate: calculateDueDate(weddingDate, task.monthsBefore),
          sortOrder,
          isCustom: false,
        })

        sortOrder++
      }

    })

    // Log outside transaction for simplicity
    await activityService.log({
      weddingId,
      userId,
      action: 'checklist_seeded',
      entityType: 'category',
      entityId: weddingId,
      metadata: { template },
    }).catch(() => {
      // activity logging is non-critical during seeding
    })
  },

  async listCategories(weddingId: string) {
    const results = await db
      .select({
        category: checklistCategories,
        taskCount: sql<number>`cast(count(${checklistTasks.id}) as int)`,
        completedCount: sql<number>`cast(count(${checklistTasks.completedAt}) as int)`,
      })
      .from(checklistCategories)
      .leftJoin(
        checklistTasks,
        eq(checklistCategories.id, checklistTasks.categoryId),
      )
      .where(eq(checklistCategories.weddingId, weddingId))
      .groupBy(checklistCategories.id)
      .orderBy(asc(checklistCategories.sortOrder))

    return results.map((r) => ({
      ...r.category,
      taskCount: r.taskCount,
      completedCount: r.completedCount,
    }))
  },

  async createCategory(data: CreateCategoryInput, userId: string) {
    const [category] = await db
      .insert(checklistCategories)
      .values({
        weddingId: data.weddingId,
        name: data.name,
        color: data.color,
        icon: data.icon,
        isDefault: false,
      })
      .returning()

    if (category) {
      await activityService.log({
        weddingId: data.weddingId,
        userId,
        action: 'category_created',
        entityType: 'category',
        entityId: category.id,
        metadata: { name: data.name },
      })
    }

    return category!
  },

  async updateCategory(categoryId: string, data: UpdateCategoryInput) {
    const [updated] = await db
      .update(checklistCategories)
      .set(data)
      .where(eq(checklistCategories.id, categoryId))
      .returning()

    return updated ?? null
  },

  async deleteCategory(categoryId: string, userId: string, weddingId: string) {
    // Check if default
    const [cat] = await db
      .select({ isDefault: checklistCategories.isDefault, name: checklistCategories.name })
      .from(checklistCategories)
      .where(eq(checklistCategories.id, categoryId))

    if (!cat) {
      throw new Error('Category not found')
    }

    if (cat.isDefault) {
      throw new Error('Cannot delete a default category')
    }

    await db
      .delete(checklistCategories)
      .where(eq(checklistCategories.id, categoryId))

    await activityService.log({
      weddingId,
      userId,
      action: 'category_deleted',
      entityType: 'category',
      entityId: categoryId,
      metadata: { name: cat.name },
    })
  },

  async listTasks(filters: TaskFiltersInput) {
    const conditions = [eq(checklistTasks.weddingId, filters.weddingId)]

    if (filters.categoryId) {
      conditions.push(eq(checklistTasks.categoryId, filters.categoryId))
    }

    if (filters.priority) {
      conditions.push(eq(checklistTasks.priority, filters.priority))
    }

    if (filters.status === 'completed') {
      conditions.push(isNotNull(checklistTasks.completedAt))
    } else if (filters.status === 'incomplete') {
      conditions.push(isNull(checklistTasks.completedAt))
    }

    if (filters.assignedToUserId) {
      conditions.push(eq(checklistTasks.assignedToUserId, filters.assignedToUserId))
    }

    const sortMap = {
      dueDate: asc(checklistTasks.dueDate),
      priority: asc(checklistTasks.priority),
      sortOrder: asc(checklistTasks.sortOrder),
      createdAt: desc(checklistTasks.createdAt),
    } as const

    const orderBy = sortMap[filters.sortBy ?? 'sortOrder']

    const results = await db
      .select()
      .from(checklistTasks)
      .where(and(...conditions))
      .orderBy(orderBy)

    return results
  },

  async getTaskWithDetails(taskId: string) {
    // Get the task
    const [task] = await db
      .select()
      .from(checklistTasks)
      .where(eq(checklistTasks.id, taskId))

    if (!task) return null

    // Get category
    const [category] = await db
      .select()
      .from(checklistCategories)
      .where(eq(checklistCategories.id, task.categoryId))

    // Get notes with user info
    const notes = await db
      .select({
        note: taskNotes,
        user: {
          firstName: users.firstName,
          lastName: users.lastName,
        },
      })
      .from(taskNotes)
      .innerJoin(users, eq(taskNotes.userId, users.id))
      .where(eq(taskNotes.taskId, taskId))
      .orderBy(desc(taskNotes.createdAt))

    // Get attachments
    const attachments = await db
      .select()
      .from(taskAttachments)
      .where(eq(taskAttachments.taskId, taskId))
      .orderBy(desc(taskAttachments.createdAt))

    // Get assigned user
    let assignedUser = null
    if (task.assignedToUserId) {
      const [u] = await db
        .select({
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          avatarUrl: users.avatarUrl,
        })
        .from(users)
        .where(eq(users.id, task.assignedToUserId))

      assignedUser = u ?? null
    }

    return {
      ...task,
      category: category!,
      notes: notes.map((n) => n.note),
      attachments,
      assignedUser,
    }
  },

  async createTask(data: CreateTaskInput, userId: string) {
    const [task] = await db
      .insert(checklistTasks)
      .values({
        weddingId: data.weddingId,
        categoryId: data.categoryId,
        title: data.title,
        description: data.description ?? null,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        priority: data.priority,
        assignedToUserId: data.assignedToUserId ?? null,
        isCustom: true,
      })
      .returning()

    if (task) {
      await activityService.log({
        weddingId: data.weddingId,
        userId,
        action: 'task_created',
        entityType: 'task',
        entityId: task.id,
        metadata: { title: data.title },
      })
    }

    return task!
  },

  async updateTask(
    taskId: string,
    data: UpdateTaskInput,
    userId: string,
    weddingId: string,
  ) {
    const updateData: Record<string, unknown> = {}

    if (data.title !== undefined) updateData.title = data.title
    if (data.description !== undefined) updateData.description = data.description
    if (data.dueDate !== undefined) {
      updateData.dueDate = data.dueDate ? new Date(data.dueDate) : null
    }
    if (data.priority !== undefined) updateData.priority = data.priority
    if (data.categoryId !== undefined) updateData.categoryId = data.categoryId
    if (data.assignedToUserId !== undefined) {
      updateData.assignedToUserId = data.assignedToUserId
    }

    const [updated] = await db
      .update(checklistTasks)
      .set(updateData)
      .where(eq(checklistTasks.id, taskId))
      .returning()

    if (updated) {
      await activityService.log({
        weddingId,
        userId,
        action: 'task_updated',
        entityType: 'task',
        entityId: taskId,
        metadata: { changes: Object.keys(updateData) },
      })
    }

    return updated ?? null
  },

  async toggleComplete(taskId: string, userId: string, weddingId: string) {
    const [task] = await db
      .select({
        completedAt: checklistTasks.completedAt,
        title: checklistTasks.title,
      })
      .from(checklistTasks)
      .where(eq(checklistTasks.id, taskId))

    if (!task) return null

    const isCompleting = !task.completedAt

    const [updated] = await db
      .update(checklistTasks)
      .set({
        completedAt: isCompleting ? new Date() : null,
        completedByUserId: isCompleting ? userId : null,
      })
      .where(eq(checklistTasks.id, taskId))
      .returning()

    if (updated) {
      await activityService.log({
        weddingId,
        userId,
        action: isCompleting ? 'task_completed' : 'task_uncompleted',
        entityType: 'task',
        entityId: taskId,
        metadata: { title: task.title },
      })
    }

    return updated ?? null
  },

  async deleteTask(taskId: string, userId: string, weddingId: string) {
    const [task] = await db
      .select({ title: checklistTasks.title })
      .from(checklistTasks)
      .where(eq(checklistTasks.id, taskId))

    if (!task) {
      throw new Error('Task not found')
    }

    await db.delete(checklistTasks).where(eq(checklistTasks.id, taskId))

    await activityService.log({
      weddingId,
      userId,
      action: 'task_deleted',
      entityType: 'task',
      entityId: taskId,
      metadata: { title: task.title },
    })
  },

  async reorderTask(taskId: string, sortOrder: number) {
    const [updated] = await db
      .update(checklistTasks)
      .set({ sortOrder })
      .where(eq(checklistTasks.id, taskId))
      .returning()

    return updated ?? null
  },

  async bulkReorder(tasks: Array<{ id: string; sortOrder: number }>) {
    await db.transaction(async (tx) => {
      for (const task of tasks) {
        await tx
          .update(checklistTasks)
          .set({ sortOrder: task.sortOrder })
          .where(eq(checklistTasks.id, task.id))
      }
    })
  },

  async addNote(
    taskId: string,
    userId: string,
    content: string,
    weddingId: string,
  ) {
    const [note] = await db
      .insert(taskNotes)
      .values({ taskId, userId, content })
      .returning()

    if (note) {
      await activityService.log({
        weddingId,
        userId,
        action: 'note_added',
        entityType: 'note',
        entityId: note.id,
        metadata: { taskId },
      })
    }

    return note!
  },

  async getStats(weddingId: string): Promise<DashboardStats> {
    // Total + completed counts
    const [taskCounts] = await db
      .select({
        total: sql<number>`cast(count(*) as int)`,
        completed: sql<number>`cast(count(${checklistTasks.completedAt}) as int)`,
      })
      .from(checklistTasks)
      .where(eq(checklistTasks.weddingId, weddingId))

    // Upcoming tasks (incomplete, sorted by due date, limit 5)
    const upcomingTasks = await db
      .select()
      .from(checklistTasks)
      .where(
        and(
          eq(checklistTasks.weddingId, weddingId),
          isNull(checklistTasks.completedAt),
          isNotNull(checklistTasks.dueDate),
        ),
      )
      .orderBy(asc(checklistTasks.dueDate))
      .limit(5)

    // Recent activity
    const recentActivity = await activityService.getRecent(weddingId, 10)

    // Tasks by category breakdown
    const categoryBreakdown = await db
      .select({
        categoryId: checklistCategories.id,
        categoryName: checklistCategories.name,
        color: checklistCategories.color,
        total: sql<number>`cast(count(${checklistTasks.id}) as int)`,
        completed: sql<number>`cast(count(${checklistTasks.completedAt}) as int)`,
      })
      .from(checklistCategories)
      .leftJoin(
        checklistTasks,
        eq(checklistCategories.id, checklistTasks.categoryId),
      )
      .where(eq(checklistCategories.weddingId, weddingId))
      .groupBy(
        checklistCategories.id,
        checklistCategories.name,
        checklistCategories.color,
      )

    const tasksByCategory: TasksByCategory[] = categoryBreakdown.map((row) => ({
      categoryId: row.categoryId,
      categoryName: row.categoryName,
      color: row.color,
      total: row.total,
      completed: row.completed,
    }))

    const [budgetTotals] = await db
      .select({
        spent: sql<string>`coalesce(sum(${budgetItems.amount}), '0')`,
      })
      .from(budgetItems)
      .where(eq(budgetItems.weddingId, weddingId))

    const [weddingBudget] = await db
      .select({ budgetTotal: weddings.budgetTotal })
      .from(weddings)
      .where(eq(weddings.id, weddingId))

    return {
      tasksCompleted: taskCounts?.completed ?? 0,
      tasksTotal: taskCounts?.total ?? 0,
      upcomingTasks,
      recentActivity,
      tasksByCategory,
      budgetSpent: Number(budgetTotals?.spent ?? 0),
      budgetTotal: Number(weddingBudget?.budgetTotal ?? 0),
    }
  },
}
