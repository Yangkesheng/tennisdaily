import { RACKET_REVIEW_PENDING, RACKET_REVIEW_APPROVED } from '../../models/racket'
import type { RacketBrand, RacketLibraryItem, RacketLibraryStatsBrand, RacketSeries, RacketReviewStatus } from '../../models/racket'
import { getAdminPermissionsFromApi } from '../../services/auth-service'
import { getRacketLibraryStatsFromApi, listRacketLibraryItemsFromApi, reviewRacketLibraryFromApi } from '../../services/racket-api-service'

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
  isAdmin: boolean
  reviewFilter: string
  saving: boolean
  savingId: number
  reviewApproved: number
}

const encode = (value: string | number) => {
  return encodeURIComponent(`${value}`)
}

const seriesCache: Record<number, RacketSeries[]> = {}
const itemCache: Record<string, RacketLibraryItem[]> = {}
let skipRefreshOnReturn = false

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
    isAdmin: false,
    reviewFilter: 'all',
    saving: false,
    savingId: 0,
    reviewApproved: RACKET_REVIEW_APPROVED,
  } as RacketLibraryData,
  lifetimes: {
    attached() {
      for (const key of Object.keys(itemCache)) delete itemCache[key]
      for (const key of Object.keys(seriesCache)) delete seriesCache[Number(key)]
      this.loadLibrary()
      this.loadAdminStatus()
    },
  },
  pageLifetimes: {
    show() {
      // 从“新增球拍”页返回时，球拍库数据没有变化，不重新请求刷新，
      // 避免系列展示因刷新被清空。
      if (skipRefreshOnReturn) {
        skipRefreshOnReturn = false
        return
      }

      this.refreshAfterReturn()
    },
  },
  methods: {
    reviewStatus(): RacketReviewStatus | undefined {
      return this.data.reviewFilter === 'pending' ? RACKET_REVIEW_PENDING : this.data.reviewFilter === 'approved' ? RACKET_REVIEW_APPROVED : undefined
    },
    async selectReviewFilter(event: WechatMiniprogram.TouchEvent) {
      if (this.data.loadingBrands || this.data.loadingItems || this.data.saving) return
      const reviewFilter = String(event.currentTarget.dataset.filter)
      if (!this.data.isAdmin || !['all', 'pending', 'approved'].includes(reviewFilter)) return
      this.setData({ reviewFilter })
      for (const key of Object.keys(itemCache)) delete itemCache[key]
      for (const key of Object.keys(seriesCache)) delete seriesCache[Number(key)]
      await this.loadLibrary()
    },
    async reviewRacket(event: WechatMiniprogram.TouchEvent) {
      if (this.data.saving || !this.data.isAdmin) return
      const item = this.data.visibleItems[Number(event.currentTarget.dataset.index)]
      if (!item) return
      this.setData({ saving: true, savingId: item.id })
      try {
        await reviewRacketLibraryFromApi(item.id, item.isReviewed === RACKET_REVIEW_APPROVED ? RACKET_REVIEW_PENDING : RACKET_REVIEW_APPROVED)
        for (const key of Object.keys(itemCache)) delete itemCache[key]
        await this.loadLibrary()
        wx.showToast({ title: '审核状态已更新', icon: 'success' })
      } catch (error) {
        wx.showToast({ title: error instanceof Error ? error.message : '审核失败', icon: 'none' })
      } finally {
        this.setData({ saving: false, savingId: 0 })
      }
    },
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

      // 管理员新增球拍返回后：刷新品牌下拉，并清空缓存重新拉取当前品牌条目。
      try {
        const stats = await getRacketLibraryStatsFromApi(this.reviewStatus())
        const brands = mapStatsToBrands(stats)
        cacheStatsSeries(stats)
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

      for (const key of Object.keys(itemCache)) {
        delete itemCache[key]
      }

      const brand = this.data.brands[this.data.activeBrandIndex]
      const series = this.data.series[this.data.activeSeriesIndex]
      if (brand) {
        this.loadBrandLibrary(brand.id, series ? series.id : getFirstSeriesId(brand.id))
      }
    },
    goAdminEdit() {
      const brand = this.data.brands[this.data.activeBrandIndex]
      const series = this.data.series[this.data.activeSeriesIndex]
      const params = [
        brand ? `brandId=${brand.id}` : '',
        series ? `seriesId=${series.id}` : '',
      ]
        .filter(Boolean)
        .join('&')

      wx.navigateTo({
        url: `/pages/admin-racket-edit/admin-racket-edit${params ? `?${params}` : ''}`,
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
        const stats = await getRacketLibraryStatsFromApi(this.reviewStatus())
        const brands = mapStatsToBrands(stats)
        cacheStatsSeries(stats)

        this.setData({
          brands,
          activeBrandIndex: 0,
          series: [],
          visibleItems: [],
          activeRequestKey: '',
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

      const cacheKey = `${brandId}-${seriesId}-${this.data.reviewFilter}`
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
        const items = await listRacketLibraryItemsFromApi(brandId, seriesId || undefined, this.reviewStatus())
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

      if (item.isReviewed !== RACKET_REVIEW_APPROVED) {
        wx.showToast({ title: '请先审核通过再添加', icon: 'none' })
        return
      }
      skipRefreshOnReturn = true
      wx.navigateTo({
        url:
          `/pages/racket-edit/racket-edit?libraryId=${item.id}` +
          `&brand=${encode(item.brand)}` +
          `&model=${encode(item.model)}` +
          `&imageUrl=${encode(item.imageUrl)}` +
          `&weight=${item.weight}` +
          `&headSize=${item.headSize}`,
        fail: () => {
          skipRefreshOnReturn = false
        },
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
