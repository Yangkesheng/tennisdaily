import type { HomeRatingTrendItem } from '../../models/home'
import type { SessionStats, TennisSession, TennisSessionType } from '../../models/session'
import { getToken, redirectToLogin } from '../../services/auth-service'
import { getHomeSummaryRemote } from '../../services/home-api-service'

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
  monthExpenseText: string
  isExpenseVisible: boolean
  currentYear: number
  isLoggedIn: boolean
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

const getSessionTypeDisplay = (session: TennisSession) => {
  const typeLabel = session.typeText || getSessionTypeLabel(session.type)
  const rankLabel = session.matchRankLabel || ''

  if ((session.type === 'singlesMatch' || session.type === 'doublesMatch') && rankLabel) {
    return `${typeLabel} ${rankLabel}`
  }

  return typeLabel
}

const createLatestSessionView = (session: TennisSession | null): LatestSessionView | null => {
  if (!session) {
    return null
  }

  return {
    ...session,
    typeLabel: getSessionTypeDisplay(session),
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

const createRatingTrend = (items: HomeRatingTrendItem[]): RatingTrendItem[] => {
  return items.slice(0, 5).reverse().map((item) => {
    const rating = item.rating || 3
    const [, month = '', day = ''] = item.date.split('-')

    return {
      key: item.id,
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

const formatMoneyText = (value: number) => {
  if (!value) {
    return '0'
  }

  return Number.isInteger(value) ? `${value}` : value.toFixed(1)
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
      yearCount: 0,
      totalCount: 0,
    },
    monthHoursText: '0.0',
    monthExpenseText: '0',
    isExpenseVisible: true,
    currentYear: new Date().getFullYear(),
    isLoggedIn: false,
  } as IndexData,
  pageLifetimes: {
    show() {
      this.refreshData()
    },
  },
  methods: {
    async refreshData() {
      const currentYear = new Date().getFullYear()

      if (!getToken()) {
        this.setData({
          latestSession: null,
          latestSessionSummary: '还没有打球记录，点击下方 + 快速记录一次',
          ratingTrend: [],
          ratingTrendText: '暂无记录',
          stats: {
            monthCount: 0,
            monthMinutes: 0,
            monthCost: 0,
            yearCount: 0,
            totalCount: 0,
          },
          monthHoursText: '0.0',
          monthExpenseText: '0',
          currentYear,
          isLoggedIn: false,
        })
        return
      }

      this.setData({ isLoggedIn: true })

      try {
        const summary = await getHomeSummaryRemote()
        const stats = summary.session
        const latestSession = createLatestSessionView(summary.latestSession)
        const ratingTrend = createRatingTrend(summary.ratingTrend)

        this.setData({
          latestSession,
          latestSessionSummary: createLatestSessionSummary(latestSession),
          ratingTrend,
          ratingTrendText: createRatingTrendText(ratingTrend),
          stats,
          monthHoursText: (stats.monthMinutes / 60).toFixed(1),
          monthExpenseText: formatMoneyText(summary.expense.totalCost),
          currentYear: summary.year || currentYear,
          isLoggedIn: true,
        })
      } catch (error) {
        wx.showToast({
          title: error instanceof Error ? error.message : '服务暂时不可用',
          icon: 'none',
        })
      }
    },
    toggleExpenseVisible() {
      this.setData({
        isExpenseVisible: !this.data.isExpenseVisible,
      })
    },
    goLogin() {
      redirectToLogin()
    },
    ensureUserLoggedIn() {
      if (getToken()) {
        return true
      }

      redirectToLogin()
      return false
    },
    goCreateSession() {
      if (!this.ensureUserLoggedIn()) {
        return
      }

      wx.navigateTo({
        url: '/pages/session-edit/session-edit',
      })
    },
    goSessionList() {
      if (!this.ensureUserLoggedIn()) {
        return
      }

      wx.navigateTo({
        url: '/pages/session-list/session-list',
      })
    },
    goRecentSessions() {
      if (!this.ensureUserLoggedIn()) {
        return
      }

      wx.navigateTo({
        url: '/pages/session-list/session-list?range=recent',
      })
    },
  },
})
