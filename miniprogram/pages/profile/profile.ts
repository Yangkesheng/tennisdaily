import type { RacketDashboard } from '../../models/racket'
import { getCurrentUserFromApi, logoutFromApi, requireLoginPage, updateUserProfile, type UserProfile } from '../../services/auth-service'
import { getRacketStatsFromApi } from '../../services/racket-api-service'

interface ChooseAvatarEvent {
  detail: {
    avatarUrl: string
  }
}

interface ProfileData {
  dashboard: RacketDashboard
  user: UserProfile | null
}

const AVATAR_AUTH_TIP_STORAGE_KEY = 'profile_avatar_auth_tip_shown'

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
    handleAvatarTap() {
      if (wx.getStorageSync(AVATAR_AUTH_TIP_STORAGE_KEY)) {
        return
      }

      wx.setStorageSync(AVATAR_AUTH_TIP_STORAGE_KEY, '1')
      wx.showToast({
        title: '请选择微信头像授权',
        icon: 'none',
      })
    },
    async onChooseAvatar(event: ChooseAvatarEvent) {
      const avatarUrl = event.detail.avatarUrl

      if (!avatarUrl) {
        return
      }

      const currentUser = this.data.user
      if (!currentUser) {
        wx.showToast({
          title: '请先登录',
          icon: 'none',
        })
        return
      }

      this.setData({
        user: {
          ...currentUser,
          avatarUrl,
        },
      })

      try {
        const user = await updateUserProfile({
          nickname: currentUser.nickname || '',
          avatarUrl,
        })

        this.setData({
          user,
        })
      } catch (error) {
        this.setData({
          user: currentUser,
        })
        wx.showToast({
          title: error instanceof Error ? error.message : '头像保存失败',
          icon: 'none',
        })
      }
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
