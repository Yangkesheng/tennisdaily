import type { StatsBreakdownItem, StatsChartsResult, StatsPeriod } from '../../models/stats'
import { requireLoginPage } from '../../services/auth-service'
import { getSessionCalendarFromApi, getTodayText } from '../../services/session-service'
import { getStatsChartsFromApi } from '../../services/stats-api-service'

interface CalendarDay {
  key: string
  label: string
  marked: boolean
  today: boolean
  blank: boolean
}

interface CalendarMonth {
  key: string
  label: string
  days: CalendarDay[]
}

interface BarChartItem {
  key: string
  label: string
  value: number
  height: number
}

interface RatingChartItem {
  key: string
  label: string
  rating: number
  height: number
}

interface BreakdownChartItem extends StatsBreakdownItem {
  valueText: string
  width: number
}

interface StatsView {
  rangeText: string
  sessionCount: number
  activeDayCount: number
  totalHoursText: string
  averageHoursText: string
  averageRatingText: string
  totalCostText: string
  frequency: BarChartItem[]
  ratingTrend: RatingChartItem[]
  expenseBreakdown: BreakdownChartItem[]
  sessionTypeBreakdown: BreakdownChartItem[]
}

interface CalendarData {
  activeTab: 'calendar' | 'stats'
  statsPeriod: StatsPeriod
  currentYear: number
  currentMonth: number
  activeDayCount: number
  calendarMonths: CalendarMonth[]
  statsView: StatsView
  isCalendarLoading: boolean
  isStatsLoading: boolean
  canGoNext: boolean
  canJumpCurrent: boolean
}

const emptyStatsView: StatsView = {
  rangeText: '',
  sessionCount: 0,
  activeDayCount: 0,
  totalHoursText: '0.0',
  averageHoursText: '0.0',
  averageRatingText: '暂无',
  totalCostText: '0',
  frequency: [],
  ratingTrend: [],
  expenseBreakdown: [],
  sessionTypeBreakdown: [],
}

const createDateText = (year: number, month: number, day: number) => {
  return `${year}-${`${month}`.padStart(2, '0')}-${`${day}`.padStart(2, '0')}`
}

const createCalendarMonth = (year: number, month: number, activeDates: string[]) => {
  const activeDateSet = new Set(activeDates)
  const todayText = getTodayText()
  const firstDate = new Date(year, month - 1, 1)
  const daysInMonth = new Date(year, month, 0).getDate()
  const days: CalendarDay[] = []

  const firstWeekday = firstDate.getDay() || 7
  for (let index = 1; index < firstWeekday; index += 1) {
    days.push({
      key: `${year}-${month}-blank-${index}`,
      label: '',
      marked: false,
      today: false,
      blank: true,
    })
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const dateText = createDateText(year, month, day)

    days.push({
      key: dateText,
      label: `${day}`,
      marked: activeDateSet.has(dateText),
      today: dateText === todayText,
      blank: false,
    })
  }

  return {
    key: `${year}-${month}`,
    label: `${month}月`,
    days,
  }
}

const getAdjacentMonth = (year: number, month: number, offset: number) => {
  const date = new Date(year, month - 1 + offset, 1)

  return {
    year: date.getFullYear(),
    month: date.getMonth() + 1,
  }
}

const formatMoneyText = (value: number) => {
  if (!value) {
    return '0'
  }

  return Number.isInteger(value) ? `${value}` : value.toFixed(1)
}

const createBarChart = (items: { label: string; value: number }[]): BarChartItem[] => {
  const maxValue = Math.max(...items.map((item) => item.value), 0)

  return items.map((item, index) => ({
    key: `${item.label}-${index}`,
    label: item.label,
    value: item.value,
    height: maxValue > 0 ? Math.max(14, Math.round((item.value / maxValue) * 140)) : 0,
  }))
}

const createRatingChart = (items: { label: string; date: string; rating: number }[]): RatingChartItem[] => {
  return items.map((item, index) => ({
    key: `${item.date || item.label}-${index}`,
    label: item.label,
    rating: item.rating,
    height: item.rating > 0 ? Math.max(14, Math.round(item.rating * 28)) : 0,
  }))
}

const sortBreakdownByPercentDesc = (items: StatsBreakdownItem[]) => {
  return [...items].sort((left, right) => {
    if (right.percent !== left.percent) {
      return right.percent - left.percent
    }

    return right.value - left.value
  })
}

