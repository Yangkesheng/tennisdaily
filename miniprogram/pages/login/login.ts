import { getCurrentUserFromApi, getToken, loginWithWechat, updateUserProfile } from '../../services/auth-service'

interface LoginData {
  isLoggingIn: boolean
  isSavingNickname: boolean
  needsNickname: boolean
  nickname: string
  showNicknameTip: boolean
  nicknameInputFocus: boolean
}

interface NicknameInputEvent {
  detail: {
    value: string
  }
}

Component({
  data: {
    isLoggingIn: false,
    isSavingNickname: false,
    needsNickname: false,
    nickname: '',
    showNicknameTip: false,
    nicknameInputFocus: false,
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
            nicknameInputFocus: true,
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

      this.setData({ isLoggingIn: true })

      try {
        await loginWithWechat()
        const user = await getCurrentUserFromApi()

        if (!user.nickname) {
          this.setData({
            needsNickname: true,
            nickname: '',
            showNicknameTip: true,
            nicknameInputFocus: true,
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
      this.setData({
        nickname: event.detail.value,
        showNicknameTip: false,
        nicknameInputFocus: false,
      })
    },
    async enterWithNickname() {
      if (this.data.isSavingNickname) {
        return
      }

      const nickname = this.data.nickname.trim()
      if (!nickname) {
        this.setData({
          showNicknameTip: true,
          nicknameInputFocus: true,
        })
        wx.showToast({
          title: '请先授权或输入微信昵称',
          icon: 'none',
        })
        return
      }

      this.setData({ isSavingNickname: true })

      try {
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
