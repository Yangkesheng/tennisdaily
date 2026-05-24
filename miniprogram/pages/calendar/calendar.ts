import type { TennisSession } from '../../models/session'
import { getTodayText, listSessions } from '../../services/session-service'

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
  activeDayCount: number
  calendarMonths: CalendarMonth[]
}

const createDateText = (year: number, month: number, day: number) => {
  return `${year}-${`${month}`.padStart(2, '0')}-${`${day}`.padStart(2, '0')}`
}

const getActiveDates = (sessions: TennisSession[]) => {
  return Array.from(new Set(sessions.map((session) => session.date)))
}

const createCalendarMonths = (year: number, activeDates: string[]) => {
  const activeDateSet = new Set(activeDates)
  const todayText = getTodayText()
  const months: CalendarMonth[] = []

  for (let month = 1; month <= 12; month += 1) {
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

    months.push({
      key: `${year}-${month}`,
      label: `${month}月`,
      days,
    })
  }

  return months
}

Component({
  data: {
    currentYear: new Date().getFullYear(),
    activeDayCount: 0,
    calendarMonths: [],
  } as CalendarData,
  pageLifetimes: {
    show() {
      this.refreshCalendar()
    },
  },
  methods: {
    refreshCalendar() {
      const currentYear = new Date().getFullYear()
      const activeDates = getActiveDates(listSessions())

      this.setData({
        currentYear,
        activeDayCount: activeDates.length,
        calendarMonths: createCalendarMonths(currentYear, activeDates),
      })
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