const createBreakdownChart = (items: StatsBreakdownItem[]): BreakdownChartItem[] => {
  return sortBreakdownByPercentDesc(items).map((item) => ({
    ...item,
    valueText: formatMoneyText(item.value),
    width: Math.max(0, Math.min(100, item.percent)),
  }))
}

const createCountBreakdownChart = (items: StatsBreakdownItem[]): BreakdownChartItem[] => {
  return sortBreakdownByPercentDesc(items).map((item) => ({
    ...item,
    valueText: `${item.value}`,
    width: Math.max(0, Math.min(100, item.percent)),
  }))
}

const createStatsView = (stats: StatsChartsResult): StatsView => {
  return {
    rangeText: stats.rangeText,
    sessionCount: stats.summary.sessionCount,
    activeDayCount: stats.summary.activeDayCount,
    totalHoursText: (stats.summary.totalMinutes / 60).toFixed(1),
    averageHoursText: (stats.summary.averageMinutes / 60).toFixed(1),
    averageRatingText: stats.summary.averageRating > 0 ? stats.summary.averageRating.toFixed(1) : '暂无',
    totalCostText: formatMoneyText(stats.summary.totalCost),
    frequency: createBarChart(stats.charts.frequency),
    ratingTrend: createRatingChart(stats.charts.ratingTrend),
    expenseBreakdown: createBreakdownChart(stats.charts.expenseBreakdown),
    sessionTypeBreakdown: createCountBreakdownChart(stats.charts.sessionTypeBreakdown),
  }
}

const getCanGoNext = (activeTab: CalendarData['activeTab'], statsPeriod: StatsPeriod, year: number, month: number) => {
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() + 1

  if (activeTab === 'stats' && statsPeriod === 'year') {
    return year < currentYear
  }

  return year < currentYear || (year === currentYear && month < currentMonth)
}

const getCanJumpCurrent = (activeTab: CalendarData['activeTab'], statsPeriod: StatsPeriod, year: number, month: number) => {
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() + 1

  if (activeTab === 'stats' && statsPeriod === 'year') {
    return year !== currentYear
  }

  return year !== currentYear || month !== currentMonth
}

