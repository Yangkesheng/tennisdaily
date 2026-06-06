import { getCurrentUserFromApi, getToken, loginWithPhone } from '../../services/auth-service'

interface LoginData {
  agreed: boolean
  isLoggingIn: boolean
}

interface PhoneNumberEvent {
  detail: {
    code?: string
    errMsg?: string
  }
}

Component({
  data: {
    agreed: false,
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
        // token 无效时停留登录页，用户重新点击手机号快捷登录
      }
    },
    toggleAgreement() {
      this.setData({
        agreed: !this.data.agreed,
      })
    },
    async onGetPhoneNumber(event: PhoneNumberEvent) {
      console.info('getPhoneNumber detail', event.detail)

      if (!this.data.agreed) {
        wx.showToast({
          title: '请先同意用户协议',
          icon: 'none',
        })
        return
      }

      const { code, errMsg = '' } = event.detail

      if (!code) {
        const title = errMsg.includes('deny') || errMsg.includes('cancel')
          ? '需要同意手机号授权才能登录'
          : errMsg || '手机号授权不可用，请检查微信配置'
        wx.showToast({
          title,
          icon: 'none',
        })
        return
      }

      this.setData({ isLoggingIn: true })

      try {
        await loginWithPhone(code)
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
