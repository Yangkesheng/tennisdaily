import type { SessionStats, TennisSession, TennisSessionType } from '../../models/session'
import { getLatestSession, getSessionStats, listSessions } from '../../services/session-service'

interface RatingTrendItem {
  key: string
  dateText: string
  rating: number
  height: number
  level: 'high' | 'normal' | 'low'
}

interface LatestSessionView extends TennisSession {
  typeLabel: string
}

interface IndexData {
  latestSession: LatestSessionView | null
  latestSessionSummary: string
  ratingTrend: RatingTrendItem[]
  ratingTrendText: string
  stats: SessionStats
  monthHoursText: string
  currentYear: number
}

const getSessionTypeLabel = (type: TennisSessionType) => {
  switch (type) {
    case 'singles':
      return '单打'
    case 'doubles':
      return '双打'
    case 'training':
      return '训练'
    case 'singlesMatch':
      return '单打比赛'
    case 'doublesMatch':
      return '双打比赛'
    default:
      return '未分类'
  }
}

const createLatestSessionView = (session: TennisSession | null): LatestSessionView | null => {
  if (!session) {
    return null
  }

  return {
    ...session,
    typeLabel: getSessionTypeLabel(session.type),
  }
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

const getRatingLevel = (rating: number): RatingTrendItem['level'] => {
  if (rating >= 4) {
    return 'high'
  }

  if (rating >= 3) {
    return 'normal'
  }

  return 'low'
}

const createRatingTrend = (sessions: TennisSession[]): RatingTrendItem[] => {
  return sessions.slice(0, 5).reverse().map((session) => {
    const rating = session.rating || 3
    const [, month = '', day = ''] = session.date.split('-')

    return {
      key: session.id,
      dateText: `${Number(month)}/${Number(day)}`,
      rating,
      height: rating * 22,
      level: getRatingLevel(rating),
    }
  })
}

const createRatingTrendText = (trend: RatingTrendItem[]) => {
  if (!trend.length) {
    return '暂无记录'
  }

  const average = trend.reduce((total, item) => total + item.rating, 0) / trend.length

  return `平均 ${average.toFixed(1)}`
}

Component({
  data: {
    latestSession: null,
    latestSessionSummary: '还没有打球记录，点击下方 + 快速记录一次',
    ratingTrend: [],
    ratingTrendText: '暂无记录',
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
      const sessions = listSessions()
      const latestSession = createLatestSessionView(getLatestSession())
      const ratingTrend = createRatingTrend(sessions)
      const currentYear = new Date().getFullYear()

      this.setData({
        latestSession,
        latestSessionSummary: createLatestSessionSummary(latestSession),
        ratingTrend,
        ratingTrendText: createRatingTrendText(ratingTrend),
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
