import { createStringingRecordFromApi } from '../../services/racket-api-service'
import { getTodayText } from '../../services/session-service'

const hourOptions = Array.from({ length: 24 }, (_, index) => `${index}`)

const getCurrentHourText = () => {
  const now = new Date()
  return `${now.getHours()}`
}

interface StringingDraft {
  stringName: string
  verticalTension: number
  horizontalTension: number
  cost: number
  stringDate: string
  stringTime: string
}

interface StringingEditData {
  racketId: number
  racketName: string
  hourOptions: string[]
  hourIndex: number
  verticalTensionText: string
  horizontalTensionText: string
  costText: string
  draft: StringingDraft
  saving: boolean
  horizontalTensionEdited: boolean
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
    racketId: 0,
    racketName: '',
    verticalTensionText: '',
    horizontalTensionText: '',
    costText: '',
    draft: {
      stringName: '',
      verticalTension: 0,
      horizontalTension: 0,
      cost: 0,
      stringDate: getTodayText(),
      stringTime: getCurrentHourText(),
    },
    hourOptions,
    hourIndex: Number(getCurrentHourText()),
    saving: false,
    horizontalTensionEdited: false,
  } as StringingEditData,
  pageLifetimes: {
    show() {
      this.loadRoute()
    },
  },
  methods: {
    loadRoute() {
      const pages = getCurrentPages()
      const currentPage = pages[pages.length - 1] as WechatMiniprogram.Page.Instance<WechatMiniprogram.IAnyObject, WechatMiniprogram.IAnyObject> & {
        options?: {
          id?: string
          name?: string
        }
      }
      const options = currentPage.options || {}
      const racketId = Number(options.id) || 0

      if (!racketId || racketId === this.data.racketId) {
        return
      }

      this.setData({
        racketId,
        racketName: decodeURIComponent(options.name || ''),
      })
    },
    onStringNameInput(event: InputEvent) {
      this.setData({
        'draft.stringName': event.detail.value,
      })
    },
    onVerticalTensionInput(event: InputEvent) {
      const inputValue = event.detail.value
      const verticalTension = Number(inputValue) || 0
      const updateData: WechatMiniprogram.IAnyObject = {
        verticalTensionText: inputValue,
        'draft.verticalTension': verticalTension,
      }

      if (!this.data.horizontalTensionEdited) {
        updateData.horizontalTensionText = inputValue
        updateData['draft.horizontalTension'] = verticalTension
      }

      this.setData(updateData)
    },
    onHorizontalTensionInput(event: InputEvent) {
      const inputValue = event.detail.value
      this.setData({
        horizontalTensionText: inputValue,
        'draft.horizontalTension': Number(inputValue) || 0,
        horizontalTensionEdited: true,
      })
    },
    onCostInput(event: InputEvent) {
      const inputValue = event.detail.value
      this.setData({
        costText: inputValue,
        'draft.cost': Number(inputValue) || 0,
      })
    },
    onDateChange(event: PickerChangeEvent) {
      this.setData({
        'draft.stringDate': event.detail.value,
      })
    },
    onTimeChange(event: PickerChangeEvent) {
      const hourIndex = Number(event.detail.value) || 0
      this.setData({
        hourIndex,
        'draft.stringTime': this.data.hourOptions[hourIndex] || '0',
      })
    },
    async submitStringing() {
      if (!this.data.racketId) {
        wx.showToast({
          title: '球拍不存在',
          icon: 'none',
        })
        return
      }

      const stringHour = this.data.draft.stringTime.padStart(2, '0')
      const draft = {
        ...this.data.draft,
        stringName: this.data.draft.stringName.trim(),
        stringDate: `${this.data.draft.stringDate} ${stringHour}:00`,
      }

      if (!draft.stringName) {
        wx.showToast({
          title: '请填写球线',
          icon: 'none',
        })
        return
      }

      if (this.data.saving) {
        return
      }

      this.setData({
        saving: true,
      })

      try {
        await createStringingRecordFromApi(this.data.racketId, draft)
        wx.showToast({
          title: '已记录',
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
      } finally {
        this.setData({
          saving: false,
        })
      }
    },
  },
})

