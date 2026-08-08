import type { ShoeBrand, ShoeLibraryItem, ShoeSeries } from '../../models/shoe'
import { getAdminPermissionsFromApi } from '../../services/auth-service'
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
  isAdmin: boolean
}

const genderOptions = [
  { value: 1, label: '男款' },
  { value: 2, label: '女款' },
]
const genderLabels = genderOptions.map((item) => item.label)
const GENDER_STORAGE_KEY = 'shoeLibraryGender'

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
    isAdmin: false,
  } as ShoeLibraryData,
  lifetimes: {
    attached() {
      const cachedGender = Number(wx.getStorageSync(GENDER_STORAGE_KEY)) || 0
      const cachedGenderIndex = genderOptions.findIndex((item) => item.value === cachedGender)
      if (cachedGenderIndex >= 0) {
        this.setData({
          activeGender: cachedGender,
          activeGenderIndex: cachedGenderIndex,
        })
      }
      this.loadLibrary()
      this.loadAdminStatus()
    },
  },
  pageLifetimes: {
    show() {
      this.refreshAfterReturn()
    },
  },
  methods: {
    async loadAdminStatus() {
      try {
        const permissions = await getAdminPermissionsFromApi()
        this.setData({
          isAdmin: permissions.isAdmin,
        })
      } catch (error) {
        this.setData({
          isAdmin: false,
        })
      }
    },
    async refreshAfterReturn() {
      if (!this.data.brands.length) {
        return
      }

      // 管理员新增鞋款返回后：刷新品牌下拉，并清空缓存重新拉取当前品牌条目。
      try {
        const stats = await getShoeLibraryStatsFromApi()
        const brands = mapShoeBrands(stats)
        const currentBrandId = this.data.brands[this.data.activeBrandIndex]?.id || 0
        let activeBrandIndex = 0
        if (currentBrandId) {
          const index = brands.findIndex((item) => item.id === currentBrandId)
          if (index >= 0) {
            activeBrandIndex = index
          }
        }
        this.setData({
          brands,
          activeBrandIndex,
        })
      } catch (error) {
        // 品牌列表刷新失败不阻塞，当前品牌条目仍继续刷新。
      }

      for (const key of Object.keys(seriesCache)) {
        delete seriesCache[key]
      }
      for (const key of Object.keys(itemCache)) {
        delete itemCache[key]
      }

      const brand = this.data.brands[this.data.activeBrandIndex]
      const series = this.data.series[this.data.activeSeriesIndex]
      if (brand) {
        this.loadBrandLibrary(brand.id, series ? series.id : 0, this.data.activeGender)
      }
    },
    goAdminEdit() {
      const brand = this.data.brands[this.data.activeBrandIndex]
      const series = this.data.series[this.data.activeSeriesIndex]
      const params = [
        brand ? `brandId=${brand.id}` : '',
        brand ? `brand=${encode(brand.name)}` : '',
        series ? `seriesId=${series.id}` : '',
        series ? `series=${encode(series.name)}` : '',
        `gender=${this.data.activeGender}`,
      ]
        .filter(Boolean)
        .join('&')

      wx.navigateTo({
        url: `/pages/admin-shoe-edit/admin-shoe-edit${params ? `?${params}` : ''}`,
      })
    },
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
        const series = rawSeries
          .map((item) => ({ ...item, count: seriesCounts.get(`${item.gender}-${item.id}`) || 0 }))
          .sort((a, b) => b.count - a.count)

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

      wx.setStorageSync(GENDER_STORAGE_KEY, gender)
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
          `&imageUrl=${encode(item.imageUrl)}`,
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
