export type TennisSessionType = '' | 'training' | 'singles' | 'doubles' | 'singlesMatch' | 'doublesMatch'
export type SessionCategory = number
export type SessionSubCategory = number
export type MatchRank = number

export interface SessionCategoryOption {
  label: string
  value: SessionCategory
}

export interface SessionSubCategoryOption {
  label: string
  value: SessionSubCategory
  category?: SessionCategory
  typeText?: string
  legacyType?: number
}

export interface MatchRankOption {
  label: string
  value: MatchRank
}

export const SESSION_CATEGORY = {
  daily: 1,
  training: 2,
  match: 3,
} as const

export const SESSION_SUB_CATEGORY = {
  singles: 1,
  doubles: 2,
  serve: 3,
  other: 4,
} as const

export const SESSION_CATEGORY_OPTIONS: SessionCategoryOption[] = [
  { label: '日常球局', value: SESSION_CATEGORY.daily },
  { label: '训练', value: SESSION_CATEGORY.training },
  { label: '比赛', value: SESSION_CATEGORY.match },
]

export const SESSION_SUB_CATEGORY_OPTIONS: Record<SessionCategory, SessionSubCategoryOption[]> = {
  [SESSION_CATEGORY.daily]: [
    { label: '单打', value: SESSION_SUB_CATEGORY.singles },
    { label: '双打', value: SESSION_SUB_CATEGORY.doubles },
  ],
  [SESSION_CATEGORY.training]: [
    { label: '发球', value: SESSION_SUB_CATEGORY.serve },
    { label: '其他', value: SESSION_SUB_CATEGORY.other },
  ],
  [SESSION_CATEGORY.match]: [
    { label: '单打', value: SESSION_SUB_CATEGORY.singles },
    { label: '双打', value: SESSION_SUB_CATEGORY.doubles },
  ],
}

export const getDefaultSubCategory = (
  category: SessionCategory,
  categoryOptions: SessionCategoryOption[] = SESSION_CATEGORY_OPTIONS,
  subCategoryOptions: Record<number, SessionSubCategoryOption[]> = SESSION_SUB_CATEGORY_OPTIONS,
): SessionSubCategory => {
  const options = subCategoryOptions[category] || []

  return options[0]?.value || subCategoryOptions[categoryOptions[0]?.value]?.[0]?.value || SESSION_SUB_CATEGORY.doubles
}

export const isMatchCategory = (category: SessionCategory) => {
  return category === SESSION_CATEGORY.match
}

export const getSessionTypeFromCategory = (category: SessionCategory, subCategory: SessionSubCategory): TennisSessionType => {
  if (category === SESSION_CATEGORY.daily) {
    return subCategory === SESSION_SUB_CATEGORY.doubles ? 'doubles' : 'singles'
  }

  if (category === SESSION_CATEGORY.training) {
    return 'training'
  }

  return subCategory === SESSION_SUB_CATEGORY.doubles ? 'doublesMatch' : 'singlesMatch'
}

export const getCategoryFromSessionType = (type: TennisSessionType): { category: SessionCategory; subCategory: SessionSubCategory } => {
  switch (type) {
    case 'singles':
      return { category: SESSION_CATEGORY.daily, subCategory: SESSION_SUB_CATEGORY.singles }
    case 'training':
      return { category: SESSION_CATEGORY.training, subCategory: SESSION_SUB_CATEGORY.other }
    case 'singlesMatch':
      return { category: SESSION_CATEGORY.match, subCategory: SESSION_SUB_CATEGORY.singles }
    case 'doublesMatch':
      return { category: SESSION_CATEGORY.match, subCategory: SESSION_SUB_CATEGORY.doubles }
    case 'doubles':
    default:
      return { category: SESSION_CATEGORY.daily, subCategory: SESSION_SUB_CATEGORY.doubles }
  }
}

export interface TennisSession {
  id: string
  date: string
  durationMinutes: number
  rating: number
  courtName: string
  partner: string
  type: TennisSessionType
  typeText: string
  category: SessionCategory
  categoryText: string
  subCategory: SessionSubCategory
  subCategoryText: string
  matchRank: MatchRank
  matchRankLabel: string
  cost: number
  racketId: number
  racketName: string
  shoeId: number
  shoeName: string
  note: string
  createdAt: number
  updatedAt: number
}

export interface SessionDraft {
  date: string
  durationMinutes: number
  rating: number
  courtName: string
  partner: string
  type: TennisSessionType
  category: SessionCategory
  subCategory: SessionSubCategory
  matchRank: MatchRank
  cost: number
  racketId: number
  racketName: string
  shoeId: number
  shoeName: string
  note: string
}

export interface SessionPageResult {
  list: TennisSession[]
  total: number
  page: number
  pageSize: number
  totalPages: number
  hasMore: boolean
}

export interface SessionPageParams {
  page: number
  pageSize: number
  date?: string
  matchRank?: number
}

export interface SessionStats {
  monthCount: number
  monthMinutes: number
  monthCost: number
  yearCount: number
  totalCount: number
}

export interface SessionCalendarDay {
  date: string
  count: number
}

export interface SessionCalendarSummary {
  sessionCount: number
  activeDayCount: number
  totalMinutes: number
  averageMinutes: number
  averageRating: number
  sessionCost: number
  racketCost: number
  stringingCost: number
  totalCost: number
  trainingCount: number
  singlesCount: number
  doublesCount: number
  matchCount: number
}

export interface SessionCalendarChartItem {
  key?: string
  label: string
  value: number
  percent?: number
}

export interface SessionCalendarRatingTrendItem {
  label: string
  date: string
  rating: number
}

export interface SessionCalendarCharts {
  frequency: SessionCalendarChartItem[]
  ratingTrend: SessionCalendarRatingTrendItem[]
  expenseBreakdown: SessionCalendarChartItem[]
  sessionTypeBreakdown: SessionCalendarChartItem[]
}

export interface SessionCalendar {
  year: number
  month: number
  activeDayCount: number
  days: SessionCalendarDay[]
  summary: SessionCalendarSummary
  charts: SessionCalendarCharts
}

export interface SessionConfig {
  categories: SessionCategoryOption[]
  subCategoryOptions: Record<number, SessionSubCategoryOption[]>
  matchRanks: MatchRankOption[]
}

export interface SessionTypeOption {
  label: string
  value: TennisSessionType
}
