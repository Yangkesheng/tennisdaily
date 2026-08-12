import { ensurePrivacyAuthorized, getCurrentUserFromApi, logoutFromApi, requireLoginPage, updateUserProfile, type UserProfile } from '../../services/auth-service'
import { deleteAvatarFromCloudStorage, prepareAvatarForUpload, uploadAvatarToCloudStorage } from '../../services/avatar-upload-service'
import { getUserSettingsFromApi, updateUserSettingsFromApi } from '../../services/user-settings-service'

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

interface StartDateColumnChangeEvent {
  detail: {
    column: number
    value: number
  }
}

interface StartDateChangeEvent {
  detail: {
    value: number[]
  }
}

interface UserProfileData {
  isSavingAvatar: boolean
  isSavingNickname: boolean
  isSavingSignature: boolean
  isSavingStartDate: boolean
  nicknameDraft: string
  signature: string
  signatureDraft: string
  showNicknameEditor: boolean
  showSignatureEditor: boolean
  startDateValue: number
  startDateText: string
  startYearOptions: string[]
  startMonthOptions: string[]
  startYearIndex: number
  startMonthIndex: number
  avatarSrc: string
  user: UserProfile | null
}

const START_YEAR = 1960

const getStartYearOptions = (currentYear: number) => {
  const options: string[] = ['未设置']
  for (let year = currentYear; year >= START_YEAR; year -= 1) {
    options.push(`${year}`)
  }
  return options
}

const getStartMonthOptions = () => {
  return Array.from({ length: 12 }, (_, index) => `${index + 1}月`)
}

const getStartDateText = (value: number) => {
  if (!value || value < 190000) {
    return '未设置'
  }

  const year = Math.floor(value / 100)
  const month = value % 100
  return `${year}年${month}月`
}

const resolveStartIndexes = (value: number, yearOptions: string[]) => {
  if (!value || value < 190000) {
    return { yearIndex: 0, monthIndex: 0 }
  }

  const year = Math.floor(value / 100)
  const month = value % 100
  const yearIndex = yearOptions.indexOf(`${year}`)
  return {
    yearIndex: yearIndex >= 0 ? yearIndex : 0,
    monthIndex: Math.max(0, Math.min(11, month - 1)),
  }
}

const isCloudFileId = (value: string) => value.startsWith('cloud://')

