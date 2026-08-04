import type { RacketBrand, RacketLibraryItem, RacketLibraryStatsBrand, RacketSeries } from '../../models/racket'
import { getRacketLibraryStatsFromApi, listRacketLibraryItemsFromApi } from '../../services/racket-api-service'

interface RacketLibraryData {
  brands: RacketBrand[]
  series: RacketSeries[]
  activeBrandIndex: number
  activeSeriesIndex: number
  visibleItems: RacketLibraryItem[]
  loadingBrands: boolean
  loadingItems: boolean
  activeRequestKey: string
  showBrands: boolean
}

const encode = (value: string | number) => {
  return encodeURIComponent(`${value}`)
}

const seriesCache: Record<number, RacketSeries[]> = {}
const itemCache: Record<string, RacketLibraryItem[]> = {}

const mapStatsToBrands = (stats: RacketLibraryStatsBrand[]): RacketBrand[] => {
  return stats.map((brand) => ({
    id: brand.id,
    name: brand.name,
    imageUrl: brand.imageUrl,
    count: brand.count,
  }))
}

const cacheStatsSeries = (stats: RacketLibraryStatsBrand[]) => {
  stats.forEach((brand) => {
    seriesCache[brand.id] = brand.series
  })
}

const getFirstSeriesId = (brandId: number) => {
  return seriesCache[brandId]?.[0]?.id || 0
}

Component({
  data: {
    brands: [],
    series: [],
    activeBrandIndex: 0,
    activeSeriesIndex: -1,
    visibleItems: [],
    loadingBrands: false,
    loadingItems: false,
    activeRequestKey: '',
    showBrands: false,
  } as RacketLibraryData,
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
        const stats = await getRacketLibraryStatsFromApi()
        const brands = mapStatsToBrands(stats)
        cacheStatsSeries(stats)

        this.setData({
          brands,
          activeBrandIndex: 0,
          activeSeriesIndex: getFirstSeriesId(brands[0]?.id || 0) ? 0 : -1,
        })

        if (brands[0]) {
          this.loadBrandLibrary(brands[0].id, getFirstSeriesId(brands[0].id))
        }
      } catch (error) {
        wx.showToast({
          title: error instanceof Error ? error.message : '球拍品牌加载失败',
          icon: 'none',
        })
      } finally {
        this.setData({
          loadingBrands: false,
        })
      }
    },
    async loadBrandLibrary(brandId: number, seriesId = 0) {
      if (!brandId) {
        return
      }

      const cacheKey = `${brandId}-${seriesId}`
      const cachedItems = itemCache[cacheKey]
      const cachedSeries = seriesCache[brandId] || []

      if (cachedItems) {
        this.setData({
          series: cachedSeries,
          visibleItems: cachedItems,
        })
        return
      }

      this.setData({
        loadingItems: true,
        visibleItems: [],
        activeRequestKey: cacheKey,
      })

      try {
        const items = await listRacketLibraryItemsFromApi(brandId, seriesId || undefined)
        const series = seriesCache[brandId] || []

        seriesCache[brandId] = series
        itemCache[cacheKey] = items

        if (this.data.activeRequestKey !== cacheKey) {
          return
        }

        this.setData({
          series,
          visibleItems: items,
        })
      } catch (error) {
        wx.showToast({
          title: error instanceof Error ? error.message : '球拍库加载失败',
          icon: 'none',
        })
      } finally {
        if (this.data.activeRequestKey === cacheKey) {
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

      const firstSeriesId = getFirstSeriesId(brand.id)

      this.setData({
        activeBrandIndex: index,
        activeSeriesIndex: firstSeriesId ? 0 : -1,
        series: [],
        showBrands: false,
      })

      this.loadBrandLibrary(brand.id, firstSeriesId)
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
      this.loadBrandLibrary(brand.id, series ? series.id : 0)
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
    onShareAppMessage() {
      return {
        title: '网球拍图鉴',
        path: '/pages/racket-library/racket-library',
      }
    },
    onShareTimeline() {
      return {
        title: '网球拍图鉴',
      }
    },
  },
})
