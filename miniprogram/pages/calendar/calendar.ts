import type { SessionCalendar } from '../../models/session'
import type { StatsPeriod } from '../../models/stats'
import { requireLoginPage } from '../../services/auth-service'
import { getSessionCalendarFromApi, getSessionYearCalendarFromApi, getTodayText } from '../../services/session-service'

interface PickerChangeEvent {
  detail: {
    value: string
  }
}

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

interface StatsView {
  rangeText: string
  sessionCount: number
  activeDayCount: number
  totalHoursText: string
  averageMinutesText: string
  averageHoursText: string
  averageRatingText: string
  sessionCostText: string
  totalCostText: string
  frequency: BarChartItem[]
  ratingTrend: RatingChartItem[]
  expenseBreakdown: BreakdownChartItem[]
  sessionTypeBreakdown: BreakdownChartItem[]
}

interface StatsBreakdownViewItem {
  key: string
  label: string
  value: number
  percent: number
}

interface BreakdownChartItem extends StatsBreakdownViewItem {
  valueText: string
  width: number
}

interface CalendarData {
  activeTab: 'calendar' | 'stats'
  calendarPeriod: StatsPeriod
  statsPeriod: StatsPeriod
  currentYear: number
  currentMonth: number
  yearOptions: string[]
  yearPickerIndex: number
  monthOptions: string[]
  monthPickerIndex: number
  activeDayCount: number
  calendarMonths: CalendarMonth[]
  statsView: StatsView
  isCalendarLoading: boolean
  isStatsLoading: boolean
  isExpenseVisible: boolean
  canGoNext: boolean
  canJumpCurrent: boolean
}

const createYearOptions = () => {
  const currentYear = new Date().getFullYear()
  const startYear = 2000
  const years: string[] = []

  for (let year = currentYear; year >= startYear; year -= 1) {
    years.push(`${year}`)
  }

  return years
}

const getYearPickerIndex = (yearOptions: string[], year: number) => {
  const index = yearOptions.findIndex((item) => Number(item) === year)

  return index >= 0 ? index : 0
}

const createMonthOptions = () => {
  return Array.from({ length: 12 }, (_, index) => `${index + 1}`)
}

const getMonthPickerIndex = (month: number) => {
  return Math.max(0, Math.min(11, month - 1))
}

const emptyStatsView: StatsView = {
  rangeText: '',
  sessionCount: 0,
  activeDayCount: 0,
  totalHoursText: '0.0',
  averageMinutesText: '0',
  averageHoursText: '0.0',
  averageRatingText: '暂无',
  sessionCostText: '0',
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

const createCalendarMonths = (year: number, month: number, period: StatsPeriod, activeDates: string[]) => {
  if (period === 'year') {
    return Array.from({ length: 12 }, (_, index) => createCalendarMonth(year, index + 1, activeDates))
  }

  return [createCalendarMonth(year, month, activeDates)]
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
    label: item.label || item.date,
    rating: item.rating,
    height: item.rating > 0 ? Math.max(14, Math.round(item.rating * 28)) : 0,
  }))
}

const sortBreakdownByPercentDesc = (items: StatsBreakdownViewItem[]) => {
  return [...items].sort((left, right) => {
    if (right.percent !== left.percent) {
      return right.percent - left.percent
    }

    return right.value - left.value
  })
}

const createBreakdownChart = (items: StatsBreakdownViewItem[]): BreakdownChartItem[] => {
  return sortBreakdownByPercentDesc(items).map((item) => ({
    ...item,
    valueText: formatMoneyText(item.value),
    width: Math.max(0, Math.min(100, item.percent)),
  }))
}

const createCountBreakdownChart = (items: StatsBreakdownViewItem[]): BreakdownChartItem[] => {
  return sortBreakdownByPercentDesc(items).map((item) => ({
    ...item,
    valueText: `${item.value}`,
    width: Math.max(0, Math.min(100, item.percent)),
  }))
}

const createPercentBreakdown = (items: { key?: string; label: string; value: number; percent?: number }[], total: number): StatsBreakdownViewItem[] => {
  return items.map((item, index) => ({
    key: item.key || item.label || `${index}`,
    label: item.label,
    value: item.value,
    percent: typeof item.percent === 'number' && item.percent > 0 ? item.percent : total > 0 ? Math.round((item.value / total) * 100) : 0,
  }))
}

const createSessionTypeBreakdown = (calendar: SessionCalendar): StatsBreakdownViewItem[] => {
  if (calendar.charts.sessionTypeBreakdown.length) {
    const total = calendar.charts.sessionTypeBreakdown.reduce((sum, item) => sum + item.value, 0)

    return createPercentBreakdown(calendar.charts.sessionTypeBreakdown, total)
  }

  const summary = calendar.summary

  return createPercentBreakdown([
    { key: 'training', label: '训练', value: summary.trainingCount },
    { key: 'singles', label: '单打', value: summary.singlesCount },
    { key: 'doubles', label: '双打', value: summary.doublesCount },
    { key: 'match', label: '比赛', value: summary.matchCount },
  ], summary.sessionCount)
}