Component({
  data: {
    activeTab: 'calendar',
    statsPeriod: 'month',
    currentYear: new Date().getFullYear(),
    currentMonth: new Date().getMonth() + 1,
    activeDayCount: 0,
    calendarMonths: [],
    statsView: emptyStatsView,
    isCalendarLoading: false,
    isStatsLoading: false,
    canGoNext: false,
    canJumpCurrent: false,
  } as CalendarData,
  pageLifetimes: {
    show() {
      this.refreshCalendar()
    },
  },
  methods: {
    async refreshCalendar(year?: number, month?: number) {
      if (requireLoginPage()) {
        return
      }

      const now = new Date()
      const targetYear = year || this.data.currentYear || now.getFullYear()
      const targetMonth = month || this.data.currentMonth || now.getMonth() + 1

      this.setData({
        isCalendarLoading: true,
      })

      try {
        const calendar = await getSessionCalendarFromApi(targetYear, targetMonth)
        const activeDates = Array.isArray(calendar.days) ? calendar.days.map((day) => day.date) : []

        this.setData({
          currentYear: calendar.year,
          currentMonth: calendar.month,
          activeDayCount: calendar.activeDayCount,
          calendarMonths: [createCalendarMonth(calendar.year, calendar.month, activeDates)],
          canGoNext: getCanGoNext(this.data.activeTab, this.data.statsPeriod, calendar.year, calendar.month),
          canJumpCurrent: getCanJumpCurrent(this.data.activeTab, this.data.statsPeriod, calendar.year, calendar.month),
        })

        if (this.data.activeTab === 'stats' && this.data.statsPeriod === 'month') {
          this.refreshStats('month', calendar.year, calendar.month)
        }
      } catch (error) {
        wx.showToast({
          title: error instanceof Error ? error.message : '服务暂时不可用',
          icon: 'none',
        })
      } finally {
        this.setData({
          isCalendarLoading: false,
        })
      }
    },
    async refreshStats(period?: StatsPeriod, year?: number, month?: number) {
      if (requireLoginPage()) {
        return
      }

      const targetPeriod = period || this.data.statsPeriod
      const targetYear = year || this.data.currentYear
      const targetMonth = month || this.data.currentMonth

      this.setData({
        isStatsLoading: true,
      })

      try {
        const stats = await getStatsChartsFromApi(targetPeriod, targetYear, targetMonth)

        this.setData({
          statsPeriod: targetPeriod,
          statsView: createStatsView(stats),
          canGoNext: getCanGoNext(this.data.activeTab, targetPeriod, targetYear, targetMonth),
          canJumpCurrent: getCanJumpCurrent(this.data.activeTab, targetPeriod, targetYear, targetMonth),
        })
      } catch (error) {
        wx.showToast({
          title: error instanceof Error ? error.message : '统计加载失败',
          icon: 'none',
        })
      } finally {
        this.setData({
          isStatsLoading: false,
        })
      }
    },
    showCalendarTab() {
      this.setData({
        activeTab: 'calendar',
        canGoNext: getCanGoNext('calendar', this.data.statsPeriod, this.data.currentYear, this.data.currentMonth),
        canJumpCurrent: getCanJumpCurrent('calendar', this.data.statsPeriod, this.data.currentYear, this.data.currentMonth),
      })
      this.refreshCalendar(this.data.currentYear, this.data.currentMonth)
    },
    showStatsTab() {
      this.setData({
        activeTab: 'stats',
        canGoNext: getCanGoNext('stats', this.data.statsPeriod, this.data.currentYear, this.data.currentMonth),
        canJumpCurrent: getCanJumpCurrent('stats', this.data.statsPeriod, this.data.currentYear, this.data.currentMonth),
      })
      this.refreshStats(this.data.statsPeriod, this.data.currentYear, this.data.currentMonth)
    },
    selectMonthStats() {
      this.refreshStats('month', this.data.currentYear, this.data.currentMonth)
    },
    selectYearStats() {
      this.setData({
        canGoNext: getCanGoNext('stats', 'year', this.data.currentYear, this.data.currentMonth),
        canJumpCurrent: getCanJumpCurrent('stats', 'year', this.data.currentYear, this.data.currentMonth),
      })
      this.refreshStats('year', this.data.currentYear, this.data.currentMonth)
    },
    jumpToCurrentPeriod() {
      if (this.data.isCalendarLoading || this.data.isStatsLoading) {
        return
      }

      const now = new Date()
      const currentYear = now.getFullYear()
      const currentMonth = now.getMonth() + 1

      if (this.data.activeTab === 'stats' && this.data.statsPeriod === 'year') {
        this.setData({
          currentYear,
          currentMonth,
          canGoNext: false,
          canJumpCurrent: false,
        })
        this.refreshStats('year', currentYear, currentMonth)
        return
      }

      this.refreshCalendar(currentYear, currentMonth)
    },
    goPreviousMonth() {
      if (this.data.isCalendarLoading || this.data.isStatsLoading) {
        return
      }

      if (this.data.activeTab === 'stats' && this.data.statsPeriod === 'year') {
        const previousYear = this.data.currentYear - 1
        this.setData({
          currentYear: previousYear,
          canGoNext: getCanGoNext('stats', 'year', previousYear, this.data.currentMonth),
          canJumpCurrent: getCanJumpCurrent('stats', 'year', previousYear, this.data.currentMonth),
        })
        this.refreshStats('year', previousYear, this.data.currentMonth)
        return
      }

      const previous = getAdjacentMonth(this.data.currentYear, this.data.currentMonth, -1)
      this.refreshCalendar(previous.year, previous.month)
    },
    goNextMonth() {
      if (this.data.isCalendarLoading || this.data.isStatsLoading || !this.data.canGoNext) {
        return
      }

      if (this.data.activeTab === 'stats' && this.data.statsPeriod === 'year') {
        const nextYear = this.data.currentYear + 1
        this.setData({
          currentYear: nextYear,
          canGoNext: getCanGoNext('stats', 'year', nextYear, this.data.currentMonth),
          canJumpCurrent: getCanJumpCurrent('stats', 'year', nextYear, this.data.currentMonth),
        })
        this.refreshStats('year', nextYear, this.data.currentMonth)
        return
      }

      const next = getAdjacentMonth(this.data.currentYear, this.data.currentMonth, 1)
      this.refreshCalendar(next.year, next.month)
    },
    goDaySessions(event: WechatMiniprogram.TouchEvent) {
      const date = event.currentTarget.dataset.date as string | undefined
      const marked = event.currentTarget.dataset.marked === true || event.currentTarget.dataset.marked === 'true'

      if (!date) {
        return
      }

      wx.navigateTo({
        url: marked ? `/pages/session-list/session-list?date=${date}` : `/pages/session-edit/session-edit?date=${date}`,
      })
    },
  },
})
