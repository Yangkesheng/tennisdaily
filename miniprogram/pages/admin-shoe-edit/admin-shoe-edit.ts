import type { CreateShoeLibraryPayload, ShoeBrand, ShoeSeries } from '../../models/shoe'
import { deleteShoeImageFromCloudStorage, prepareShoeImageForUpload, uploadShoeImageToCloudStorage } from '../../services/shoe-image-service'
import { createShoeBrandFromApi, createShoeLibraryItemsFromApi, createShoeSeriesFromApi, getShoeLibraryStatsFromApi, listShoeSeriesFromApi, mapShoeBrands } from '../../services/shoe-api-service'

interface AdminShoeEditData {
  brands: ShoeBrand[]
  brandNames: string[]
  activeBrandIndex: number
  brandName: string
  series: ShoeSeries[]
  activeSeriesIndex: number
  seriesName: string
  genderOptions: { value: number; label: string }[]
  genderLabels: string[]
  genderIndex: number
  model: string
  colorwayInput: string
  colorways: string[]
  colorwayPreview: string
  showColorwayPicker: boolean
  colorwayOptions: string[]
  pickedColorways: string[]
  pickedColorwayMap: Record<string, boolean>
  showSeriesPicker: boolean
  releaseYearText: string
  priceText: string
  weight: string
  width: string
  surface: string
  imageFileId: string
  imageTempPath: string
  uploadingImage: boolean
  saving: boolean
  loadingBrands: boolean
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

const genderOptions = [
  { value: 1, label: '男款' },
  { value: 2, label: '女款' },
  { value: 3, label: '童款' },
]
const genderLabels = genderOptions.map((item) => item.label)

const MAIN_COLORWAYS = [
  'Black',
  'White',
  'Red',
  'Blue',
  'Green',
  'Yellow',
  'Orange',
  'Pink',
  'Purple',
  'Grey',
  'Brown',
  'Navy',
  'Silver',
  'Gold',
]

const formatColorwayName = (value: string) => {
  return value
    .trim()
    .split(/\s+/)
    .map((word) =>
      word
        .split('/')
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
        .join('/'),
    )
    .join(' ')
}

const buildColorwayMap = (colorways: string[]): Record<string, boolean> => {
  const map: Record<string, boolean> = {}
  for (const colorway of colorways) {
    map[colorway] = true
  }
  return map
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
    genderOptions,
    genderLabels,
    genderIndex: 0,
    model: '',
    colorwayInput: '',
    colorways: [],
    colorwayPreview: '',
    showColorwayPicker: false,
    colorwayOptions: [],
    pickedColorways: [],
    pickedColorwayMap: {},
    showSeriesPicker: false,
    releaseYearText: '',
    priceText: '',
    weight: '',
    width: '',
    surface: '',
    imageFileId: '',
    imageTempPath: '',
    uploadingImage: false,
    saving: false,
    loadingBrands: false,
    routeBrandId: 0,
    routeSeriesId: 0,
  } as AdminShoeEditData,
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
          gender?: string
        }
      }
      const options = currentPage.options || {}
      const brandId = Number(options.brandId) || 0
      const seriesId = Number(options.seriesId) || 0
      const gender = Number(options.gender) || 0
      const genderIndex = genderOptions.findIndex((item) => item.value === gender)

      this.setData({
        routeBrandId: brandId,
        routeSeriesId: seriesId,
        genderIndex: genderIndex >= 0 ? genderIndex : 0,
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
        const stats = await getShoeLibraryStatsFromApi()
        const brands = mapShoeBrands(stats)
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
        const gender = genderOptions[this.data.genderIndex].value
        const series = await listShoeSeriesFromApi(brand.id, gender)
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
          seriesName: series[activeSeriesIndex]?.name || '',
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
      })
    },
    onGenderChange(event: PickerChangeEvent) {
      const index = Number(event.detail.value)
      if (index === this.data.genderIndex) {
        return
      }
      this.setData({
        genderIndex: index,
        series: [],
        activeSeriesIndex: -1,
        seriesName: '',
      })
      this.loadSeries()
    },
    onModelInput(event: InputEvent) {
      this.setData({
        model: event.detail.value,
      })
    },
    onColorwayInput(event: InputEvent) {
      this.setData({
        colorwayInput: event.detail.value,
      })
    },
    addColorway() {
      const colorway = formatColorwayName(this.data.colorwayInput)
      if (!colorway) {
        return
      }
      if (this.data.colorways.some((item) => item.toLowerCase() === colorway.toLowerCase())) {
        wx.showToast({
          title: '该配色已添加',
          icon: 'none',
        })
        return
      }
      const colorways = this.data.colorways.concat(colorway)
      this.setData({
        colorways,
        colorwayPreview: colorways.join('/'),
        colorwayInput: '',
      })
    },
    removeColorway(event: WechatMiniprogram.TouchEvent) {
      const index = Number(event.currentTarget.dataset.index)
      const colorways = this.data.colorways.filter((_, itemIndex) => itemIndex !== index)
      this.setData({
        colorways,
        colorwayPreview: colorways.join('/'),
      })
    },
    openColorwayPicker() {
      if (typeof wx.hideKeyboard === 'function') {
        wx.hideKeyboard()
      }
      const picked = this.data.colorways.filter((colorway) =>
        MAIN_COLORWAYS.some((option) => option.toLowerCase() === colorway.toLowerCase()),
      )
      this.setData({
        showColorwayPicker: true,
        colorwayOptions: MAIN_COLORWAYS,
        pickedColorways: picked,
        pickedColorwayMap: buildColorwayMap(picked),
      })
    },
    toggleColorwayOption(event: WechatMiniprogram.TouchEvent) {
      const colorway = event.currentTarget.dataset.colorway as string
      const picked = this.data.pickedColorways.includes(colorway)
        ? this.data.pickedColorways.filter((item) => item !== colorway)
        : this.data.pickedColorways.concat(colorway)
      this.setData({
        pickedColorways: picked,
        pickedColorwayMap: buildColorwayMap(picked),
      })
    },
    closeColorwayPicker() {
      this.setData({
        showColorwayPicker: false,
        colorwayOptions: [],
        pickedColorways: [],
        pickedColorwayMap: {},
      })
    },
    confirmColorwayPicker() {
      const colorways = this.data.colorways.slice()
      for (const colorway of this.data.pickedColorways) {
        if (!colorways.some((item) => item.toLowerCase() === colorway.toLowerCase())) {
          colorways.push(colorway)
        }
      }
      this.setData({
        colorways,
        colorwayPreview: colorways.join('/'),
        showColorwayPicker: false,
        colorwayOptions: [],
        pickedColorways: [],
        pickedColorwayMap: {},
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
        showSeriesPicker: false,
      })
    },
    closeSeriesPicker() {
      this.setData({
        showSeriesPicker: false,
      })
    },
    onReleaseYearInput(event: InputEvent) {
      this.setData({
        releaseYearText: event.detail.value,
      })
    },
    onPriceInput(event: InputEvent) {
      this.setData({
        priceText: event.detail.value,
      })
    },
    onWeightInput(event: InputEvent) {
      this.setData({
        weight: event.detail.value,
      })
    },
    onWidthInput(event: InputEvent) {
      this.setData({
        width: event.detail.value,
      })
    },
    onSurfaceInput(event: InputEvent) {
      this.setData({
        surface: event.detail.value,
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
            const filePath = await prepareShoeImageForUpload(file.tempFilePath, file.size)
            const fileID = await uploadShoeImageToCloudStorage(
              filePath,
              this.data.brandName,
              this.data.seriesName,
              this.data.model.trim(),
              this.data.colorways.join('/'),
            )
            this.setData({
              imageFileId: fileID,
              uploadingImage: false,
            })

            if (previousFileID && previousFileID !== fileID) {
              deleteShoeImageFromCloudStorage(previousFileID).catch((error) => {
                console.error('delete shoe image failed', error)
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
        deleteShoeImageFromCloudStorage(fileID).catch((error) => {
          console.error('delete shoe image failed', error)
        })
      }
    },
    async submitShoe() {
      if (this.data.saving) {
        return
      }

      const gender = genderOptions[this.data.genderIndex].value
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
      if (!this.data.colorways.length) {
        wx.showToast({ title: '请至少添加一个配色', icon: 'none' })
        return
      }

      this.setData({
        saving: true,
      })

      try {
        let brandId = 0
        const brandIndex = this.data.brands.findIndex((item) => item.name === brandName)
        if (brandIndex >= 0) {
          brandId = this.data.brands[brandIndex].id
        } else {
          const brand = await createShoeBrandFromApi({ name: brandName })
          brandId = brand.id
          const newBrand: ShoeBrand = {
            id: brand.id,
            name: brand.name,
            imageUrl: '',
            count: 0,
            series: {},
          }
          const brands = this.data.brands.concat(newBrand)
          this.setData({
            brands,
            brandNames: brands.map((item) => item.name),
            activeBrandIndex: brands.length - 1,
            brandName: brand.name,
          })
        }

        let seriesId = 0
        const seriesIndex = this.data.series.findIndex((item) => item.name === seriesName && item.gender === gender)
        if (seriesIndex >= 0) {
          seriesId = this.data.series[seriesIndex].id
        } else {
          const series = await createShoeSeriesFromApi({ brandId, gender, name: seriesName })
          seriesId = series.id
          const newSeries: ShoeSeries = {
            id: series.id,
            brandId,
            gender,
            name: series.name,
          }
          const seriesList = this.data.series.concat(newSeries)
          this.setData({
            series: seriesList,
            activeSeriesIndex: seriesList.length - 1,
            seriesName: series.name,
          })
        }

        const payload: CreateShoeLibraryPayload = {
          brandId,
          seriesId,
          model,
          gender,
          colorway: this.data.colorways.join('/'),
        }
        if (this.data.releaseYearText.trim()) {
          payload.releaseYear = Number(this.data.releaseYearText) || 0
        }
        if (this.data.priceText.trim()) {
          payload.price = Number(this.data.priceText) || 0
        }
        if (this.data.weight.trim()) {
          payload.weight = this.data.weight.trim()
        }
        if (this.data.width.trim()) {
          payload.width = this.data.width.trim()
        }
        if (this.data.surface.trim()) {
          payload.surface = this.data.surface.trim()
        }
        if (this.data.imageFileId) {
          payload.fileId = this.data.imageFileId
        }

        await createShoeLibraryItemsFromApi(payload)

        wx.showToast({
          title: '已添加到球鞋库',
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
