import { createStringingRecordFromApi } from '../../services/racket-api-service'
import { getTodayText } from '../../services/session-service'

interface StringingDraft {
  stringName: string
  tension: number
  cost: number
  stringDate: string
}

interface StringingEditData {
  racketId: number
  racketName: string
  draft: StringingDraft
  saving: boolean
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
    draft: {
      stringName: '',
      tension: 0,
      cost: 0,
      stringDate: getTodayText(),
    },
    saving: false,
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
        'draft.stringName': event.detail.value.trim(),
      })
    },
    onTensionInput(event: InputEvent) {
      this.setData({
        'draft.tension': Number(event.detail.value) || 0,
      })
    },
    onCostInput(event: InputEvent) {
      this.setData({
        'draft.cost': Number(event.detail.value) || 0,
      })
    },
    onDateChange(event: PickerChangeEvent) {
      this.setData({
        'draft.stringDate': event.detail.value,
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

      if (!this.data.draft.stringName) {
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
        await createStringingRecordFromApi(this.data.racketId, this.data.draft)
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