Page({
  data: {
    isSavingAvatar: false,
    isSavingNickname: false,
    isSavingSignature: false,
    isSavingStartDate: false,
    nicknameDraft: '',
    signature: '',
    signatureDraft: '',
    showNicknameEditor: false,
    showSignatureEditor: false,
    startDateValue: 0,
    startDateText: '未设置',
    startYearOptions: [],
    startMonthOptions: getStartMonthOptions(),
    startYearIndex: 0,
    startMonthIndex: 0,
    avatarSrc: '',
    user: null,
  } as UserProfileData,
  refreshSeq: 0,
  nicknameInputValue: '',
  signatureInputValue: '',
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
      const [user, settings] = await Promise.all([
        getCurrentUserFromApi(),
        getUserSettingsFromApi(),
      ])
      if (seq !== this.refreshSeq) {
        return
      }

      const yearOptions = getStartYearOptions(new Date().getFullYear())
      const { yearIndex, monthIndex } = resolveStartIndexes(user.startPlayingDate || 0, yearOptions)

      this.setData({
        nicknameDraft: user.nickname || '',
        avatarSrc: user.avatarUrl || '',
        signature: settings.signature || '',
        startDateValue: user.startPlayingDate || 0,
        startDateText: getStartDateText(user.startPlayingDate || 0),
        startYearOptions: yearOptions,
        startYearIndex: yearIndex,
        startMonthIndex: monthIndex,
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

    this.nicknameInputValue = currentUser.nickname || ''
    this.setData({
      nicknameDraft: currentUser.nickname || '',
      showNicknameEditor: true,
    })
  },
  closeNicknameEditor() {
    if (this.data.isSavingNickname) {
      return
    }

    this.setData({
      showNicknameEditor: false,
    })
  },
  noop() {},
  onNicknameInput(event: NicknameInputEvent) {
    this.nicknameInputValue = event.detail.value
    this.setData({ nicknameDraft: event.detail.value })
  },
  syncNicknameValue(event: NicknameInputEvent) {
    this.nicknameInputValue = event.detail.value
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

    const nickname = (this.nicknameInputValue || this.data.nicknameDraft).trim()
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
      await ensurePrivacyAuthorized()
      const user = await updateUserProfile({
        nickname,
        avatarUrl: currentUser.avatarUrl || '',
      })

      this.setData({
        nicknameDraft: user.nickname || '',
        showNicknameEditor: false,
        user,
      })
      this.nicknameInputValue = user.nickname || ''
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
  openSignatureEditor() {
    const currentUser = this.data.user
    if (!currentUser) {
      wx.showToast({
        title: '请先登录',
        icon: 'none',
      })
      return
    }

    this.signatureInputValue = this.data.signature
    this.setData({
      signatureDraft: this.data.signature,
      showSignatureEditor: true,
    })
  },
  closeSignatureEditor() {
    if (this.data.isSavingSignature) {
      return
    }

    this.setData({
      showSignatureEditor: false,
    })
  },
  onSignatureInput(event: NicknameInputEvent) {
    this.signatureInputValue = event.detail.value
    this.setData({ signatureDraft: event.detail.value })
  },
  syncSignatureValue(event: NicknameInputEvent) {
    this.signatureInputValue = event.detail.value
    this.setData({ signatureDraft: event.detail.value })
  },
  async saveSignature() {
    if (this.data.isSavingSignature) {
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

    const signature = (this.signatureInputValue || this.data.signatureDraft).trim()
    this.setData({ isSavingSignature: true })

    try {
      await ensurePrivacyAuthorized()
      const settings = await updateUserSettingsFromApi({ signature })
      this.setData({
        signature: settings.signature || '',
        showSignatureEditor: false,
      })
      this.signatureInputValue = settings.signature || ''
      wx.showToast({
        title: '签名已保存',
        icon: 'success',
      })
    } catch (error) {
      wx.showToast({
        title: error instanceof Error ? error.message : '签名保存失败',
        icon: 'none',
      })
    } finally {
      this.refreshSeq += 1
      this.setData({ isSavingSignature: false })
    }
  },
  onStartDateColumnChange(event: StartDateColumnChangeEvent) {
    if (event.detail.column === 0) {
      this.setData({ startYearIndex: event.detail.value })
    } else {
      this.setData({ startMonthIndex: event.detail.value })
    }
  },
  onStartDateChange(event: StartDateChangeEvent) {
    const [yearIndex, monthIndex] = event.detail.value
    const yearOption = this.data.startYearOptions[yearIndex] || '未设置'
    const dateValue = yearOption === '未设置' ? 0 : Number(yearOption) * 100 + monthIndex + 1

    this.setData({
      startYearIndex: yearIndex,
      startMonthIndex: monthIndex,
    })
    this.saveStartDate(dateValue)
  },
  async saveStartDate(dateValue: number) {
    if (this.data.isSavingStartDate) {
      return
    }

    const currentUser = this.data.user
    if (!currentUser) {
      return
    }

    this.setData({ isSavingStartDate: true })

    try {
      const user = await updateUserProfile({
        nickname: currentUser.nickname || '',
        avatarUrl: currentUser.avatarUrl || '',
        startPlayingDate: dateValue,
      })

      this.setData({
        startDateValue: user.startPlayingDate || 0,
        startDateText: getStartDateText(user.startPlayingDate || 0),
        user,
      })
      wx.showToast({
        title: '已保存',
        icon: 'success',
      })
    } catch (error) {
      wx.showToast({
        title: error instanceof Error ? error.message : '保存失败',
        icon: 'none',
      })
      const { yearIndex, monthIndex } = resolveStartIndexes(this.data.startDateValue, this.data.startYearOptions)
      this.setData({
        startYearIndex: yearIndex,
        startMonthIndex: monthIndex,
      })
    } finally {
      this.refreshSeq += 1
      this.setData({ isSavingStartDate: false })
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
          this.nicknameInputValue = user.nickname || ''

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
