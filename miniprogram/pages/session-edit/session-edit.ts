import type { SessionDraft, TennisSessionType } from '../../models/session'
import { createDefaultSessionDraft, getSessionById, saveSession, updateSession } from '../../services/session-service'

interface SessionEditData {
  draft: SessionDraft
  customDuration: string
  isCustomDuration: boolean
  ratingText: string
  ratingTexts: string[]
  sessionId: string
  titleText: string
}

interface InputEvent {
  detail: {
    value: string
  }
}

interface PickerChangeEvent {
  detail: {
    value: string
  }
}

Component({
  data: {
    draft: createDefaultSessionDraft(),
    customDuration: '',
    isCustomDuration: false,
    ratingText: '中规中矩吧',
    ratingTexts: ['网球满天飞', '状态有些迷', '中规中矩吧', '甜区率很高', '今天我是阿卡'],
    sessionId: '',
    titleText: '记录',
  } as SessionEditData,
  pageLifetimes: {
    show() {
      this.loadRouteSession()
    },
  },
  methods: {
    loadRouteSession() {
      const pages = getCurrentPages()
      const currentPage = pages[pages.length - 1] as WechatMiniprogram.Page.Instance<WechatMiniprogram.IAnyObject, WechatMiniprogram.IAnyObject> & {
        options?: {
          id?: string
          date?: string
        }
      }
      const options = currentPage.options || {}

      if (options.id && options.id === this.data.sessionId) {
        return
      }

      if (!options.id && options.date) {
        this.setData({
          'draft.date': options.date,
        })
      }

      if (!options.id) {
        return
      }

      const session = getSessionById(options.id)

      if (!session) {
        return
      }

      this.setData({
        draft: {
          date: session.date,
          durationMinutes: session.durationMinutes,
          rating: session.rating || 3,
          courtName: session.courtName || '',
          partner: session.partner || '',
          type: session.type || '',
          cost: session.cost || 0,
          racketName: session.racketName || '',
          shoeName: session.shoeName || '',
          note: session.note || '',
        },
        ratingText: this.data.ratingTexts[(session.rating || 3) - 1],
        customDuration: session.durationMinutes === 60 || session.durationMinutes === 120 ? '' : `${session.durationMinutes}`,
        isCustomDuration: session.durationMinutes !== 60 && session.durationMinutes !== 120,
        sessionId: options.id,
        titleText: '编辑',
      })
    },
    selectType(event: WechatMiniprogram.TouchEvent) {
      const type = event.currentTarget.dataset.type as TennisSessionType

      this.setData({
        'draft.type': type,
      })
    },
    onDurationInput(event: InputEvent) {
      const duration = Number(event.detail.value) || 0

      this.setData({
        customDuration: event.detail.value,
        'draft.durationMinutes': duration,
      })
    },
    selectSixtyMinutes() {
      this.setData({
        'draft.durationMinutes': 60,
        customDuration: '',
        isCustomDuration: false,
      })
    },
    selectOneTwentyMinutes() {
      this.setData({
        'draft.durationMinutes': 120,
        customDuration: '',
        isCustomDuration: false,
      })
    },
    showCustomDuration() {
      this.setData({
        customDuration: `${this.data.draft.durationMinutes}`,
        isCustomDuration: true,
      })
    },
    selectRating(event: WechatMiniprogram.TouchEvent) {
      const rating = Number(event.currentTarget.dataset.rating) || 3

      this.setData({
        'draft.rating': rating,
        ratingText: this.data.ratingTexts[rating - 1],
      })
    },
    onDateChange(event: PickerChangeEvent) {
      this.setData({
        'draft.date': event.detail.value,
      })
    },
    onCourtInput(event: InputEvent) {
      this.setData({
        'draft.courtName': event.detail.value.trim(),
      })
    },
    onPartnerInput(event: InputEvent) {
      this.setData({
        'draft.partner': event.detail.value.trim(),
      })
    },
    onCostInput(event: InputEvent) {
      this.setData({
        'draft.cost': Number(event.detail.value) || 0,
      })
    },
    onRacketInput(event: InputEvent) {
      this.setData({
        'draft.racketName': event.detail.value.trim(),
      })
    },
    onShoeInput(event: InputEvent) {
      this.setData({
        'draft.shoeName': event.detail.value.trim(),
      })
    },
    submitSession() {
      if (this.data.sessionId) {
        updateSession(this.data.sessionId, this.data.draft)
      } else {
        saveSession(this.data.draft)
      }

      wx.showToast({
        title: this.data.sessionId ? '已保存' : '已记录',
        icon: 'success',
        complete: () => {
          wx.navigateBack()
        },
      })
    },
  },
})
