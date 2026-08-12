import type { UserSettings } from '../../models/user-settings'
import { requireLoginPage } from '../../services/auth-service'
import { getUserSettingsFromApi, updateUserSettingsFromApi } from '../../services/user-settings-service'

interface SettingsData {
  loading: boolean
  loadFailed: boolean
  defaultCourtName: string
  defaultDurationMinutes: number
  defaultDurationText: string
  showCourtEditor: boolean
  courtDraft: string
  isSavingCourt: boolean
  showDurationEditor: boolean
  durationDraft: string
  isSavingDuration: boolean
}

interface InputEvent {
  detail: {
    value: string
  }
}

const getDurationText = (minutes: number) => {
  if (!minutes) {
    return '未设置（默认 120）'
  }

  return `${minutes} 分钟`
}

const buildView = (settings: UserSettings) => ({
  defaultCourtName: settings.defaultCourtName || '',
  defaultDurationMinutes: settings.defaultDurationMinutes || 0,
  defaultDurationText: getDurationText(settings.defaultDurationMinutes || 0),
})

Page({
  data: {
    loading: true,
    loadFailed: false,
    defaultCourtName: '',
    defaultDurationMinutes: 0,
    defaultDurationText: '未设置（默认 120）',
    showCourtEditor: false,
    courtDraft: '',
    isSavingCourt: false,
    showDurationEditor: false,
    durationDraft: '',
    isSavingDuration: false,
  } as SettingsData,
  courtInputValue: '',
  onShow() {
    this.refreshSettings()
  },
  async refreshSettings() {
    if (requireLoginPage()) {
      return
    }

    this.setData({
      loading: true,
      loadFailed: false,
    })

    try {
      const settings = await getUserSettingsFromApi()
      this.setData({
        ...buildView(settings),
        loading: false,
      })
    } catch (error) {
      this.setData({
        loading: false,
        loadFailed: true,
      })
      wx.showToast({
        title: error instanceof Error ? error.message : '设置加载失败',
        icon: 'none',
      })
    }
  },
  retrySettings() {
    this.refreshSettings()
  },
  openCourtEditor() {
    this.courtInputValue = this.data.defaultCourtName
    this.setData({
      courtDraft: this.data.defaultCourtName,
      showCourtEditor: true,
    })
  },
  closeCourtEditor() {
    if (this.data.isSavingCourt) {
      return
    }

    this.setData({
      showCourtEditor: false,
    })
  },
  onCourtInput(event: InputEvent) {
    this.courtInputValue = event.detail.value
    this.setData({ courtDraft: event.detail.value })
  },
  syncCourtValue(event: InputEvent) {
    this.courtInputValue = event.detail.value
    this.setData({ courtDraft: event.detail.value })
  },
  async saveCourt() {
    if (this.data.isSavingCourt) {
      return
    }

    const courtName = (this.courtInputValue || this.data.courtDraft).trim()
    this.setData({ isSavingCourt: true })

    try {
      const settings = await updateUserSettingsFromApi({ defaultCourtName: courtName })
      this.setData({
        ...buildView(settings),
        showCourtEditor: false,
      })
      this.courtInputValue = settings.defaultCourtName || ''
      wx.showToast({
        title: '已保存',
        icon: 'success',
      })
    } catch (error) {
      wx.showToast({
        title: error instanceof Error ? error.message : '保存失败',
        icon: 'none',
      })
    } finally {
      this.setData({ isSavingCourt: false })
    }
  },
  openDurationEditor() {
    this.setData({
      durationDraft: this.data.defaultDurationMinutes ? `${this.data.defaultDurationMinutes}` : '',
      showDurationEditor: true,
    })
  },
  closeDurationEditor() {
    if (this.data.isSavingDuration) {
      return
    }

    this.setData({
      showDurationEditor: false,
    })
  },
  selectDurationPreset(event: WechatMiniprogram.TouchEvent) {
    const preset = Number(event.currentTarget.dataset.minutes)
    this.setData({
      durationDraft: `${preset}`,
    })
  },
  selectDurationNone() {
    this.setData({
      durationDraft: '',
    })
  },
  onDurationInput(event: InputEvent) {
    this.setData({
      durationDraft: event.detail.value,
    })
  },
  async saveDuration() {
    if (this.data.isSavingDuration) {
      return
    }

    const minutes = Number(this.data.durationDraft) || 0
    if (minutes !== 0 && (!Number.isInteger(minutes) || minutes < 30 || minutes > 600)) {
      wx.showToast({
        title: '时长需为 30~600 的整数分钟',
        icon: 'none',
      })
      return
    }

    this.setData({ isSavingDuration: true })

    try {
      const settings = await updateUserSettingsFromApi({ defaultDurationMinutes: minutes })
      this.setData({
        ...buildView(settings),
        showDurationEditor: false,
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
    } finally {
      this.setData({ isSavingDuration: false })
    }
  },
  noop() {},
})
