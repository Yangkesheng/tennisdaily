import type { RacketDraft } from '../../models/racket'
import { createRacketFromApi } from '../../services/racket-api-service'
import { getTodayText } from '../../services/session-service'

interface RacketEditData {
  draft: RacketDraft
  hasSelectedLibrary: boolean
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

const createDefaultDraft = (): RacketDraft => {
  return {
    libraryId: 0,
    name: '',
    brand: '',
    model: '',
    status: 2,
    imageUrl: '',
    weight: 0,
    headSize: 0,
    purchaseDate: getTodayText(),
    purchasePrice: 0,
    stringName: '',
    tension: 0,
    lastStringDate: '',
    lastStringCost: 0,
  }
}

Component({
  data: {
    draft: createDefaultDraft(),
    hasSelectedLibrary: false,
    saving: false,
  } as RacketEditData,
  pageLifetimes: {
    show() {
      this.loadSelectedLibrary()
    },
  },
  methods: {
    loadSelectedLibrary() {
      const pages = getCurrentPages()
      const currentPage = pages[pages.length - 1] as WechatMiniprogram.Page.Instance<WechatMiniprogram.IAnyObject, WechatMiniprogram.IAnyObject> & {
        options?: {
          libraryId?: string
          brand?: string
          model?: string
          imageUrl?: string
          weight?: string
          headSize?: string
        }
      }
      const options = currentPage.options || {}
      const libraryId = Number(options.libraryId) || 0

      if (!libraryId || libraryId === this.data.draft.libraryId) {
        return
      }

      this.setData({
        hasSelectedLibrary: true,
        'draft.libraryId': libraryId,
        'draft.name': decodeURIComponent(options.model || ''),
        'draft.brand': decodeURIComponent(options.brand || ''),
        'draft.model': decodeURIComponent(options.model || ''),
        'draft.imageUrl': decodeURIComponent(options.imageUrl || ''),
        'draft.weight': Number(options.weight) || 0,
        'draft.headSize': Number(options.headSize) || 0,
      })
    },
    onNameInput(event: InputEvent) {
      this.setData({
        'draft.name': event.detail.value.trim(),
      })
    },
    onBrandInput(event: InputEvent) {
      this.setData({
        'draft.brand': event.detail.value.trim(),
      })
    },
    onModelInput(event: InputEvent) {
      this.setData({
        'draft.model': event.detail.value.trim(),
      })
    },
    onPurchaseDateChange(event: PickerChangeEvent) {
      this.setData({
        'draft.purchaseDate': event.detail.value,
      })
    },
    onWeightInput(event: InputEvent) {
      this.setData({
        'draft.weight': Number(event.detail.value) || 0,
      })
    },
    onHeadSizeInput(event: InputEvent) {
      this.setData({
        'draft.headSize': Number(event.detail.value) || 0,
      })
    },
    onPurchasePriceInput(event: InputEvent) {
      this.setData({
        'draft.purchasePrice': Number(event.detail.value) || 0,
      })
    },
    async submitRacket() {
      if (!this.data.draft.name) {
        wx.showToast({
          title: '请填写名称',
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
        await createRacketFromApi(this.data.draft)
        wx.showToast({
          title: '已添加',
          icon: 'success',
          complete: () => {
            wx.navigateBack()
          },
        })
      } catch (error) {
        wx.showToast({
          title: error instanceof Error ? error.message : '添加失败',
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
