import type { RacketDraft } from '../../models/racket'
import { createRacketFromApi, getRacketDetailFromApi, updateRacketFromApi } from '../../services/racket-api-service'
import { getTodayText } from '../../services/session-service'

interface RacketEditData {
  draft: RacketDraft
  hasSelectedLibrary: boolean
  racketId: number
  purchasePriceText: string
  saving: boolean
  statusOptions: string[]
  statusPickerIndex: number
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
    verticalTension: 0,
    horizontalTension: 0,
    lastStringDate: '',
    lastStringCost: 0,
  }
}

const statusValues = [1, 2, 3] as const

const getStatusPickerIndex = (status: number) => {
  const index = statusValues.findIndex((value) => value === status)

  return index >= 0 ? index : 1
}

Component({
  data: {
    draft: createDefaultDraft(),
    hasSelectedLibrary: false,
    racketId: 0,
    purchasePriceText: '',
    saving: false,
    statusOptions: ['主力拍', '在用', '退役'],
    statusPickerIndex: 1,
    titleText: '新增球拍',
  } as RacketEditData,
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
          libraryId?: string
          brand?: string
          model?: string
          imageUrl?: string
          weight?: string
          headSize?: string
        }
      }
      const options = currentPage.options || {}
      const racketId = Number(options.id) || 0

      if (racketId) {
        this.loadRacketForEdit(racketId)
        return
      }

      this.loadSelectedLibrary(options)
    },
    async loadRacketForEdit(racketId: number) {
      if (racketId === this.data.racketId) {
        return
      }

      try {
        const detail = await getRacketDetailFromApi(racketId)
        const racket = detail.racket

        this.setData({
          racketId,
          hasSelectedLibrary: !!racket.libraryId,
          titleText: '编辑球拍',
          draft: {
            libraryId: racket.libraryId || 0,
            name: racket.name || '',
            brand: racket.brand || '',
            model: racket.model || '',
            status: racket.status,
            imageUrl: racket.imageUrl || '',
            weight: racket.weight || 0,
            headSize: racket.headSize || 0,
            purchaseDate: racket.purchaseDate || getTodayText(),
            purchasePrice: racket.purchasePrice || 0,
            stringName: racket.stringName || '',
            verticalTension: racket.verticalTension || 0,
            horizontalTension: racket.horizontalTension || 0,
            lastStringDate: racket.lastStringDate || '',
            lastStringCost: racket.lastStringCost || 0,
          },
          purchasePriceText: racket.purchasePrice ? `${racket.purchasePrice}` : '',
          statusPickerIndex: getStatusPickerIndex(racket.status),
        })
      } catch (error) {
        wx.showToast({
          title: error instanceof Error ? error.message : '球拍加载失败',
          icon: 'none',
        })
      }
    },
    loadSelectedLibrary(options: {
      libraryId?: string
      brand?: string
      model?: string
      imageUrl?: string
      weight?: string
      headSize?: string
    }) {
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
        'draft.name': event.detail.value,
      })
    },
    onBrandInput(event: InputEvent) {
      this.setData({
        'draft.brand': event.detail.value,
      })
    },
    onModelInput(event: InputEvent) {
      this.setData({
        'draft.model': event.detail.value,
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
      const inputValue = event.detail.value
      this.setData({
        purchasePriceText: inputValue,
        'draft.purchasePrice': Number(inputValue) || 0,
      })
    },
    onStatusChange(event: PickerChangeEvent) {
      const index = Number(event.detail.value)
      const status = statusValues[index] || 2

      this.setData({
        'draft.status': status,
        statusPickerIndex: getStatusPickerIndex(status),
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
        if (this.data.racketId) {
          await updateRacketFromApi(this.data.racketId, this.data.draft)
        } else {
          await createRacketFromApi(this.data.draft)
        }

        wx.showToast({
          title: this.data.racketId ? '已保存' : '已添加',
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
