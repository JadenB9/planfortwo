export interface DefaultBudgetCategory {
  name: string
  icon: string
  color: string
  allocationPercent: number
}

export const defaultBudgetCategories: DefaultBudgetCategory[] = [
  { name: 'Venue', icon: 'building', color: '#8B5CF6', allocationPercent: 40 },
  { name: 'Catering & Bar', icon: 'utensils', color: '#F97316', allocationPercent: 25 },
  { name: 'Photography', icon: 'camera', color: '#3B82F6', allocationPercent: 10 },
  { name: 'Videography', icon: 'video', color: '#6366F1', allocationPercent: 5 },
  { name: 'Flowers & Decor', icon: 'flower', color: '#EC4899', allocationPercent: 8 },
  { name: 'Music / DJ', icon: 'music', color: '#10B981', allocationPercent: 3 },
  { name: 'Attire', icon: 'shirt', color: '#F59E0B', allocationPercent: 5 },
  { name: 'Hair & Makeup', icon: 'sparkles', color: '#D946EF', allocationPercent: 2 },
  { name: 'Cake & Desserts', icon: 'cake', color: '#FB923C', allocationPercent: 2 },
  { name: 'Stationery', icon: 'mail', color: '#14B8A6', allocationPercent: 2 },
  { name: 'Transportation', icon: 'car', color: '#64748B', allocationPercent: 2 },
  { name: 'Favors', icon: 'gift', color: '#A855F7', allocationPercent: 1 },
  { name: 'Officiant', icon: 'heart', color: '#EF4444', allocationPercent: 1 },
  { name: 'Rentals', icon: 'tent', color: '#0EA5E9', allocationPercent: 5 },
  { name: 'Photo Booth', icon: 'image', color: '#F472B6', allocationPercent: 1 },
  { name: 'Planner / Coordinator', icon: 'clipboard', color: '#8B5CF6', allocationPercent: 10 },
  { name: 'Gifts', icon: 'package', color: '#34D399', allocationPercent: 2 },
  { name: 'Rings', icon: 'diamond', color: '#FBBF24', allocationPercent: 3 },
  { name: 'License & Legal', icon: 'file-text', color: '#94A3B8', allocationPercent: 0.5 },
  { name: 'Rehearsal Dinner', icon: 'wine', color: '#BE185D', allocationPercent: 5 },
  { name: 'Honeymoon', icon: 'plane', color: '#0891B2', allocationPercent: 0 },
  { name: 'Tips', icon: 'hand-coins', color: '#059669', allocationPercent: 5 },
  { name: 'Emergency Fund', icon: 'shield', color: '#DC2626', allocationPercent: 5 },
]
