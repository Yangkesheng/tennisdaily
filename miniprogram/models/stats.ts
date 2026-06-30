export type StatsPeriod = 'month' | 'year'

export interface StatsChartsSummary {
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

export interface StatsFrequencyChartItem {
  label: string
  value: number
}

export interface StatsRatingTrendItem {
  label: string
  date: string
  rating: number
}

export interface StatsBreakdownItem {
  key: string
  label: string
  value: number
  percent: number
}

export interface StatsCharts {
  frequency: StatsFrequencyChartItem[]
  ratingTrend: StatsRatingTrendItem[]
  expenseBreakdown: StatsBreakdownItem[]
  sessionTypeBreakdown: StatsBreakdownItem[]
  sessionCategoryCostBreakdown: StatsBreakdownItem[]
  sessionSubCategoryCostBreakdown: StatsBreakdownItem[]
}

export interface StatsChartsResult {
  period: StatsPeriod
  year: number
  month: number
  rangeText: string
  summary: StatsChartsSummary
  charts: StatsCharts
}
