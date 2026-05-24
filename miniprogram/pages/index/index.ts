import type { SessionStats, TennisSession } from '../../models/session'
import { getLatestSession, getSessionStats } from '../../services/session-service'

interface IndexData {
  latestSession: TennisSession | null
  latestSessionSummary: string
  stats: SessionStats
  monthHoursText: string
  currentYear: number
}

const createLatestSessionSummary = (session: TennisSession | null) => {
  if (!session) {
    return '还没有打球记录，点击下方 + 快速记录一次'
  }

  const parts = [`${session.durationMinutes} 分钟`]

  if (session.courtName) {
    parts.push(session.courtName)
  }

  if (session.partner) {
    parts.push(`搭档 ${session.partner}`)
  }

  return parts.join(' · ')
}

Component({
  data: {
    latestSession: null,
    latestSessionSummary: '还没有打球记录，点击下方 + 快速记录一次',
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
      const latestSession = getLatestSession()
      const currentYear = new Date().getFullYear()

      this.setData({
        latestSession,
        latestSessionSummary: createLatestSessionSummary(latestSession),
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
