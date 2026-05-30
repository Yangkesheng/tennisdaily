import type { RacketLibraryGroup, RacketLibraryItem } from '../../models/racket'
import { listRacketLibraryFromApi } from '../../services/racket-api-service'

interface RacketLibraryData {
  groups: RacketLibraryGroup[]
  brands: string[]
  activeBrandIndex: number
  visibleItems: RacketLibraryItem[]
}

const encode = (value: string | number) => {
  return encodeURIComponent(`${value}`)
}

Component({
  data: {
    groups: [],
    brands: [],
    activeBrandIndex: 0,
    visibleItems: [],
  } as RacketLibraryData,
  lifetimes: {
    attached() {
      this.loadLibrary()
    },
  },
  methods: {
    async loadLibrary() {
      try {
        const groups = await listRacketLibraryFromApi()
        const firstGroup = groups[0]

        this.setData({
          groups,
          brands: groups.map((group) => group.brand),
          activeBrandIndex: 0,
          visibleItems: firstGroup ? firstGroup.items : [],
        })
      } catch (error) {
        wx.showToast({
          title: error instanceof Error ? error.message : '球拍库加载失败',
          icon: 'none',
        })
      }
    },
    selectBrand(event: WechatMiniprogram.TouchEvent) {
      const index = Number(event.currentTarget.dataset.index)
      const group = this.data.groups[index]

      if (!group) {
        return
      }

      this.setData({
        activeBrandIndex: index,
        visibleItems: group.items,
      })
    },
    selectRacket(event: WechatMiniprogram.TouchEvent) {
      const index = Number(event.currentTarget.dataset.index)
      const item = this.data.visibleItems[index]

      if (!item) {
        return
      }

      wx.navigateTo({
        url:
          `/pages/racket-edit/racket-edit?libraryId=${item.id}` +
          `&brand=${encode(item.brand)}` +
          `&model=${encode(item.model)}` +
          `&imageUrl=${encode(item.imageUrl)}` +
          `&weight=${item.weight}` +
          `&headSize=${item.headSize}`,
      })
    },
    manualInput() {
      wx.navigateTo({
        url: '/pages/racket-edit/racket-edit',
      })
    },
  },
})

