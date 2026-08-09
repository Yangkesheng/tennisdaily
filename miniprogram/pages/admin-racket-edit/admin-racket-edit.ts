import type { CreateRacketLibraryPayload, RacketBrand, RacketSeries } from '../../models/racket'
import { deleteRacketImageFromCloudStorage, prepareRacketImageForUpload, uploadRacketImageToCloudStorage } from '../../services/racket-image-service'
import { createRacketLibraryItemsFromApi, getRacketLibraryStatsFromApi, listRacketSeriesFromApi } from '../../services/racket-api-service'

interface AdminRacketEditData {
  brands: RacketBrand[]
  brandNames: string[]
  activeBrandIndex: number
  brandName: string
  series: RacketSeries[]
  activeSeriesIndex: number
  seriesName: string
  seriesNameTouched: boolean
  model: string
  releaseYearText: string
  weightText: string
  headSizeText: string
  stringPattern: string
  imageFileId: string
  imageTempPath: string
  uploadingImage: boolean
  saving: boolean
  loadingBrands: boolean
  showSeriesPicker: boolean
  routeBrandId: number
  routeSeriesId: number
}

interface PickerChangeEvent {
  detail: {
    value: string
  }
}

interface InputEvent {
  detail: {
    value: string
  }
}

interface ChooseMediaSuccessResult {
  tempFiles: Array<{
    tempFilePath: string
    size: number
  }>
}

const mapStatsToBrands = (stats: RacketBrand[]): RacketBrand[] => {
  return stats.map((brand) => ({
    id: brand.id,
    name: brand.name,
    imageUrl: brand.imageUrl || '',
    count: brand.count || 0,
  }))
}

