import { requireLoginPage } from '../../services/auth-service'
import { getSessionCalendarFromApi, getTodayText } from '../../services/session-service'

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

interface CalendarData {
  currentYear: number
  currentMonth: number
  activeDayCount: number
  calendarMonths: CalendarMonth[]
  isCalendarLoading: boolean
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

Component({
  data: {
    currentYear: new Date().getFullYear(),
    currentMonth: new Date().getMonth() + 1,
    activeDayCount: 0,
    calendarMonths: [],
    isCalendarLoading: false,
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
        })
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
    goPreviousMonth() {
      if (this.data.isCalendarLoading) {
        return
      }

      const previous = getAdjacentMonth(this.data.currentYear, this.data.currentMonth, -1)
      this.refreshCalendar(previous.year, previous.month)
    },
    goNextMonth() {
      if (this.data.isCalendarLoading) {
        return
      }

      const next = getAdjacentMonth(this.data.currentYear, this.data.currentMonth, 1)
      this.refreshCalendar(next.year, next.month)
    },
    goDaySessions(event: WechatMiniprogram.TouchEvent) {
      const date = event.currentTarget.dataset.date as string | undefined

      if (!date) {
        return
      }

      wx.navigateTo({
        url: `/pages/session-list/session-list?date=${date}`,
      })
    },
  },
})
