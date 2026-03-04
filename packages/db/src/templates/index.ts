import { defaultCategories } from './categories'
import { tasks12Month } from './tasks-12-month'
import { tasks6Month } from './tasks-6-month'
import { tasks18Month } from './tasks-18-month'
import { tasksElopement } from './tasks-elopement'
import type { TimelineTemplate } from '@planfortwo/types'

export interface TemplateTask {
  title: string
  description: string
  categoryIndex: number
  monthsBefore: number
  priority: 'must_do' | 'nice_to_have' | 'optional'
}

export interface TemplateCategory {
  name: string
  color: string
  icon: string
  sortOrder: number
}

export function getTemplateTasks(template: TimelineTemplate): TemplateTask[] {
  switch (template) {
    case '6-month': return tasks6Month
    case '12-month': return tasks12Month
    case '18-month': return tasks18Month
    case 'elopement': return tasksElopement
    default: {
      const _exhaustive: never = template
      throw new Error(`Unknown template: ${_exhaustive}`)
    }
  }
}

export { defaultCategories }
