import type { ShoeBrand, ShoeLibraryItem, ShoeSeries } from '../../models/shoe'
import { getShoeLibraryStatsFromApi, listShoeLibraryItemsFromApi, listShoeSeriesFromApi, mapShoeBrands } from '../../services/shoe-api-service'

interface ShoeLibraryItemView extends ShoeLibraryItem {}

interface PickerChangeEvent {
  detail: {
    value: string
  }
}

interface ShoeLibraryData {
  brands: ShoeBrand[]
  series: ShoeSeries[]
  genderOptions: { value: number; label: string }[]
  genderLabels: string[]
  activeGenderIndex: number
  activeGender: number
  activeBrandIndex: number
  activeSeriesIndex: number
  visibleItems: ShoeLibraryItemView[]
  loadingBrands: boolean
  loadingItems: boolean
  activeRequestKey: string
  showBrands: boolean
}

const genderOptions = [
  { value: 1, label: '男款' },
  { value: 2, label: '女款' },
]
const genderLabels = genderOptions.map((item) => item.label)

const encode = (value: string | number) => {
  return encodeURIComponent(`${value}`)
}

const createItemView = (item: ShoeLibraryItem): ShoeLibraryItemView => {
  return {
    ...item,
  }
}

const seriesCache: Record<string, ShoeSeries[]> = {}
const itemCache: Record<string, ShoeLibraryItemView[]> = {}

Component({
  data: {
    brands: [],
    series: [],
    genderOptions,
    genderLabels,
    activeGenderIndex: 0,
    activeGender: 1,
    activeBrandIndex: 0,
    activeSeriesIndex: -1,
    visibleItems: [],
    loadingBrands: false,
    loadingItems: false,
    activeRequestKey: '',
    showBrands: false,
  } as ShoeLibraryData,
  lifetimes: {
    attached() {
      this.loadLibrary()
    },
  },
  methods: {
    async loadLibrary() {
      if (this.data.loadingBrands) {
        return
      }

      this.setData({
        loadingBrands: true,
      })

      try {
        const stats = await getShoeLibraryStatsFromApi()
        const brands = mapShoeBrands(stats)

        this.setData({
          brands,
          activeBrandIndex: 0,
        })

        if (brands[0]) {
          this.loadBrandLibrary(brands[0].id, 0, this.data.activeGender)
        }
      } catch (error) {
        wx.showToast({
          title: error instanceof Error ? error.message : '球鞋品牌加载失败',
          icon: 'none',
        })
      } finally {
        this.setData({
          loadingBrands: false,
        })
      }
    },
    async loadBrandLibrary(brandId: number, seriesId: number, gender: number) {
      if (!brandId) {
        return
      }

      const requestKey = `${brandId}-${gender}-${seriesId}`
      this.setData({
        loadingItems: true,
        activeRequestKey: requestKey,
      })

      try {
        const seriesCacheKey = `${brandId}-${gender}`
        let rawSeries = seriesCache[seriesCacheKey]
        if (!rawSeries) {
          rawSeries = await listShoeSeriesFromApi(brandId, gender || undefined)
          seriesCache[seriesCacheKey] = rawSeries
        }

        const brandStats = this.data.brands.find((item) => item.id === brandId)
        const seriesCounts = new Map<string, number>()
        for (const [genderKey, statsSeries] of Object.entries(brandStats?.series || {})) {
          for (const statsItem of statsSeries) {
            seriesCounts.set(`${genderKey}-${statsItem.seriesId}`, statsItem.count)
          }
        }
        const series = rawSeries.map((item) => ({ ...item, count: seriesCounts.get(`${item.gender}-${item.id}`) || 0 }))

        const targetSeriesId = seriesId || series[0]?.id || 0
        const itemCacheKey = `${brandId}-${gender}-${targetSeriesId}`
        let items = itemCache[itemCacheKey]
        if (!items) {
          items = (await listShoeLibraryItemsFromApi(brandId, targetSeriesId || undefined, gender || undefined)).map(createItemView)
          itemCache[itemCacheKey] = items
        }

        if (this.data.activeRequestKey !== requestKey) {
          return
        }

        const seriesIndex = series.findIndex((item) => item.id === targetSeriesId)
        this.setData({
          series,
          visibleItems: items,
          activeSeriesIndex: seriesIndex >= 0 ? seriesIndex : -1,
        })
      } catch (error) {
        if (this.data.activeRequestKey === requestKey) {
          wx.showToast({
            title: error instanceof Error ? error.message : '球鞋库加载失败',
            icon: 'none',
          })
        }
      } finally {
        if (this.data.activeRequestKey === requestKey) {
          this.setData({
            loadingItems: false,
          })
        }
      }
    },
    selectBrand(event: WechatMiniprogram.TouchEvent) {
      const index = Number(event.currentTarget.dataset.index)
      const brand = this.data.brands[index]

      if (!brand) {
        return
      }

      if (index === this.data.activeBrandIndex) {
        this.setData({
          showBrands: false,
        })
        return
      }

      this.setData({
        activeBrandIndex: index,
        activeSeriesIndex: -1,
        series: [],
        visibleItems: [],
        showBrands: false,
      })

      this.loadBrandLibrary(brand.id, 0, this.data.activeGender)
    },
    toggleBrands() {
      this.setData({
        showBrands: !this.data.showBrands,
      })
    },
    closeBrands() {
      this.setData({
        showBrands: false,
      })
    },
    onGenderChange(event: PickerChangeEvent) {
      const index = Number(event.detail.value)
      const gender = genderOptions[index]?.value
      const brand = this.data.brands[this.data.activeBrandIndex]

      if (gender === undefined || gender === this.data.activeGender || !brand) {
        return
      }

      this.setData({
        activeGenderIndex: index,
        activeGender: gender,
        activeSeriesIndex: -1,
        series: [],
        visibleItems: [],
      })

      this.loadBrandLibrary(brand.id, 0, gender)
    },
    selectSeries(event: WechatMiniprogram.TouchEvent) {
      const index = Number(event.currentTarget.dataset.index)
      const brand = this.data.brands[this.data.activeBrandIndex]
      const series = this.data.series[index]

      if (!brand || index === this.data.activeSeriesIndex) {
        return
      }

      this.setData({
        activeSeriesIndex: index,
      })
      this.loadBrandLibrary(brand.id, series ? series.id : 0, this.data.activeGender)
    },
    selectShoe(event: WechatMiniprogram.TouchEvent) {
      const index = Number(event.currentTarget.dataset.index)
      const item = this.data.visibleItems[index]

      if (!item) {
        return
      }

      wx.navigateTo({
        url:
          `/pages/shoe-edit/shoe-edit?libraryId=${item.id}` +
          `&brand=${encode(item.brand)}` +
          `&model=${encode(item.model)}` +
          `&colorway=${encode(item.colorway)}` +
          `&price=${item.price}` +
          `&imageUrl=${encode(item.imageUrl)}`,
      })
    },
    manualInput() {
      wx.navigateTo({
        url: '/pages/shoe-edit/shoe-edit',
      })
    },
    onShareAppMessage() {
      return {
        title: '网球鞋图鉴',
        path: '/pages/shoe-library/shoe-library',
      }
    },
    onShareTimeline() {
      return {
        title: '网球鞋图鉴',
      }
    },
  },
})
