import type { Racket, StringingRecord } from '../../models/racket'
import { deleteStringingRecordFromApi, getRacketDetailFromApi } from '../../services/racket-api-service'

interface RacketDetailData {
  racketId: number
  racket: Racket | null
  stringingRecords: StringingRecord[]
  statusLabel: string
  statusClass: string
  purchasePriceText: string
  touchStartX: number
  touchStartY: number
  openedRecordId: number
  isSwipeAction: boolean
}

Page({
  data: {
    racketId: 0,
    racket: null,
    stringingRecords: [],
    statusLabel: '',
    statusClass: '',
    purchasePriceText: '0.00',
    touchStartX: 0,
    touchStartY: 0,
    openedRecordId: 0,
    isSwipeAction: false,
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
        openedRecordId: 0,
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
  onRecordTouchStart(event: WechatMiniprogram.TouchEvent) {
    const touch = event.touches[0]
    if (!touch) {
      return
    }

    this.setData({
      touchStartX: touch.clientX,
      touchStartY: touch.clientY,
    })
  },
  onRecordTouchEnd(event: WechatMiniprogram.TouchEvent) {
    const touch = event.changedTouches[0]
    const recordId = Number(event.currentTarget.dataset.id) || 0
    if (!touch || !recordId) {
      return
    }

    const deltaX = touch.clientX - this.data.touchStartX
    const deltaY = touch.clientY - this.data.touchStartY
    if (Math.abs(deltaY) > 50 || Math.abs(deltaX) < 60) {
      return
    }

    this.setData({
      openedRecordId: deltaX < 0 ? recordId : 0,
      isSwipeAction: true,
    })
  },
  editStringingRecord(event: WechatMiniprogram.TouchEvent) {
    const recordId = Number(event.currentTarget.dataset.id) || 0
    if (this.data.isSwipeAction) {
      this.setData({ isSwipeAction: false })
      return
    }
    if (!this.data.racket || !recordId || this.data.openedRecordId === recordId) {
      return
    }

    const record = this.data.stringingRecords.find((item) => item.id === recordId)
    if (!record) {
      return
    }

    const query = [
      `id=${this.data.racket.id}`,
      `name=${encodeURIComponent(this.data.racket.name)}`,
      `recordId=${record.id}`,
      `stringName=${encodeURIComponent(record.stringName)}`,
      `storeName=${encodeURIComponent(record.storeName || '')}`,
      `verticalTension=${encodeURIComponent(`${record.verticalTension || ''}`)}`,
      `horizontalTension=${encodeURIComponent(`${record.horizontalTension || ''}`)}`,
      `cost=${encodeURIComponent(`${record.cost || ''}`)}`,
      `stringDate=${encodeURIComponent(record.stringDate || '')}`,
    ].join('&')

    wx.navigateTo({
      url: `/pages/stringing-edit/stringing-edit?${query}`,
    })
  },
  deleteStringingRecord(event: WechatMiniprogram.TouchEvent) {
    const recordId = Number(event.currentTarget.dataset.id) || 0
    if (!this.data.racketId || !recordId) {
      return
    }

    wx.showModal({
      title: '删除穿线记录',
      content: '删除后不会在穿线记录中显示',
      confirmText: '删除',
      confirmColor: '#d93025',
      success: async (res) => {
        if (!res.confirm) {
          return
        }

        try {
          await deleteStringingRecordFromApi(this.data.racketId, recordId)
          wx.showToast({ title: '已删除', icon: 'success' })
          this.setData({ openedRecordId: 0 })
          this.loadDetail()
        } catch (error) {
          wx.showToast({
            title: error instanceof Error ? error.message : '删除失败',
            icon: 'none',
          })
        }
      },
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