Component({
  data: {
    brands: [],
    brandNames: [],
    activeBrandIndex: 0,
    brandName: '',
    series: [],
    activeSeriesIndex: -1,
    seriesName: '',
    seriesNameTouched: false,
    model: '',
    releaseYearText: '',
    weightText: '',
    headSizeText: '',
    stringPattern: '',
    imageFileId: '',
    imageTempPath: '',
    uploadingImage: false,
    saving: false,
    loadingBrands: false,
    showSeriesPicker: false,
    routeBrandId: 0,
    routeSeriesId: 0,
  } as AdminRacketEditData,
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
          brandId?: string
          seriesId?: string
        }
      }
      const options = currentPage.options || {}
      const brandId = Number(options.brandId) || 0
      const seriesId = Number(options.seriesId) || 0

      this.setData({
        routeBrandId: brandId,
        routeSeriesId: seriesId,
      })

      this.loadBrands()
    },
    async loadBrands() {
      if (this.data.loadingBrands) {
        return
      }

      this.setData({
        loadingBrands: true,
      })

      try {
        const stats = await getRacketLibraryStatsFromApi()
        const brands = mapStatsToBrands(stats)
        let activeBrandIndex = 0
        if (this.data.routeBrandId > 0) {
          const index = brands.findIndex((item) => item.id === this.data.routeBrandId)
          if (index >= 0) {
            activeBrandIndex = index
          }
        }

        this.setData({
          brands,
          brandNames: brands.map((item) => item.name),
          activeBrandIndex,
          brandName: brands[activeBrandIndex]?.name || '',
          loadingBrands: false,
        })

        await this.loadSeries()
      } catch (error) {
        this.setData({
          loadingBrands: false,
        })
        wx.showToast({
          title: error instanceof Error ? error.message : '品牌加载失败',
          icon: 'none',
        })
      }
    },
    async loadSeries() {
      const brand = this.data.brands[this.data.activeBrandIndex]
      if (!brand) {
        this.setData({
          series: [],
          activeSeriesIndex: -1,
        })
        return
      }

      try {
        const series = await listRacketSeriesFromApi(brand.id)
        let activeSeriesIndex = -1
        if (this.data.routeSeriesId > 0) {
          const index = series.findIndex((item) => item.id === this.data.routeSeriesId)
          if (index >= 0) {
            activeSeriesIndex = index
          }
        }

        this.setData({
          series,
          activeSeriesIndex,
          seriesName: this.data.seriesNameTouched
            ? this.data.seriesName
            : series[activeSeriesIndex]?.name || '',
        })
      } catch (error) {
        wx.showToast({
          title: error instanceof Error ? error.message : '系列加载失败',
          icon: 'none',
        })
      }
    },
    onBrandChange(event: PickerChangeEvent) {
      const index = Number(event.detail.value)
      const brand = this.data.brands[index]
      this.setData({
        activeBrandIndex: index,
        brandName: brand ? brand.name : '',
        series: [],
        activeSeriesIndex: -1,
        seriesName: '',
        seriesNameTouched: false,
      })
      this.loadSeries()
    },
    onBrandInput(event: InputEvent) {
      this.setData({
        brandName: event.detail.value,
      })
    },
    onSeriesInput(event: InputEvent) {
      this.setData({
        seriesName: event.detail.value,
        seriesNameTouched: true,
      })
    },
    onModelInput(event: InputEvent) {
      this.setData({
        model: event.detail.value,
      })
    },
    onReleaseYearInput(event: InputEvent) {
      this.setData({
        releaseYearText: event.detail.value,
      })
    },
    onWeightInput(event: InputEvent) {
      this.setData({
        weightText: event.detail.value,
      })
    },
    onHeadSizeInput(event: InputEvent) {
      this.setData({
        headSizeText: event.detail.value,
      })
    },
    onStringPatternInput(event: InputEvent) {
      this.setData({
        stringPattern: event.detail.value,
      })
    },
    async openSeriesPicker() {
      const brandName = this.data.brandName.trim()
      const brandIndex = this.data.brands.findIndex((item) => item.name === brandName)
      if (brandIndex < 0) {
        wx.showToast({
          title: '请先选择已有品牌，或直接输入系列名',
          icon: 'none',
        })
        return
      }

      const needReload = brandIndex !== this.data.activeBrandIndex || !this.data.series.length
      this.setData({
        activeBrandIndex: brandIndex,
      })
      if (needReload) {
        await this.loadSeries()
      }

      if (!this.data.series.length) {
        wx.showToast({
          title: '该品牌下暂无系列，可直接输入系列名',
          icon: 'none',
        })
        return
      }

      this.setData({
        showSeriesPicker: true,
      })
    },
    selectSeriesOption(event: WechatMiniprogram.TouchEvent) {
      const index = Number(event.currentTarget.dataset.index)
      const series = this.data.series[index]
      if (!series) {
        return
      }
      this.setData({
        seriesName: series.name,
        activeSeriesIndex: index,
        seriesNameTouched: true,
        showSeriesPicker: false,
      })
    },
    closeSeriesPicker() {
      this.setData({
        showSeriesPicker: false,
      })
    },
    async onImageTap() {
      if (this.data.uploadingImage) {
        return
      }

      wx.chooseMedia({
        count: 1,
        mediaType: ['image'],
        sizeType: ['compressed'],
        sourceType: ['album', 'camera'],
        success: async (result: ChooseMediaSuccessResult) => {
          const file = result.tempFiles[0]
          if (!file?.tempFilePath) {
            return
          }

          const previousTempPath = this.data.imageTempPath
          const previousFileID = this.data.imageFileId
          this.setData({
            uploadingImage: true,
            imageTempPath: file.tempFilePath,
          })

          try {
            const filePath = await prepareRacketImageForUpload(file.tempFilePath, file.size)
            const fileID = await uploadRacketImageToCloudStorage(
              filePath,
              this.data.brandName,
              this.data.seriesName,
              this.data.model.trim(),
            )
            this.setData({
              imageFileId: fileID,
              uploadingImage: false,
            })

            if (previousFileID && previousFileID !== fileID) {
              deleteRacketImageFromCloudStorage(previousFileID).catch((error) => {
                console.error('delete racket image failed', error)
              })
            }
          } catch (error) {
            this.setData({
              uploadingImage: false,
              imageTempPath: previousTempPath,
            })
            wx.showToast({
              title: error instanceof Error ? error.message : '图片上传失败',
              icon: 'none',
            })
          }
        },
      })
    },
    removeImage() {
      const fileID = this.data.imageFileId
      this.setData({
        imageFileId: '',
        imageTempPath: '',
      })
      if (fileID) {
        deleteRacketImageFromCloudStorage(fileID).catch((error) => {
          console.error('delete racket image failed', error)
        })
      }
    },
    async submitRacket() {
      if (this.data.saving) {
        return
      }

      const model = this.data.model.trim()
      const brandName = this.data.brandName.trim()
      const seriesName = this.data.seriesName.trim()

      if (!brandName) {
        wx.showToast({ title: '请选择或输入品牌', icon: 'none' })
        return
      }
      if (!seriesName) {
        wx.showToast({ title: '请选择或输入系列', icon: 'none' })
        return
      }
      if (!model) {
        wx.showToast({ title: '请填写型号', icon: 'none' })
        return
      }

      this.setData({
        saving: true,
      })

      try {
        const payload: CreateRacketLibraryPayload = {
          brandName,
          seriesName,
          model,
        }
        if (this.data.releaseYearText.trim()) {
          payload.releaseYear = Number(this.data.releaseYearText) || 0
        }
        if (this.data.weightText.trim()) {
          payload.weight = Number(this.data.weightText) || 0
        }
        if (this.data.headSizeText.trim()) {
          payload.headSize = Number(this.data.headSizeText) || 0
        }
        if (this.data.stringPattern.trim()) {
          payload.stringPattern = this.data.stringPattern.trim()
        }
        if (this.data.imageFileId) {
          payload.fileId = this.data.imageFileId
        }

        await createRacketLibraryItemsFromApi(payload)

        wx.showToast({
          title: '已添加到球拍库',
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
