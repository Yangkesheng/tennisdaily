import type { TennisSession } from '../../models/session'
import { requireLoginPage } from '../../services/auth-service'
import { getTodayText, listSessionsFromApi } from '../../services/session-service'

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
}

const createDateText = (year: number, month: number, day: number) => {
  return `${year}-${`${month}`.padStart(2, '0')}-${`${day}`.padStart(2, '0')}`
}

const getActiveDates = (sessions: TennisSession[]) => {
  return Array.from(new Set(sessions.map((session) => session.date)))
}

const createCalendarMonth = (year: number, month: number, activeDates: string[]) => {
  const activeDateSet = new Set(activeDates)
  const todayText = getTodayText()
  const firstDate = new Date(year, month - 1, 1)
  const daysInMonth = new Date(year, month, 0).getDate()
  const days: CalendarDay[] = []

  for (let index = 0; index < firstDate.getDay(); index += 1) {
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

const isDateInMonth = (date: string, year: number, month: number) => {
  return date.startsWith(`${year}-${`${month}`.padStart(2, '0')}-`)
}

Component({
  data: {
    currentYear: new Date().getFullYear(),
    currentMonth: new Date().getMonth() + 1,
    activeDayCount: 0,
    calendarMonths: [],
  } as CalendarData,
  pageLifetimes: {
    show() {
      this.refreshCalendar()
    },
  },
  methods: {
    async refreshCalendar() {
      if (requireLoginPage()) {
        return
      }

      const now = new Date()
      const currentYear = now.getFullYear()
      const currentMonth = now.getMonth() + 1

      try {
        const sessions = await listSessionsFromApi()
        const activeDates = getActiveDates(sessions)
        const currentMonthActiveDates = activeDates.filter((date) => isDateInMonth(date, currentYear, currentMonth))

        this.setData({
          currentYear,
          currentMonth,
          activeDayCount: currentMonthActiveDates.length,
          calendarMonths: [createCalendarMonth(currentYear, currentMonth, currentMonthActiveDates)],
        })
      } catch (error) {
        wx.showToast({
          title: error instanceof Error ? error.message : '服务暂时不可用',
          icon: 'none',
        })
      }
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
