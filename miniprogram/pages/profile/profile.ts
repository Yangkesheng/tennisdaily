import type { RacketDashboard } from '../../models/racket'
import type { ShoeStats } from '../../models/shoe'
import { getCurrentUserFromApi, requireLoginPage, type UserProfile } from '../../services/auth-service'
import { getRacketStatsFromApi } from '../../services/racket-api-service'
import { getShoeStatsFromApi } from '../../services/shoe-api-service'

interface ProfileData {
  dashboard: RacketDashboard
  shoeDashboard: ShoeStats
  user: UserProfile | null
}

Component({
  data: {
    dashboard: {
      racketCount: 0,
      racketCost: 0,
      stringingCost: 0,
      totalCost: 0,
      racketCostText: '0.00',
      stringingCostText: '0.00',
      totalCostText: '0.00',
    },
    shoeDashboard: {
      shoeCount: 0,
      shoeCost: 0,
      totalCost: 0,
      shoeCostText: '0.00',
      totalCostText: '0.00',
    },
    user: null,
  } as ProfileData,
  pageLifetimes: {
    show() {
      this.refreshDashboard()
    },
  },
  methods: {
    async refreshDashboard() {
      if (requireLoginPage()) {
        return
      }

      try {
        const [dashboard, shoeDashboard, user] = await Promise.all([
          getRacketStatsFromApi(),
          getShoeStatsFromApi(),
          getCurrentUserFromApi(),
        ])

        this.setData({
          dashboard,
          shoeDashboard,
          user,
        })
      } catch (error) {
        wx.showToast({
          title: error instanceof Error ? error.message : '服务暂时不可用',
          icon: 'none',
        })
      }
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
