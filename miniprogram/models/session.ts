export type TennisSessionType = '' | 'training' | 'singles' | 'doubles' | 'singlesMatch' | 'doublesMatch'
export type MatchRank = '' | 'champion' | 'runnerUp' | 'semiFinal' | 'quarterFinal' | 'groupStage'

export interface TennisSession {
  id: string
  date: string
  durationMinutes: number
  rating: number
  courtName: string
  partner: string
  type: TennisSessionType
  matchRank: MatchRank
  cost: number
  racketId: number
  racketName: string
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
  matchRank: MatchRank
  cost: number
  racketId: number
  racketName: string
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

export interface SessionTypeOption {
  label: string
  value: TennisSessionType
}
