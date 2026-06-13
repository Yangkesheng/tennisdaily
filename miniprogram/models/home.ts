import type { SessionStats, TennisSession } from './session'

export interface HomeExpenseSummary {
  sessionCost: number
  racketCost: number
  stringingCost: number
  totalCost: number
}

export interface HomeRatingTrendItem {
  id: string
  date: string
  rating: number
}

export interface HomeSummary {
  year: number
  month: number
  session: SessionStats
  expense: HomeExpenseSummary
  latestSession: TennisSession | null
  ratingTrend: HomeRatingTrendItem[]
}
