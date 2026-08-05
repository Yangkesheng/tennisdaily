import type { ShoeDraft, ShoeStatus } from '../../models/shoe'
import { createShoeFromApi, getShoeDetailFromApi, updateShoeFromApi } from '../../services/shoe-api-service'
import { getTodayText } from '../../services/session-service'

interface ShoeEditData {
  draft: ShoeDraft
  hasSelectedLibrary: boolean
  shoeId: number
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

const createDefaultDraft = (): ShoeDraft => {
  return {
    libraryId: 0,
    name: '',
    brand: '',
    model: '',
    status: 2,
    size: '',
    colorway: '',
    purchaseDate: getTodayText(),
    purchasePrice: 0,
  }
}

const statusValues = [1, 2, 3] as const

const getStatusPickerIndex = (status: ShoeStatus) => {
  const index = statusValues.findIndex((value) => value === status)

  return index >= 0 ? index : 1
}

Component({
  data: {
    draft: createDefaultDraft(),
    hasSelectedLibrary: false,
    shoeId: 0,
    purchasePriceText: '0',
    saving: false,
    statusOptions: ['主力鞋', '在用'],
    statusPickerIndex: 1,
    titleText: '新增球鞋',
  } as ShoeEditData,
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
          colorway?: string
          price?: string
          imageUrl?: string
        }
      }
      const options = currentPage.options || {}
      const shoeId = Number(options.id) || 0

      if (shoeId) {
        this.loadShoeForEdit(shoeId)
        return
      }

      this.loadSelectedLibrary(options)
    },
    async loadShoeForEdit(shoeId: number) {
      if (shoeId === this.data.shoeId) {
        return
      }

      try {
        const shoe = await getShoeDetailFromApi(shoeId)

        this.setData({
          shoeId,
          hasSelectedLibrary: !!shoe.libraryId,
          titleText: '编辑球鞋',
          statusOptions: ['主力鞋', '在用', '退役'],
          draft: {
            libraryId: shoe.libraryId || 0,
            name: shoe.name || '',
            brand: shoe.brand || '',
            model: shoe.model || '',
            status: shoe.status,
            size: shoe.size || '',
            colorway: shoe.colorway || '',
            purchaseDate: shoe.purchaseDate || getTodayText(),
            purchasePrice: shoe.purchasePrice || 0,
            imageUrl: shoe.imageUrl || '',
          },
          purchasePriceText: shoe.purchasePrice ? `${shoe.purchasePrice}` : '0',
          statusPickerIndex: getStatusPickerIndex(shoe.status),
        })
      } catch (error) {
        wx.showToast({
          title: error instanceof Error ? error.message : '球鞋加载失败',
          icon: 'none',
        })
      }
    },
    loadSelectedLibrary(options: {
      libraryId?: string
      brand?: string
      model?: string
      colorway?: string
      price?: string
      imageUrl?: string
    }) {
      const libraryId = Number(options.libraryId) || 0

      if (!libraryId || libraryId === this.data.draft.libraryId) {
        return
      }

      const model = decodeURIComponent(options.model || '')
      const price = Number(options.price) || 0

      this.setData({
        hasSelectedLibrary: true,
        'draft.libraryId': libraryId,
        'draft.name': model,
        'draft.brand': decodeURIComponent(options.brand || ''),
        'draft.model': model,
        'draft.colorway': decodeURIComponent(options.colorway || ''),
        'draft.purchasePrice': price,
        'draft.imageUrl': decodeURIComponent(options.imageUrl || ''),
        purchasePriceText: price ? `${price}` : '0',
      })
    },
    previewDetailImage() {
      const imageUrl = this.data.draft.imageUrl
      if (!imageUrl) {
        return
      }

      wx.previewImage({
        urls: [imageUrl],
        current: imageUrl,
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
    onColorwayInput(event: InputEvent) {
      this.setData({
        'draft.colorway': event.detail.value,
      })
    },
    onPurchaseDateChange(event: PickerChangeEvent) {
      this.setData({
        'draft.purchaseDate': event.detail.value,
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
    async submitShoe() {
      const draft = this.data.draft
      const name = draft.name || [draft.brand, draft.model].filter(Boolean).join(' ').trim()

      if (!name) {
        wx.showToast({
          title: '请填写品牌和型号',
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
        const payload = { ...draft, name }
        if (this.data.shoeId) {
          await updateShoeFromApi(this.data.shoeId, payload)
        } else {
          await createShoeFromApi(payload)
        }

        wx.showToast({
          title: this.data.shoeId ? '已保存' : '已添加',
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
