import type { RacketDashboard } from '../../models/racket'
import type { ShoeStats } from '../../models/shoe'
import { getCurrentUserFromApi, requireLoginPage, type UserProfile } from '../../services/auth-service'
import { getRacketStatsFromApi } from '../../services/racket-api-service'
import { getShoeStatsFromApi } from '../../services/shoe-api-service'
import { getHomeSummaryRemote } from '../../services/home-api-service'

interface ProfileSessionSummary {
  totalCount: number
  monthCount: number
}

interface ProfileData {
  dashboard: RacketDashboard
  shoeDashboard: ShoeStats
  sessionSummary: ProfileSessionSummary
  user: UserProfile | null
  loading: boolean
  loadError: boolean
  refreshing: boolean
  equipmentTotalText: string
}

const EMPTY_DASHBOARD: RacketDashboard = {
  racketCount: 0,
  racketCost: 0,
  stringingCost: 0,
  totalCost: 0,
  racketCostText: '0.00',
  stringingCostText: '0.00',
  totalCostText: '0.00',
}

const EMPTY_SHOE_DASHBOARD: ShoeStats = {
  shoeCount: 0,
  shoeCost: 0,
  totalCost: 0,
  shoeCostText: '0.00',
  totalCostText: '0.00',
}

const formatMoneyText = (value: number) => {
  const fixed = (Number(value) || 0).toFixed(2)
  const [intPart, decPart] = fixed.split('.')
  const withSeparator = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  return `${withSeparator}.${decPart}`
}

Component({
  data: {
    dashboard: EMPTY_DASHBOARD,
    shoeDashboard: EMPTY_SHOE_DASHBOARD,
    sessionSummary: {
      totalCount: 0,
      monthCount: 0,
    },
    user: null,
    loading: true,
    loadError: false,
    refreshing: false,
    equipmentTotalText: '0.00',
  } as ProfileData,
  pageLifetimes: {
    show() {
      this.refreshDashboard()
    },
  },
  methods: {
    async refreshDashboard(silent = false) {
      if (requireLoginPage()) {
        this.setData({
          refreshing: false,
        })
        return
      }

      if (!silent) {
        this.setData({
          loading: true,
          loadError: false,
        })
      }

      try {
        const [dashboard, shoeDashboard, user] = await Promise.all([
          getRacketStatsFromApi(),
          getShoeStatsFromApi(),
          getCurrentUserFromApi(),
        ])

        let sessionSummary: ProfileSessionSummary = {
          totalCount: 0,
          monthCount: 0,
        }
        try {
          const homeSummary = await getHomeSummaryRemote()
          sessionSummary = {
            totalCount: homeSummary.session.totalCount,
            monthCount: homeSummary.session.monthCount,
          }
        } catch {
          // 累计/本月场次属于补充信息，失败时不影响主体内容展示
        }

        this.setData({
          dashboard,
          shoeDashboard,
          user,
          sessionSummary,
          equipmentTotalText: formatMoneyText(dashboard.totalCost + shoeDashboard.totalCost),
          loading: false,
          loadError: false,
          refreshing: false,
        })
      } catch (error) {
        this.setData({
          loading: false,
          loadError: true,
          refreshing: false,
        })
      }
    },
    onRefresh() {
      this.setData({
        refreshing: true,
      })
      this.refreshDashboard(true)
    },
    retryLoad() {
      this.refreshDashboard()
    },
    goShoes() {
      wx.navigateTo({
        url: '/pages/shoes/shoes',
      })
    },
    goRackets() {
      wx.navigateTo({
        url: '/pages/rackets/rackets',
      })
    },
    goUserProfile() {
      wx.navigateTo({
        url: '/pages/user-profile/user-profile',
      })
    },
    goPrivacy() {
      wx.navigateTo({
        url: '/pages/privacy/privacy',
      })
    },
    onShareAppMessage() {
      return {
        title: '我的网球装备',
        path: '/pages/profile/profile',
      }
    },
    onShareTimeline() {
      return {
        title: '我的网球装备',
      }
    },
  },
})
