import { ensurePrivacyAuthorized, getCurrentUserFromApi, getToken, loginWithWechat, updateUserProfile } from '../../services/auth-service'

const PRIVACY_ACCEPTED_STORAGE_KEY = 'privacy_policy_accepted'

interface LoginData {
  isLoggingIn: boolean
  isSavingNickname: boolean
  needsNickname: boolean
  nickname: string
  showNicknameTip: boolean
  showPrivacyDialog: boolean
}

interface NicknameInputEvent {
  detail: {
    value: string
  }
}

Component<LoginData, {}, WechatMiniprogram.IAnyObject, { nicknameInputValue: string }>({
  data: {
    isLoggingIn: false,
    isSavingNickname: false,
    needsNickname: false,
    nickname: '',
    showNicknameTip: false,
    showPrivacyDialog: false,
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
        const user = await getCurrentUserFromApi()
        if (!user.nickname) {
          this.setData({
            needsNickname: true,
            nickname: '',
            showNicknameTip: true,
          })
          return
        }

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

      if (wx.getStorageSync(PRIVACY_ACCEPTED_STORAGE_KEY) !== '1') {
        this.setData({
          showPrivacyDialog: true,
        })
        return
      }

      this.setData({ isLoggingIn: true })

      try {
        await loginWithWechat()
        const user = await getCurrentUserFromApi()

        if (!user.nickname) {
          this.setData({
            needsNickname: true,
            nickname: '',
            showNicknameTip: true,
          })
          wx.showToast({
            title: '请设置昵称',
            icon: 'none',
          })
          return
        }

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
    onNicknameInput(event: NicknameInputEvent) {
      this.nicknameInputValue = event.detail.value
      this.setData({ nickname: event.detail.value })
    },
    syncNicknameValue(event: NicknameInputEvent) {
      // 失焦/确认时才一次性同步到 data
      this.nicknameInputValue = event.detail.value
      this.setData({
        nickname: event.detail.value,
        showNicknameTip: false,
      })
    },
    onAcceptPrivacy() {
      this.setData({
        showPrivacyDialog: false,
      })
      this.onLogin()
    },
    onRejectPrivacy() {
      this.setData({
        showPrivacyDialog: false,
      })
      wx.showToast({
        title: '已取消登录，可继续浏览体验',
        icon: 'none',
      })
    },
    backToExperience() {
      wx.switchTab({
        url: '/pages/index/index',
      })
    },
    openPrivacyPolicy() {
      wx.navigateTo({
        url: '/pages/privacy/privacy',
      })
    },
    async enterWithNickname() {
      if (this.data.isSavingNickname) {
        return
      }

      const nickname = (this.nicknameInputValue || this.data.nickname).trim()
      if (!nickname) {
        this.setData({
          showNicknameTip: true,
        })
        wx.showToast({
          title: '请先授权或输入微信昵称',
          icon: 'none',
        })
        return
      }

      this.setData({ isSavingNickname: true })

      try {
        await ensurePrivacyAuthorized()
        await updateUserProfile({
          nickname,
          avatarUrl: '',
        })
        wx.showToast({
          title: '进入成功',
          icon: 'success',
        })
        wx.switchTab({
          url: '/pages/index/index',
        })
      } catch (error) {
        wx.showToast({
          title: error instanceof Error ? error.message : '保存失败，请重试',
          icon: 'none',
        })
      } finally {
        this.setData({ isSavingNickname: false })
      }
    },
  },
})
