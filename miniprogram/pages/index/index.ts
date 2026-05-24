import type { SessionStats, TennisSession } from '../../models/session'
import { getLatestSession, getSessionStats } from '../../services/session-service'

interface IndexData {
  latestSession: TennisSession | null
  stats: SessionStats
  monthHoursText: string
  currentYear: number
}

Component({
  data: {
    latestSession: null,
    stats: {
      monthCount: 0,
      monthMinutes: 0,
      monthCost: 0,
      totalCount: 0,
    },
    monthHoursText: '0.0',
    currentYear: new Date().getFullYear(),
  } as IndexData,
  pageLifetimes: {
    show() {
      this.refreshData()
    },
  },
  methods: {
    refreshData() {
      const stats = getSessionStats()
      const currentYear = new Date().getFullYear()

      this.setData({
        latestSession: getLatestSession(),
        stats,
        monthHoursText: (stats.monthMinutes / 60).toFixed(1),
        currentYear,
      })
    },
    goCreateSession() {
      wx.navigateTo({
        url: '/pages/session-edit/session-edit',
      })
    },
    goSessionList() {
      wx.navigateTo({
        url: '/pages/session-list/session-list',
      })
    },
    goRecentSessions() {
      wx.navigateTo({
        url: '/pages/session-list/session-list?range=recent',
      })
    },
  },
})
