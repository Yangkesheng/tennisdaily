import type { RacketDashboard } from '../../models/racket'
import { getCurrentUserFromApi, logoutFromApi, requireLoginPage, type UserProfile } from '../../services/auth-service'
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
    logout() {
      wx.showModal({
        title: '退出登录',
        content: '退出后不会删除已保存的记录，再次登录可继续查看',
        confirmText: '退出',
        success: async (res) => {
          if (!res.confirm) {
            return
          }

          try {
            await logoutFromApi()
          } catch {
            // 即使后端退出失败，也清除本地登录态
          }

          wx.redirectTo({
            url: '/pages/login/login',
          })
        },
      })
    },
  },
})
