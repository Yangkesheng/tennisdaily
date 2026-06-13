import type { HomeRatingTrendItem, HomeSummary } from '../models/home'
import type { SessionStats } from '../models/session'
import { ensureLogin } from './auth-service'
import { mapApiSessionToLocal, type ApiSession } from './session-api-mapper'
import { request } from './request'

interface ApiHomeExpenseSummary {
  sessionCost?: number | null
  racketCost?: number | null
  stringingCost?: number | null
  totalCost?: number | null
}

interface ApiHomeRatingTrendItem {
  id: number | string
  date: string
  rating: number
}

interface ApiHomeSummary {
  year?: number | null
  month?: number | null
  session?: Partial<SessionStats> | null
  expense?: ApiHomeExpenseSummary | null
  latestSession?: ApiSession | null
  ratingTrend?: ApiHomeRatingTrendItem[] | null
}

const normalizeNumber = (value: number | null | undefined) => {
  return typeof value === 'number' && !Number.isNaN(value) ? value : 0
}

const normalizeRatingTrend = (items: ApiHomeRatingTrendItem[] | null | undefined): HomeRatingTrendItem[] => {
  if (!Array.isArray(items)) {
    return []
  }

  return items.map((item) => ({
    id: `${item.id}`,
    date: item.date,
    rating: normalizeNumber(item.rating) || 3,
  }))
}

const normalizeHomeSummary = (summary: ApiHomeSummary | null): HomeSummary => {
  const now = new Date()
  const session = summary?.session
  const expense = summary?.expense

  return {
    year: summary?.year || now.getFullYear(),
    month: summary?.month || now.getMonth() + 1,
    session: {
      monthCount: normalizeNumber(session?.monthCount),
      monthMinutes: normalizeNumber(session?.monthMinutes),
      monthCost: normalizeNumber(session?.monthCost),
      yearCount: normalizeNumber(session?.yearCount),
      totalCount: normalizeNumber(session?.totalCount),
    },
    expense: {
      sessionCost: normalizeNumber(expense?.sessionCost),
      racketCost: normalizeNumber(expense?.racketCost),
      stringingCost: normalizeNumber(expense?.stringingCost),
      totalCost: normalizeNumber(expense?.totalCost),
    },
    latestSession: summary?.latestSession ? mapApiSessionToLocal(summary.latestSession) : null,
    ratingTrend: normalizeRatingTrend(summary?.ratingTrend),
  }
}

export const getHomeSummaryRemote = async (): Promise<HomeSummary> => {
  await ensureLogin()
  const summary = await request<ApiHomeSummary | null>({
    url: '/api/home/summary',
  })

  return normalizeHomeSummary(summary)
}
