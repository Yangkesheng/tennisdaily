import type {
  StatsBreakdownItem,
  StatsCharts,
  StatsChartsResult,
  StatsChartsSummary,
  StatsFrequencyChartItem,
  StatsPeriod,
  StatsRatingTrendItem,
} from '../models/stats'
import { ensureLogin } from './auth-service'
import { request } from './request'

interface ApiStatsChartsResult {
  period?: StatsPeriod | null
  year?: number | null
  month?: number | null
  rangeText?: string | null
  summary?: Partial<StatsChartsSummary> | null
  charts?: Partial<StatsCharts> | null
}

const defaultExpenseBreakdown: StatsBreakdownItem[] = [
  { key: 'session', label: '打球', value: 0, percent: 0 },
  { key: 'racket', label: '球拍', value: 0, percent: 0 },
  { key: 'stringing', label: '穿线', value: 0, percent: 0 },
]

const emptyBreakdown: StatsBreakdownItem[] = []

const normalizeNumber = (value: number | null | undefined) => {
  return typeof value === 'number' && !Number.isNaN(value) ? value : 0
}

const normalizeOptionalNumber = (value: number | null | undefined) => {
  return typeof value === 'number' && !Number.isNaN(value) ? value : undefined
}

const normalizeFrequency = (items: StatsFrequencyChartItem[] | null | undefined): StatsFrequencyChartItem[] => {
  if (!Array.isArray(items)) {
    return []
  }

  return items.map((item) => ({
    label: item.label || '',
    value: normalizeNumber(item.value),
  }))
}

const normalizeRatingTrend = (items: StatsRatingTrendItem[] | null | undefined): StatsRatingTrendItem[] => {
  if (!Array.isArray(items)) {
    return []
  }

  return items.map((item) => ({
    label: item.label || '',
    date: item.date || '',
    rating: normalizeNumber(item.rating),
  }))
}

const normalizeBreakdown = (items: StatsBreakdownItem[] | null | undefined, defaults: StatsBreakdownItem[] = emptyBreakdown): StatsBreakdownItem[] => {
  if (!Array.isArray(items)) {
    return defaults
  }

  return items.map((item, index) => {
    const category = normalizeOptionalNumber(item.category)
    const subCategory = normalizeOptionalNumber(item.subCategory)

    return {
      key: item.key || item.label || `${index}`,
      label: item.label || '',
      value: normalizeNumber(item.value),
      percent: normalizeNumber(item.percent),
      ...(category !== undefined ? { category } : {}),
      ...(subCategory !== undefined ? { subCategory } : {}),
    }
  })
}

const normalizeStatsCharts = (raw: ApiStatsChartsResult | null, period: StatsPeriod, year: number, month?: number): StatsChartsResult => {
  const summary = raw?.summary || {}
  const charts = raw?.charts || {}

  return {
    period: raw?.period || period,
    year: raw?.year || year,
    month: raw?.month || month || 0,
    rangeText: raw?.rangeText || (period === 'year' ? `${year}年` : `${year}年${month || 1}月`),
    summary: {
      sessionCount: normalizeNumber(summary.sessionCount),
      activeDayCount: normalizeNumber(summary.activeDayCount),
      totalMinutes: normalizeNumber(summary.totalMinutes),
      averageMinutes: normalizeNumber(summary.averageMinutes),
      averageRating: normalizeNumber(summary.averageRating),
      sessionCost: normalizeNumber(summary.sessionCost),
      racketCost: normalizeNumber(summary.racketCost),
      stringingCost: normalizeNumber(summary.stringingCost),
      totalCost: normalizeNumber(summary.totalCost),
      trainingCount: normalizeNumber(summary.trainingCount),
      singlesCount: normalizeNumber(summary.singlesCount),
      doublesCount: normalizeNumber(summary.doublesCount),
      matchCount: normalizeNumber(summary.matchCount),
    },
    charts: {
      frequency: normalizeFrequency(charts.frequency),
      ratingTrend: normalizeRatingTrend(charts.ratingTrend),
      expenseBreakdown: normalizeBreakdown(charts.expenseBreakdown, defaultExpenseBreakdown),
      sessionCategoryCountBreakdown: normalizeBreakdown(charts.sessionCategoryCountBreakdown),
      sessionSubCategoryCountBreakdown: normalizeBreakdown(charts.sessionSubCategoryCountBreakdown),
      sessionCategoryDurationBreakdown: normalizeBreakdown(charts.sessionCategoryDurationBreakdown),
      sessionSubCategoryDurationBreakdown: normalizeBreakdown(charts.sessionSubCategoryDurationBreakdown),
      sessionCategoryCostBreakdown: normalizeBreakdown(charts.sessionCategoryCostBreakdown),
      sessionSubCategoryCostBreakdown: normalizeBreakdown(charts.sessionSubCategoryCostBreakdown),
    },
  }
}

export const getStatsChartsFromApi = async (period: StatsPeriod, year: number, month?: number): Promise<StatsChartsResult> => {
  await ensureLogin()
  const query = period === 'year' ? `period=year&year=${year}` : `period=month&year=${year}&month=${month || 1}`
  const result = await request<ApiStatsChartsResult | null>({
    url: `/api/stats/charts?${query}`,
  })

  return normalizeStatsCharts(result, period, year, month)
}
