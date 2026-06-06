import { getCurrentUserFromApi, getToken, loginWithWechat } from '../../services/auth-service'

interface LoginData {
  isLoggingIn: boolean
}

Component({
  data: {
    isLoggingIn: false,
  } as LoginData,
  pageLifetimes: {
    show() {
      this.enterHomeIfLoggedIn()
    },
  },
  methods: {
    async enterHomeIfLoggedIn() {
      if (!getToken()) {
        return
      }

      try {
        await getCurrentUserFromApi()
        wx.switchTab({
          url: '/pages/index/index',
        })
      } catch {
        // token 无效时停留登录页，用户重新点击微信快捷登录
      }
    },
    async onLogin() {
      if (this.data.isLoggingIn) {
        return
      }

      this.setData({ isLoggingIn: true })

      try {
        await loginWithWechat()
        wx.showToast({
          title: '登录成功',
          icon: 'success',
        })
        wx.switchTab({
          url: '/pages/index/index',
        })
      } catch (error) {
        wx.showToast({
          title: error instanceof Error ? error.message : '登录失败，请重试',
          icon: 'none',
        })
      } finally {
        this.setData({ isLoggingIn: false })
      }
    },
  },
})
