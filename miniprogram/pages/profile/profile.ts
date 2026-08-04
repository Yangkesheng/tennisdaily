import type { RacketDashboard } from '../../models/racket'
import { getCurrentUserFromApi, requireLoginPage, type UserProfile } from '../../services/auth-service'
import { getRacketStatsFromApi } from '../../services/racket-api-service'

interface ProfileData {
  dashboard: RacketDashboard
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
    user: null,
  } as ProfileData,
  pageLifetimes: {
    show() {
      this.refreshRackets()
    },
  },
  methods: {
    async refreshRackets() {
      if (requireLoginPage()) {
        return
      }

      try {
        const [dashboard, user] = await Promise.all([getRacketStatsFromApi(), getCurrentUserFromApi()])

        this.setData({
          dashboard,
          user,
        })
      } catch (error) {
        wx.showToast({
          title: error instanceof Error ? error.message : '服务暂时不可用',
          icon: 'none',
        })
      }
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
