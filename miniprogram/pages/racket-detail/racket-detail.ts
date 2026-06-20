import type { Racket, StringingRecord } from '../../models/racket'
import { getRacketDetailFromApi } from '../../services/racket-api-service'

interface RacketDetailData {
  racketId: number
  racket: Racket | null
  stringingRecords: StringingRecord[]
  statusLabel: string
  statusClass: string
  purchasePriceText: string
}

Page({
  data: {
    racketId: 0,
    racket: null,
    stringingRecords: [],
    statusLabel: '',
    statusClass: '',
    purchasePriceText: '0.00',
  } as RacketDetailData,
  onLoad(options: { id?: string }) {
    const racketId = Number(options.id) || 0
    this.setData({ racketId })
    this.loadDetail()
  },
  onShow() {
    if (this.data.racketId) {
      this.loadDetail()
    }
  },
  async loadDetail() {
    if (!this.data.racketId) {
      return
    }

    try {
      const detail = await getRacketDetailFromApi(this.data.racketId)
      const racket = detail.racket
      this.setData({
        racket,
        stringingRecords: detail.stringingRecords,
        statusLabel: racket.status === 1 ? '主力' : racket.status === 3 ? '退役' : '在用',
        statusClass: racket.status === 1 ? 'primary' : racket.status === 3 ? 'retired' : 'active',
        purchasePriceText: racket.purchasePrice.toFixed(2),
      })
    } catch (error) {
      wx.showToast({
        title: error instanceof Error ? error.message : '详情加载失败',
        icon: 'none',
      })
    }
  },
  goStringing() {
    if (!this.data.racket) {
      return
    }

    wx.navigateTo({
      url: `/pages/stringing-edit/stringing-edit?id=${this.data.racket.id}&name=${encodeURIComponent(this.data.racket.name)}`,
    })
  },
  goEdit() {
    if (!this.data.racketId) {
      return
    }

    wx.navigateTo({
      url: `/pages/racket-edit/racket-edit?id=${this.data.racketId}`,
    })
  },
})