const createStatsViewFromCalendar = (calendar: SessionCalendar, period: StatsPeriod): StatsView => {
  const summary = calendar.summary
  const expenseBreakdown = createPercentBreakdown(calendar.charts.expenseBreakdown, summary.totalCost)
  const sessionTypeBreakdown = createSessionTypeBreakdown(calendar)

  return {
    rangeText: period === 'year' ? `${calendar.year}年` : `${calendar.year}年${calendar.month}月`,
    sessionCount: summary.sessionCount,
    activeDayCount: summary.activeDayCount,
    totalHoursText: (summary.totalMinutes / 60).toFixed(1),
    averageMinutesText: `${Math.round(summary.averageMinutes)}`,
    averageHoursText: (summary.averageMinutes / 60).toFixed(1),
    averageRatingText: summary.averageRating > 0 ? summary.averageRating.toFixed(1) : '暂无',
    sessionCostText: formatMoneyText(summary.sessionCost),
    totalCostText: formatMoneyText(summary.totalCost),
    frequency: createBarChart(calendar.charts.frequency),
    ratingTrend: createRatingChart(calendar.charts.ratingTrend),
    expenseBreakdown: createBreakdownChart(expenseBreakdown),
    sessionTypeBreakdown: createCountBreakdownChart(sessionTypeBreakdown),
  }
}

const getCanGoNext = (activeTab: CalendarData['activeTab'], calendarPeriod: StatsPeriod, statsPeriod: StatsPeriod, year: number, month: number) => {
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() + 1

  if ((activeTab === 'calendar' && calendarPeriod === 'year') || (activeTab === 'stats' && statsPeriod === 'year')) {
    return year < currentYear
  }

  return year < currentYear || (year === currentYear && month < currentMonth)
}

const getCanJumpCurrent = (activeTab: CalendarData['activeTab'], calendarPeriod: StatsPeriod, statsPeriod: StatsPeriod, year: number, month: number) => {
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() + 1

  if ((activeTab === 'calendar' && calendarPeriod === 'year') || (activeTab === 'stats' && statsPeriod === 'year')) {
    return year !== currentYear
  }

  return year !== currentYear || month !== currentMonth
}

let calendarRequestSeq = 0
let calendarPeriodState: StatsPeriod = 'month'
const initialYearOptions = createYearOptions()
const initialYear = new Date().getFullYear()
const initialMonth = new Date().getMonth() + 1
const monthOptions = createMonthOptions()

