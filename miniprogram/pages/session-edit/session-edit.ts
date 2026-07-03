import type { MatchRank, SessionCategory, SessionDraft, SessionSubCategory } from '../../models/session'
import {
  SESSION_CATEGORY_OPTIONS,
  SESSION_SUB_CATEGORY_OPTIONS,
  getDefaultSubCategory,
  getSessionTypeFromCategory,
  isMatchCategory,
} from '../../models/session'
import type { Racket } from '../../models/racket'
import { listMyRacketsFromApi } from '../../services/racket-api-service'
import {
  createDefaultSessionDraft,
  createSessionStartText,
  getCurrentTimeText,
  getSessionDateText,
  getSessionTimeText,
  getSessionByIdFromApi,
  saveSessionToApi,
  updateSessionToApi,
} from '../../services/session-service'

interface SessionEditData {
  draft: SessionDraft
  startDate: string
  startTime: string
  hourOptions: string[]
  hourIndex: number
  minuteOptions: string[]
  minuteIndex: number
  minuteInput: string
  costInput: string
  customDuration: string
  isCustomDuration: boolean
  isMatchType: boolean
  isPageReady: boolean
  ratingText: string
  ratingTexts: string[]
  saving: boolean
  sessionId: string
  categoryOptions: typeof SESSION_CATEGORY_OPTIONS
  subCategoryOptions: typeof SESSION_SUB_CATEGORY_OPTIONS[SessionCategory]
  titleText: string
  selectableRackets: Racket[]
  racketNames: string[]
  racketPickerIndex: number
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

const getRacketPickerIndex = (rackets: Racket[], racketId: number) => {
  return rackets.findIndex((racket) => racket.id === racketId)
}

const getRacketPickerNames = (rackets: Racket[], selectedRacketId: number) => {
  return rackets.map((racket) => {
    const name = getRacketDisplayName(racket)

    return racket.id === selectedRacketId ? `${name} ✓` : name
  })
}

const getPrimaryRacket = (rackets: Racket[]) => {
  return rackets.find((racket) => racket.status === 1) || null
}

const defaultDraft = createDefaultSessionDraft()
const hourOptions = Array.from({ length: 24 }, (_, index) => `${index}`.padStart(2, '0'))
const minuteOptions = ['00', '15', '30', '45']

const getHourText = (timeText: string) => {
  return (timeText || getCurrentTimeText()).slice(0, 2)
}

const getMinuteText = (timeText: string) => {
  return (timeText || getCurrentTimeText()).slice(3, 5)
}

const getHourIndex = (timeText: string) => {
  return Math.max(0, hourOptions.indexOf(getHourText(timeText)))
}

const getMinuteIndex = (timeText: string) => {
  return Math.max(0, minuteOptions.indexOf(getMinuteText(timeText)))
}

const createTimeText = (hourText: string, minuteText: string) => {
  const hour = `${Number(hourText) || 0}`.padStart(2, '0')
  const minuteNumber = Math.min(59, Math.max(0, Number(minuteText) || 0))
  const minute = `${minuteNumber}`.padStart(2, '0')

  return `${hour}:${minute}`
}

const createTimeState = (timeText: string) => {
  return {
    startTime: timeText,
    hourIndex: getHourIndex(timeText),
    minuteIndex: getMinuteIndex(timeText),
    minuteInput: getMinuteText(timeText),
  }
}

const createTypeState = (draft: SessionDraft) => {
  return {
    subCategoryOptions: SESSION_SUB_CATEGORY_OPTIONS[draft.category],
    isMatchType: isMatchCategory(draft.category),
  }
}

Page({
  data: {
    draft: defaultDraft,
    startDate: getSessionDateText(defaultDraft.date),
    ...createTimeState(getSessionTimeText(defaultDraft.date)),
    hourOptions,
    minuteOptions,
    costInput: '',
    customDuration: '',
    isCustomDuration: false,
    isMatchType: false,
    isPageReady: false,
    ratingText: '中规中矩吧',
    ratingTexts: ['网球满天飞', '状态有些迷', '中规中矩吧', '甜区率很高', '今天我是阿卡'],
    saving: false,
    sessionId: '',
    categoryOptions: SESSION_CATEGORY_OPTIONS,
    subCategoryOptions: SESSION_SUB_CATEGORY_OPTIONS[defaultDraft.category],
    titleText: '记录',
    selectableRackets: [],
    racketNames: [],
    racketPickerIndex: -1,
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
      const shouldUsePrimaryRacket = !this.data.sessionId && !this.data.draft.racketId
      const primaryRacket = shouldUsePrimaryRacket ? getPrimaryRacket(rackets) : null
      const selectedRacketId = primaryRacket ? primaryRacket.id : this.data.draft.racketId
      const selectedRacketName = primaryRacket ? getRacketDisplayName(primaryRacket) : this.data.draft.racketName
      const racketPickerIndex = getRacketPickerIndex(rackets, selectedRacketId)

      this.setData({
        selectableRackets: rackets,
        racketNames: getRacketPickerNames(rackets, selectedRacketId),
        racketPickerIndex,
        'draft.racketId': selectedRacketId,
        'draft.racketName': selectedRacketName,
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

      const startTime = getCurrentTimeText()

      this.setData({
        draft: {
          ...draft,
          date: createSessionStartText(options.date, startTime),
        },
        startDate: options.date,
        ...createTimeState(startTime),
        costInput: '',
        customDuration: '',
        isCustomDuration: false,
        ...createTypeState(draft),
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
        startDate: getSessionDateText(draft.date),
        ...createTimeState(getSessionTimeText(draft.date)),
        costInput: '',
        customDuration: '',
        isCustomDuration: false,
        ...createTypeState(draft),
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
          category: session.category,
          subCategory: session.subCategory,
          matchRank: session.matchRank || '',
          cost: session.cost || 0,
          racketId: session.racketId || 0,
          racketName: session.racketName || '',
          shoeName: session.shoeName || '',
          note: session.note || '',
        },
        startDate: getSessionDateText(session.date),
        ...createTimeState(getSessionTimeText(session.date)),
        ratingText: this.data.ratingTexts[(session.rating || 3) - 1],
        costInput: session.cost ? `${session.cost}` : '',
        customDuration: session.durationMinutes === 60 || session.durationMinutes === 120 ? '' : `${session.durationMinutes}`,
        isCustomDuration: session.durationMinutes !== 60 && session.durationMinutes !== 120,
        subCategoryOptions: SESSION_SUB_CATEGORY_OPTIONS[session.category],
        isMatchType: isMatchCategory(session.category),
        isPageReady: true,
        sessionId: options.id,
        titleText: '编辑',
    })
  },
  selectCategory(event: WechatMiniprogram.TouchEvent) {
      const category = Number(event.currentTarget.dataset.category) as SessionCategory
      const subCategory = getDefaultSubCategory(category)
      const isMatchType = isMatchCategory(category)

      this.setData({
        'draft.category': category,
        'draft.subCategory': subCategory,
        'draft.type': getSessionTypeFromCategory(category, subCategory),
        'draft.matchRank': isMatchType ? this.data.draft.matchRank : '',
        subCategoryOptions: SESSION_SUB_CATEGORY_OPTIONS[category],
        isMatchType,
      })
    },
    selectSubCategory(event: WechatMiniprogram.TouchEvent) {
      const subCategory = Number(event.currentTarget.dataset.subCategory) as SessionSubCategory
      const category = this.data.draft.category

      this.setData({
        'draft.subCategory': subCategory,
        'draft.type': getSessionTypeFromCategory(category, subCategory),
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
      const startDate = event.detail.value

      this.setData({
        startDate,
        'draft.date': createSessionStartText(startDate, this.data.startTime),
      })
    },
    onHourChange(event: PickerChangeEvent) {
      const hourIndex = Number(event.detail.value) || 0
      const startTime = createTimeText(this.data.hourOptions[hourIndex] || '00', this.data.minuteInput)

      this.setData({
        ...createTimeState(startTime),
        'draft.date': createSessionStartText(this.data.startDate, startTime),
      })
    },
    onMinuteChange(event: PickerChangeEvent) {
      const minuteIndex = Number(event.detail.value) || 0
      const minuteInput = this.data.minuteOptions[minuteIndex] || '00'
      const startTime = createTimeText(getHourText(this.data.startTime), minuteInput)

      this.setData({
        ...createTimeState(startTime),
        'draft.date': createSessionStartText(this.data.startDate, startTime),
      })
    },
    onMinuteInput(event: InputEvent) {
      const minuteInput = event.detail.value.slice(0, 2)
      const startTime = createTimeText(getHourText(this.data.startTime), minuteInput)

      this.setData({
        startTime,
        minuteInput,
        minuteIndex: getMinuteIndex(startTime),
        'draft.date': createSessionStartText(this.data.startDate, startTime),
      })
    },
    onCourtInput(event: InputEvent) {
      this.setData({
        'draft.courtName': event.detail.value,
      })
    },
    onPartnerInput(event: InputEvent) {
      this.setData({
        'draft.partner': event.detail.value,
      })
    },
    onCostInput(event: InputEvent) {
      this.setData({
        costInput: event.detail.value,
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
        racketNames: getRacketPickerNames(this.data.selectableRackets, racket.id),
        racketPickerIndex: index,
      })
    },
    onShoeInput(event: InputEvent) {
      this.setData({
        'draft.shoeName': event.detail.value,
      })
    },
  async submitSession() {
    if (this.data.saving) {
      return
    }

    this.setData({
      saving: true,
    })

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
      this.setData({
        saving: false,
      })
      wx.showToast({
        title: error instanceof Error ? error.message : '保存失败',
        icon: 'none',
      })
    }
  },
})
