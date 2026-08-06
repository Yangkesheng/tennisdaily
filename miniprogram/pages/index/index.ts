import type { HomeRatingTrendItem } from '../../models/home'
import type { Racket } from '../../models/racket'
import type { SessionStats, TennisSession, TennisSessionType } from '../../models/session'
import type { Shoe, ShoeWear } from '../../models/shoe'
import { getToken, redirectToLogin } from '../../services/auth-service'
import { getHomeSummaryRemote } from '../../services/home-api-service'
import { getMyPrimaryRacketFromApi } from '../../services/racket-api-service'
import { getMyPrimaryShoeFromApi } from '../../services/shoe-api-service'

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

interface PrimaryRacketView extends Racket {
  accompanyDays: number
  identityText: string
  hasStringingInfo: boolean
  stringingSpecText: string
  stringingHealthText: string
  stringingHealthState: string
  stringingHealthSegments: Array<{ key: number; on: boolean }>
}

interface PrimaryShoeView extends Shoe {
  accompanyDays: number
  identityText: string
  shoeSpecText: string
  wearState: string
  wearText: string
  wearSegments: Array<{ key: number; on: boolean }>
}

interface IndexData {
  latestSession: LatestSessionView | null
  latestSessionSummary: string
  primaryRacket: PrimaryRacketView | null
  shouldShowPrimaryRacketTip: boolean
  primaryShoe: PrimaryShoeView | null
  shouldShowPrimaryShoeTip: boolean
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

const getElapsedDays = (dateText: string) => {
  const datePart = dateText.split(' ')[0]
  if (!datePart) {
    return 0
  }

  const [year, month, day] = datePart.split('-').map(Number)
  if (!year || !month || !day) {
    return 0
  }

  const start = new Date(year, month - 1, day)
  const today = new Date()
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const diffDays = Math.floor((todayStart.getTime() - start.getTime()) / 86400000)

  return Math.max(diffDays + 1, 1)
}

const getTensionText = (racket: Racket) => {
  if (!racket.verticalTension || !racket.horizontalTension) {
    return ''
  }

  return racket.verticalTension === racket.horizontalTension
    ? `${racket.verticalTension} lbs`
    : `${racket.verticalTension}/${racket.horizontalTension} lbs`
}

const getPrimaryRacketIdentity = (racket: Racket) => {
  return racket.name || racket.model || racket.brand || '一号机'
}

const getPrimaryShoeIdentity = (shoe: Shoe) => {
  return shoe.name || shoe.model || shoe.brand || '主力鞋'
}

const getShoeSpecText = (shoe: Shoe) => {
  const parts: string[] = []

  if (shoe.size) {
    parts.push(`尺码 ${shoe.size}`)
  }
  if (shoe.colorway) {
    parts.push(shoe.colorway)
  }

  return parts.join(' · ')
}

const getStringingSpecText = (racket: Racket) => {
  const tensionText = getTensionText(racket)
  const stringName = racket.stringName || '未命名球线'

  if (!racket.stringName && !tensionText) {
    return ''
  }

  return tensionText ? `${stringName} · ${tensionText}` : stringName
}

const getStringingHealthText = (racket: Racket) => {
  return racket.stringHealth?.display || ''
}

const getStringingHealthSegments = (racket: Racket) => {
  const score = racket.stringHealth?.score
  const filled = (typeof score === 'number' && !Number.isNaN(score))
    ? Math.max(Math.min(Math.round(score / 10), 10), 0)
    : 0

  return Array.from({ length: 10 }, (_, index) => ({
    key: index,
    on: index < filled,
  }))
}

const getWearSegments = (wear: ShoeWear | null | undefined) => {
  const score = wear?.score
  const filled = (typeof score === 'number' && !Number.isNaN(score))
    ? Math.max(Math.min(Math.round(score / 10), 10), 0)
    : 0

  return Array.from({ length: 10 }, (_, index) => ({
    key: index,
    on: index < filled,
  }))
}

const createPrimaryRacketView = (racket: Racket | null): PrimaryRacketView | null => {
  if (!racket) {
    return null
  }

  const stringingSpecText = getStringingSpecText(racket)

  return {
    ...racket,
    accompanyDays: getElapsedDays(racket.purchaseDate),
    identityText: getPrimaryRacketIdentity(racket),
    hasStringingInfo: !!stringingSpecText || !!racket.lastStringDate || racket.afterStringingUsageHours > 0,
    stringingSpecText,
    stringingHealthText: getStringingHealthText(racket),
    stringingHealthState: racket.stringHealth?.state || '',
    stringingHealthSegments: getStringingHealthSegments(racket),
  }
}

const createPrimaryShoeView = (shoe: Shoe | null): PrimaryShoeView | null => {
  if (!shoe) {
    return null
  }

  return {
    ...shoe,
    accompanyDays: getElapsedDays(shoe.purchaseDate),
    identityText: getPrimaryShoeIdentity(shoe),
    shoeSpecText: getShoeSpecText(shoe),
    wearState: shoe.wear?.state || '',
    wearText: shoe.wear?.display || '',
    wearSegments: getWearSegments(shoe.wear),
  }
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
    primaryRacket: null,
    shouldShowPrimaryRacketTip: false,
    primaryShoe: null,
    shouldShowPrimaryShoeTip: false,
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
          primaryRacket: null,
          shouldShowPrimaryRacketTip: false,
          primaryShoe: null,
          shouldShowPrimaryShoeTip: false,
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
        const [summary, primaryRacket, primaryShoe] = await Promise.all([
          getHomeSummaryRemote(),
          getMyPrimaryRacketFromApi(),
          getMyPrimaryShoeFromApi(),
        ])
        const stats = summary.session
        const latestSession = createLatestSessionView(summary.latestSession)
        const ratingTrend = createRatingTrend(summary.ratingTrend)
        const primaryRacketView = createPrimaryRacketView(primaryRacket)
        const primaryShoeView = createPrimaryShoeView(primaryShoe)

        this.setData({
          latestSession,
          latestSessionSummary: createLatestSessionSummary(latestSession),
          primaryRacket: primaryRacketView,
          shouldShowPrimaryRacketTip: !primaryRacketView,
          primaryShoe: primaryShoeView,
          shouldShowPrimaryShoeTip: !primaryShoeView,
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
    goPrimaryRacket() {
      if (!this.ensureUserLoggedIn() || !this.data.primaryRacket) {
        return
      }

      wx.navigateTo({
        url: `/pages/racket-detail/racket-detail?id=${this.data.primaryRacket.id}`,
      })
    },
    goRackets() {
      if (!this.ensureUserLoggedIn()) {
        return
      }

      wx.navigateTo({
        url: '/pages/rackets/rackets',
      })
    },
    goPrimaryShoe() {
      if (!this.ensureUserLoggedIn() || !this.data.primaryShoe) {
        return
      }

      wx.navigateTo({
        url: `/pages/shoe-detail/shoe-detail?id=${this.data.primaryShoe.id}`,
      })
    },
    goShoes() {
      if (!this.ensureUserLoggedIn()) {
        return
      }

      wx.navigateTo({
        url: '/pages/shoes/shoes',
      })
    },
    onShareAppMessage() {
      return {
        title: '我的网球日记',
        path: '/pages/index/index',
      }
    },
    onShareTimeline() {
      return {
        title: '我的网球日记',
      }
    },
  },
})