Component({
  data: {
    activeTab: 'calendar',
    calendarPeriod: 'month',
    statsPeriod: 'month',
    currentYear: initialYear,
    currentMonth: initialMonth,
    yearOptions: initialYearOptions,
    yearPickerIndex: getYearPickerIndex(initialYearOptions, initialYear),
    monthOptions,
    monthPickerIndex: getMonthPickerIndex(initialMonth),
    activeDayCount: 0,
    calendarMonths: [],
    statsView: emptyStatsView,
    isCalendarLoading: false,
    isStatsLoading: false,
    isExpenseVisible: true,
    canGoNext: false,
    canJumpCurrent: false,
  } as CalendarData,
  pageLifetimes: {
    show() {
      this.refreshCalendar(this.data.currentYear, this.data.currentMonth, calendarPeriodState)
    },
  },
  methods: {
    async refreshCalendar(year?: number, month?: number, period?: StatsPeriod) {
      if (requireLoginPage()) {
        return
      }

      const now = new Date()
      const requestSeq = calendarRequestSeq + 1
      calendarRequestSeq = requestSeq
      const targetPeriod = period || calendarPeriodState || this.data.calendarPeriod
      calendarPeriodState = targetPeriod
      const targetYear = year || this.data.currentYear || now.getFullYear()
      const targetMonth = month || this.data.currentMonth || now.getMonth() + 1

      this.setData({
        isCalendarLoading: true,
      })

      try {
        const calendar = targetPeriod === 'year'
          ? await getSessionYearCalendarFromApi(targetYear)
          : await getSessionCalendarFromApi(targetYear, targetMonth)

        if (requestSeq !== calendarRequestSeq) {
          return
        }

        const activeDates = Array.isArray(calendar.days) ? calendar.days.map((day) => day.date) : []
        const nextMonth = targetPeriod === 'year' ? targetMonth : calendar.month

        this.setData({
          calendarPeriod: targetPeriod,
          currentYear: calendar.year,
          currentMonth: nextMonth,
          yearPickerIndex: getYearPickerIndex(this.data.yearOptions, calendar.year),
          monthPickerIndex: getMonthPickerIndex(nextMonth),
          activeDayCount: calendar.activeDayCount,
          calendarMonths: createCalendarMonths(calendar.year, nextMonth, targetPeriod, activeDates),
          canGoNext: getCanGoNext(this.data.activeTab, targetPeriod, this.data.statsPeriod, calendar.year, nextMonth),
          canJumpCurrent: getCanJumpCurrent(this.data.activeTab, targetPeriod, this.data.statsPeriod, calendar.year, nextMonth),
        })

        if (this.data.activeTab === 'stats' && this.data.statsPeriod === 'month') {
          this.refreshStats('month', calendar.year, nextMonth)
        }
      } catch (error) {
        wx.showToast({
          title: error instanceof Error ? error.message : '服务暂时不可用',
          icon: 'none',
        })
      } finally {
        if (requestSeq === calendarRequestSeq) {
          this.setData({
            isCalendarLoading: false,
          })
        }
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
        const calendar = targetPeriod === 'year'
          ? await getSessionYearCalendarFromApi(targetYear)
          : await getSessionCalendarFromApi(targetYear, targetMonth)

        const nextMonth = targetPeriod === 'year' ? targetMonth : calendar.month

        this.setData({
          statsPeriod: targetPeriod,
          statsView: createStatsViewFromCalendar(calendar, targetPeriod),
          currentYear: calendar.year,
          currentMonth: nextMonth,
          yearPickerIndex: getYearPickerIndex(this.data.yearOptions, calendar.year),
          monthPickerIndex: getMonthPickerIndex(nextMonth),
          canGoNext: getCanGoNext(this.data.activeTab, this.data.calendarPeriod, targetPeriod, calendar.year, nextMonth),
          canJumpCurrent: getCanJumpCurrent(this.data.activeTab, this.data.calendarPeriod, targetPeriod, calendar.year, nextMonth),
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
        canGoNext: getCanGoNext('calendar', this.data.calendarPeriod, this.data.statsPeriod, this.data.currentYear, this.data.currentMonth),
        canJumpCurrent: getCanJumpCurrent('calendar', this.data.calendarPeriod, this.data.statsPeriod, this.data.currentYear, this.data.currentMonth),
      })
      this.refreshCalendar(this.data.currentYear, this.data.currentMonth, this.data.calendarPeriod)
    },
    showStatsTab() {
      this.setData({
        activeTab: 'stats',
        canGoNext: getCanGoNext('stats', this.data.calendarPeriod, this.data.statsPeriod, this.data.currentYear, this.data.currentMonth),
        canJumpCurrent: getCanJumpCurrent('stats', this.data.calendarPeriod, this.data.statsPeriod, this.data.currentYear, this.data.currentMonth),
      })
      this.refreshStats(this.data.statsPeriod, this.data.currentYear, this.data.currentMonth)
    },
    selectMonthCalendar() {
      calendarPeriodState = 'month'
      this.refreshCalendar(this.data.currentYear, this.data.currentMonth, 'month')
    },
    selectYearCalendar() {
      calendarPeriodState = 'year'
      this.refreshCalendar(this.data.currentYear, this.data.currentMonth, 'year')
    },
    onYearChange(event: PickerChangeEvent) {
      const selectedIndex = Number(event.detail.value)
      const selectedYear = Number(this.data.yearOptions[selectedIndex])

      if (!selectedYear || this.data.isCalendarLoading || this.data.isStatsLoading) {
        return
      }

      if (this.data.activeTab === 'calendar') {
        this.refreshCalendar(selectedYear, this.data.currentMonth, this.data.calendarPeriod)
        return
      }

      this.setData({
        currentYear: selectedYear,
        yearPickerIndex: getYearPickerIndex(this.data.yearOptions, selectedYear),
        canGoNext: getCanGoNext('stats', this.data.calendarPeriod, this.data.statsPeriod, selectedYear, this.data.currentMonth),
        canJumpCurrent: getCanJumpCurrent('stats', this.data.calendarPeriod, this.data.statsPeriod, selectedYear, this.data.currentMonth),
      })
      this.refreshStats(this.data.statsPeriod, selectedYear, this.data.currentMonth)
    },
    onMonthChange(event: PickerChangeEvent) {
      const selectedMonth = Number(this.data.monthOptions[Number(event.detail.value)])

      if (!selectedMonth || this.data.isCalendarLoading || this.data.isStatsLoading) {
        return
      }

      const now = new Date()
      const currentYear = now.getFullYear()
      const currentMonth = now.getMonth() + 1

      if (this.data.currentYear === currentYear && selectedMonth > currentMonth) {
        wx.showToast({
          title: '不能选择未来月份',
          icon: 'none',
        })
        this.setData({
          monthPickerIndex: getMonthPickerIndex(this.data.currentMonth),
        })
        return
      }

      if (this.data.activeTab === 'calendar') {
        this.refreshCalendar(this.data.currentYear, selectedMonth, this.data.calendarPeriod)
        return
      }

      this.setData({
        currentMonth: selectedMonth,
        monthPickerIndex: getMonthPickerIndex(selectedMonth),
        canGoNext: getCanGoNext('stats', this.data.calendarPeriod, this.data.statsPeriod, this.data.currentYear, selectedMonth),
        canJumpCurrent: getCanJumpCurrent('stats', this.data.calendarPeriod, this.data.statsPeriod, this.data.currentYear, selectedMonth),
      })
      this.refreshStats(this.data.statsPeriod, this.data.currentYear, selectedMonth)
    },
    selectMonthStats() {
      this.refreshStats('month', this.data.currentYear, this.data.currentMonth)
    },
    selectYearStats() {
      this.setData({
        canGoNext: getCanGoNext('stats', this.data.calendarPeriod, 'year', this.data.currentYear, this.data.currentMonth),
        canJumpCurrent: getCanJumpCurrent('stats', this.data.calendarPeriod, 'year', this.data.currentYear, this.data.currentMonth),
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

      if (this.data.activeTab === 'calendar') {
        this.refreshCalendar(currentYear, currentMonth, this.data.calendarPeriod)
        return
      }

      if (this.data.activeTab === 'stats' && this.data.statsPeriod === 'year') {
        this.setData({
          currentYear,
          currentMonth,
          yearPickerIndex: getYearPickerIndex(this.data.yearOptions, currentYear),
          monthPickerIndex: getMonthPickerIndex(currentMonth),
          canGoNext: false,
          canJumpCurrent: false,
        })
        this.refreshStats('year', currentYear, currentMonth)
        return
      }

      this.refreshCalendar(currentYear, currentMonth, this.data.calendarPeriod)
    },
    goPreviousMonth() {
      if (this.data.isCalendarLoading || this.data.isStatsLoading) {
        return
      }

      if (this.data.activeTab === 'calendar' && this.data.calendarPeriod === 'year') {
        this.refreshCalendar(this.data.currentYear - 1, this.data.currentMonth, 'year')
        return
      }

      if (this.data.activeTab === 'stats' && this.data.statsPeriod === 'year') {
        const previousYear = this.data.currentYear - 1
        this.setData({
          currentYear: previousYear,
          yearPickerIndex: getYearPickerIndex(this.data.yearOptions, previousYear),
          canGoNext: getCanGoNext('stats', this.data.calendarPeriod, 'year', previousYear, this.data.currentMonth),
          canJumpCurrent: getCanJumpCurrent('stats', this.data.calendarPeriod, 'year', previousYear, this.data.currentMonth),
        })
        this.refreshStats('year', previousYear, this.data.currentMonth)
        return
      }

      const previous = getAdjacentMonth(this.data.currentYear, this.data.currentMonth, -1)
      this.refreshCalendar(previous.year, previous.month, this.data.calendarPeriod)
    },
    goNextMonth() {
      if (this.data.isCalendarLoading || this.data.isStatsLoading || !this.data.canGoNext) {
        return
      }

      if (this.data.activeTab === 'calendar' && this.data.calendarPeriod === 'year') {
        this.refreshCalendar(this.data.currentYear + 1, this.data.currentMonth, 'year')
        return
      }

      if (this.data.activeTab === 'stats' && this.data.statsPeriod === 'year') {
        const nextYear = this.data.currentYear + 1
        this.setData({
          currentYear: nextYear,
          yearPickerIndex: getYearPickerIndex(this.data.yearOptions, nextYear),
          canGoNext: getCanGoNext('stats', this.data.calendarPeriod, 'year', nextYear, this.data.currentMonth),
          canJumpCurrent: getCanJumpCurrent('stats', this.data.calendarPeriod, 'year', nextYear, this.data.currentMonth),
        })
        this.refreshStats('year', nextYear, this.data.currentMonth)
        return
      }

      const next = getAdjacentMonth(this.data.currentYear, this.data.currentMonth, 1)
      this.refreshCalendar(next.year, next.month, this.data.calendarPeriod)
    },
    toggleExpenseVisible() {
      this.setData({
        isExpenseVisible: !this.data.isExpenseVisible,
      })
    },
    goDaySessions(event: WechatMiniprogram.TouchEvent) {
      const date = event.currentTarget.dataset.date as string | undefined
      const marked = event.currentTarget.dataset.marked === true || event.currentTarget.dataset.marked === 'true'

      if (!date) {
        return
      }

      calendarPeriodState = this.data.calendarPeriod

      wx.navigateTo({
        url: marked ? `/pages/session-list/session-list?date=${date}` : `/pages/session-edit/session-edit?date=${date}`,
      })
    },
  },
})
