import type { Racket, StringingRecord } from '../../models/racket'
import { getRacketDetailFromApi, retireRacketFromApi, setPrimaryRacketFromApi } from '../../services/racket-api-service'

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
  async setPrimary() {
    if (!this.data.racketId) {
      return
    }

    try {
      await setPrimaryRacketFromApi(this.data.racketId)
      wx.showToast({ title: '已设为主力', icon: 'success' })
      this.loadDetail()
    } catch (error) {
      wx.showToast({
        title: error instanceof Error ? error.message : '设置失败',
        icon: 'none',
      })
    }
  },
  retireRacket() {
    if (!this.data.racketId) {
      return
    }

    wx.showModal({
      title: '退役球拍',
      content: '退役后新增记录时不可再选择，历史记录不受影响',
      confirmText: '退役',
      success: async (res) => {
        if (!res.confirm) {
          return
        }

        try {
          await retireRacketFromApi(this.data.racketId)
          wx.showToast({ title: '已退役', icon: 'success' })
          this.loadDetail()
        } catch (error) {
          wx.showToast({
            title: error instanceof Error ? error.message : '退役失败',
            icon: 'none',
          })
        }
      },
    })
  },
})
