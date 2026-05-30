import type { MatchRank, SessionDraft, TennisSessionType } from '../../models/session'
import type { Racket } from '../../models/racket'
import { listMyRacketsFromApi } from '../../services/racket-api-service'
import {
  createDefaultSessionDraft,
  getSessionByIdFromApi,
  saveSessionToApi,
  updateSessionToApi,
} from '../../services/session-service'

interface SessionEditData {
  draft: SessionDraft
  customDuration: string
  isCustomDuration: boolean
  isMatchType: boolean
  isPageReady: boolean
  ratingText: string
  ratingTexts: string[]
  sessionId: string
  titleText: string
  selectableRackets: Racket[]
  racketNames: string[]
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

const getRacketDisplayName = (racket: Racket) => {
  return racket.name || racket.model || racket.brand || '未命名球拍'
}

Page({
  data: {
    draft: createDefaultSessionDraft(),
    customDuration: '',
    isCustomDuration: false,
    isMatchType: false,
    isPageReady: false,
    ratingText: '中规中矩吧',
    ratingTexts: ['网球满天飞', '状态有些迷', '中规中矩吧', '甜区率很高', '今天我是阿卡'],
    sessionId: '',
    titleText: '记录',
    selectableRackets: [],
    racketNames: [],
  } as SessionEditData,
  onLoad(options: { id?: string; date?: string }) {
    this.loadRouteSession(options)
  },
  onShow() {
    this.loadSelectableRackets()
    if (!this.data.isPageReady) {
      this.loadRouteSession()
    }
  },
  async loadSelectableRackets() {
    try {
      const rackets = await listMyRacketsFromApi()
      this.setData({
        selectableRackets: rackets,
        racketNames: rackets.map(getRacketDisplayName),
      })
    } catch (error) {
      wx.showToast({
        title: error instanceof Error ? error.message : '球拍加载失败',
        icon: 'none',
      })
    }
  },
  async loadRouteSession(routeOptions?: { id?: string; date?: string }) {
    const options = routeOptions || {}

    if (options.id && options.id === this.data.sessionId && this.data.isPageReady) {
      return
    }

    if (!options.id && this.data.isPageReady && !this.data.sessionId) {
      return
    }

    this.setData({
      isPageReady: false,
    })

    if (!options.id && options.date) {
      const draft = createDefaultSessionDraft()

      this.setData({
        draft: {
          ...draft,
          date: options.date,
        },
        customDuration: '',
        isCustomDuration: false,
        isMatchType: draft.type === 'singlesMatch' || draft.type === 'doublesMatch',
        isPageReady: true,
        ratingText: this.data.ratingTexts[draft.rating - 1],
        sessionId: '',
        titleText: '记录',
      })

      return
    }

    if (!options.id) {
      const draft = createDefaultSessionDraft()

      this.setData({
        draft,
        customDuration: '',
        isCustomDuration: false,
        isMatchType: draft.type === 'singlesMatch' || draft.type === 'doublesMatch',
        isPageReady: true,
        ratingText: this.data.ratingTexts[draft.rating - 1],
        sessionId: '',
        titleText: '记录',
      })

      return
    }

    let session = null

    try {
      session = await getSessionByIdFromApi(options.id)
    } catch (error) {
      wx.showToast({
        title: error instanceof Error ? error.message : '记录加载失败',
        icon: 'none',
      })
      return
    }

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
          matchRank: session.matchRank || '',
          cost: session.cost || 0,
          racketId: session.racketId || 0,
          racketName: session.racketName || '',
          shoeName: session.shoeName || '',
          note: session.note || '',
        },
        ratingText: this.data.ratingTexts[(session.rating || 3) - 1],
        customDuration: session.durationMinutes === 60 || session.durationMinutes === 120 ? '' : `${session.durationMinutes}`,
        isCustomDuration: session.durationMinutes !== 60 && session.durationMinutes !== 120,
        isMatchType: session.type === 'singlesMatch' || session.type === 'doublesMatch',
        isPageReady: true,
        sessionId: options.id,
        titleText: '编辑',
    })
  },
  selectType(event: WechatMiniprogram.TouchEvent) {
      const type = event.currentTarget.dataset.type as TennisSessionType
      const isMatchType = type === 'singlesMatch' || type === 'doublesMatch'

      this.setData({
        'draft.type': type,
        'draft.matchRank': isMatchType ? this.data.draft.matchRank : '',
        isMatchType,
      })
    },
    selectMatchRank(event: WechatMiniprogram.TouchEvent) {
      const rank = event.currentTarget.dataset.rank as MatchRank

      this.setData({
        'draft.matchRank': rank,
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
    onRacketChange(event: PickerChangeEvent) {
      const index = Number(event.detail.value)
      const racket = this.data.selectableRackets[index]

      if (!racket) {
        return
      }

      this.setData({
        'draft.racketId': racket.id,
        'draft.racketName': getRacketDisplayName(racket),
      })
    },
    onShoeInput(event: InputEvent) {
      this.setData({
        'draft.shoeName': event.detail.value.trim(),
      })
    },
  async submitSession() {
    try {
      if (this.data.sessionId) {
        await updateSessionToApi(this.data.sessionId, this.data.draft)
      } else {
        await saveSessionToApi(this.data.draft)
      }

      wx.showToast({
        title: this.data.sessionId ? '已保存' : '已记录',
        icon: 'success',
        complete: () => {
          wx.navigateBack()
        },
      })
    } catch (error) {
      wx.showToast({
        title: error instanceof Error ? error.message : '保存失败',
        icon: 'none',
      })
    }
  },
})
