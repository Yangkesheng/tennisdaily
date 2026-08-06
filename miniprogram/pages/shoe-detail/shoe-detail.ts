import type { Shoe, ShoeWear } from '../../models/shoe'
import { getShoeDetailFromApi } from '../../services/shoe-api-service'

interface ShoeDetailData {
  shoeId: number
  shoe: Shoe | null
  statusLabel: string
  statusClass: string
  modelText: string
  purchasePriceText: string
  wearScoreText: string
  wearSegments: Array<{ key: number; on: boolean }>
  infoRows: Array<{ label: string; value: string }>
}

const getGenderText = (gender: number) => {
  switch (gender) {
    case 1:
      return '男款'
    case 2:
      return '女款'
    case 3:
      return '童款'
    default:
      return '未知'
  }
}

const getWearSegments = (wear: ShoeWear | null) => {
  const score = wear?.score
  const filled = (typeof score === 'number' && !Number.isNaN(score))
    ? Math.max(Math.min(Math.round(score / 10), 10), 0)
    : 0

  return Array.from({ length: 10 }, (_, index) => ({
    key: index,
    on: index < filled,
  }))
}

const createInfoRows = (shoe: Shoe) => {
  const rows: Array<{ label: string; value: string }> = []

  if (shoe.size) {
    rows.push({ label: '尺码', value: shoe.size })
  }
  if (shoe.colorway) {
    rows.push({ label: '配色', value: shoe.colorway })
  }
  if (shoe.gender > 0) {
    rows.push({ label: '性别', value: getGenderText(shoe.gender) })
  }
  if (shoe.releaseYear > 0) {
    rows.push({ label: '上市年份', value: `${shoe.releaseYear}` })
  }
  if (shoe.purchaseDate) {
    rows.push({ label: '购入日期', value: shoe.purchaseDate })
  }
  rows.push({ label: '购入价格', value: `¥${shoe.purchasePrice.toFixed(2)}` })

  return rows
}

Page({
  data: {
    shoeId: 0,
    shoe: null,
    statusLabel: '',
    statusClass: '',
    modelText: '',
    purchasePriceText: '0.00',
    wearScoreText: '-',
    wearSegments: [],
    infoRows: [],
  } as ShoeDetailData,
  onLoad(options: { id?: string }) {
    const shoeId = Number(options.id) || 0
    this.setData({ shoeId })
    this.loadDetail()
  },
  onShow() {
    if (this.data.shoeId) {
      this.loadDetail()
    }
  },
  onShareAppMessage() {
    const shoeName = this.data.shoe?.name

    return {
      title: shoeName ? `我的 ${shoeName}` : '我的网球装备',
      path: this.data.shoeId ? `/pages/shoe-detail/shoe-detail?id=${this.data.shoeId}` : '/pages/shoes/shoes',
    }
  },
  onShareTimeline() {
    const shoeName = this.data.shoe?.name

    return {
      title: shoeName ? `我的 ${shoeName}` : '我的网球装备',
      query: this.data.shoeId ? `id=${this.data.shoeId}` : '',
    }
  },
  async loadDetail() {
    if (!this.data.shoeId) {
      return
    }

    try {
      const shoe = await getShoeDetailFromApi(this.data.shoeId)
      this.setData({
        shoe,
        statusLabel: shoe.status === 1 ? '主力' : shoe.status === 3 ? '退役' : '在用',
        statusClass: shoe.status === 1 ? 'primary' : shoe.status === 3 ? 'retired' : 'active',
        modelText: [shoe.brand, shoe.model].filter(Boolean).join(' '),
        purchasePriceText: shoe.purchasePrice.toFixed(2),
        wearScoreText: shoe.wear ? `${Math.round(shoe.wear.score)}%` : '-',
        wearSegments: getWearSegments(shoe.wear),
        infoRows: createInfoRows(shoe),
      })
    } catch (error) {
      wx.showToast({
        title: error instanceof Error ? error.message : '详情加载失败',
        icon: 'none',
      })
    }
  },
  previewShoeImage() {
    const imageUrl = this.data.shoe?.imageUrl
    if (!imageUrl) {
      return
    }

    wx.previewImage({
      urls: [imageUrl],
      current: imageUrl,
    })
  },
  goEdit() {
    if (!this.data.shoeId) {
      return
    }

    wx.navigateTo({
      url: `/pages/shoe-edit/shoe-edit?id=${this.data.shoeId}`,
    })
  },
})
