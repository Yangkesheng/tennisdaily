import type { RacketBrand, RacketLibraryItem, RacketSeries } from '../../models/racket'
import { listRacketBrandsFromApi, listRacketLibraryItemsFromApi, listRacketSeriesFromApi } from '../../services/racket-api-service'

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
  titleText: string
}

const encode = (value: string | number) => {
  return encodeURIComponent(`${value}`)
}

const seriesCache: Record<number, RacketSeries[]> = {}
const itemCache: Record<string, RacketLibraryItem[]> = {}

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
    showBrands: true,
    titleText: '选拍',
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
        const brands = await listRacketBrandsFromApi()

        this.setData({
          brands,
          activeBrandIndex: 0,
          activeSeriesIndex: -1,
          titleText: brands[0] ? `选拍 · ${brands[0].name}` : '选拍',
        })

        if (brands[0]) {
          this.loadBrandLibrary(brands[0].id)
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
      const cachedSeries = seriesCache[brandId]

      if (cachedItems && (cachedSeries || seriesId > 0)) {
        this.setData({
          series: cachedSeries || this.data.series,
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
        const [series, items] = await Promise.all([
          cachedSeries ? Promise.resolve(cachedSeries) : listRacketSeriesFromApi(brandId),
          listRacketLibraryItemsFromApi(brandId, seriesId || undefined),
        ])

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

      if (!brand || index === this.data.activeBrandIndex) {
        return
      }

      this.setData({
        activeBrandIndex: index,
        activeSeriesIndex: -1,
        series: [],
        showBrands: false,
        titleText: `选拍 · ${brand.name}`,
      })
      this.loadBrandLibrary(brand.id)
    },
    toggleBrands() {
      this.setData({
        showBrands: !this.data.showBrands,
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
  },
})

