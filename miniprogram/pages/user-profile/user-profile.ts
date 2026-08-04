import { getCurrentUserFromApi, logoutFromApi, requireLoginPage, updateUserProfile, type UserProfile } from '../../services/auth-service'
import { deleteAvatarFromCloudStorage, prepareAvatarForUpload, uploadAvatarToCloudStorage } from '../../services/avatar-upload-service'

interface ChooseMediaSuccessResult {
  tempFiles: Array<{
    tempFilePath: string
    size: number
  }>
}

interface NicknameInputEvent {
  detail: {
    value: string
  }
}

interface UserProfileData {
  isSavingAvatar: boolean
  isSavingNickname: boolean
  nicknameDraft: string
  avatarSrc: string
  showNicknameEditor: boolean
  nicknameInputFocus: boolean
  user: UserProfile | null
}

const isCloudFileId = (value: string) => value.startsWith('cloud://')

Page({
  data: {
    isSavingAvatar: false,
    isSavingNickname: false,
    nicknameDraft: '',
    avatarSrc: '',
    showNicknameEditor: false,
    nicknameInputFocus: false,
    user: null,
  } as UserProfileData,
  refreshSeq: 0,
  onShow() {
    this.refreshUser()
  },
  async refreshUser() {
    if (requireLoginPage()) {
      return
    }

    if (this.data.isSavingAvatar) {
      return
    }

    const seq = ++this.refreshSeq
    try {
      const user = await getCurrentUserFromApi()
      if (seq !== this.refreshSeq) {
        return
      }
      this.setData({
        nicknameDraft: user.nickname || '',
        avatarSrc: user.avatarUrl || '',
        user,
      })
    } catch (error) {
      wx.showToast({
        title: error instanceof Error ? error.message : '个人信息加载失败',
        icon: 'none',
      })
    }
  },
  openNicknameEditor() {
    const currentUser = this.data.user
    if (!currentUser) {
      wx.showToast({
        title: '请先登录',
        icon: 'none',
      })
      return
    }

    this.setData({
      nicknameDraft: currentUser.nickname || '',
      showNicknameEditor: true,
      nicknameInputFocus: true,
    })
  },
  closeNicknameEditor() {
    if (this.data.isSavingNickname) {
      return
    }

    this.setData({
      showNicknameEditor: false,
      nicknameInputFocus: false,
    })
  },
  noop() {},
  onNicknameInput(event: NicknameInputEvent) {
    this.setData({ nicknameDraft: event.detail.value })
  },
  async saveNickname() {
    if (this.data.isSavingNickname) {
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

    const nickname = this.data.nicknameDraft.trim()
    if (!nickname) {
      wx.showToast({
        title: '请输入昵称',
        icon: 'none',
      })
      return
    }

    if (nickname === currentUser.nickname) {
      wx.showToast({
        title: '昵称未变化',
        icon: 'none',
      })
      return
    }

    this.setData({ isSavingNickname: true })

    try {
      const user = await updateUserProfile({
        nickname,
        avatarUrl: currentUser.avatarUrl || '',
      })

      this.setData({
        nicknameDraft: user.nickname || '',
        showNicknameEditor: false,
        nicknameInputFocus: false,
        user,
      })
      wx.showToast({
        title: '昵称已保存',
        icon: 'success',
      })
    } catch (error) {
      wx.showToast({
        title: error instanceof Error ? error.message : '昵称保存失败',
        icon: 'none',
      })
    } finally {
      this.refreshSeq += 1
      this.setData({ isSavingNickname: false })
    }
  },
  async onAvatarTap() {
    if (this.data.isSavingAvatar) {
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

    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: async (result: ChooseMediaSuccessResult) => {
        const file = result.tempFiles[0]
        if (!file?.tempFilePath) {
          return
        }

        const previousAvatarUrl = currentUser.avatarUrl

        this.setData({
          isSavingAvatar: true,
          avatarSrc: file.tempFilePath,
        })

        try {
          const filePath = await prepareAvatarForUpload(file.tempFilePath, file.size)

          const uploadedAvatarUrl = await uploadAvatarToCloudStorage(filePath)
          const user = await updateUserProfile({
            nickname: currentUser.nickname || '',
            avatarUrl: uploadedAvatarUrl,
          })

          this.setData({
            nicknameDraft: user.nickname || '',
            user,
          })

          if (previousAvatarUrl && previousAvatarUrl !== uploadedAvatarUrl && isCloudFileId(previousAvatarUrl)) {
            deleteAvatarFromCloudStorage(previousAvatarUrl).catch((error) => {
              console.error('delete avatar failed', error)
            })
          }
        } catch (error) {
          this.setData({
            avatarSrc: currentUser.avatarUrl || '',
            user: currentUser,
          })
          wx.showToast({
            title: error instanceof Error ? error.message : '头像保存失败',
            icon: 'none',
          })
        } finally {
          this.refreshSeq += 1
          this.setData({ isSavingAvatar: false })
        }
      },
      fail: () => {
        wx.showToast({
          title: '已取消选择',
          icon: 'none',
        })
      },
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
})
