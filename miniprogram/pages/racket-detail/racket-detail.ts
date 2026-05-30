import type { Racket, StringingRecord } from '../../models/racket'
import type { TennisSession } from '../../models/session'
import { getRacketDetailFromApi, retireRacketFromApi, setPrimaryRacketFromApi } from '../../services/racket-api-service'
import { listSessionsFromApi } from '../../services/session-service'

interface RacketUsageSummary {
  totalCount: number
  totalMinutes: number
  totalHours: number
  afterStringingCount: number
  afterStringingMinutes: number
  afterStringingHours: number
}

interface RacketDetailData {
  racketId: number
  racket: Racket | null
  stringingRecords: StringingRecord[]
  sessions: TennisSession[]
  usage: RacketUsageSummary
  statusLabel: string
  statusClass: string
  purchasePriceText: string
}

const emptyUsage = (): RacketUsageSummary => ({
  totalCount: 0,
  totalMinutes: 0,
  totalHours: 0,
  afterStringingCount: 0,
  afterStringingMinutes: 0,
  afterStringingHours: 0,
})

const getUsageSummary = (racket: Racket, sessions: TennisSession[]): RacketUsageSummary => {
  const racketSessions = sessions.filter((session) => session.racketId === racket.id)
  const totalMinutes = racketSessions.reduce((sum, session) => sum + session.durationMinutes, 0)
  const afterStringingSessions = racket.lastStringDate
    ? racketSessions.filter((session) => session.date >= racket.lastStringDate)
    : []
  const afterStringingMinutes = afterStringingSessions.reduce((sum, session) => sum + session.durationMinutes, 0)

  return {
    totalCount: racketSessions.length,
    totalMinutes,
    totalHours: Math.floor(totalMinutes / 60),
    afterStringingCount: afterStringingSessions.length,
    afterStringingMinutes,
    afterStringingHours: Math.floor(afterStringingMinutes / 60),
  }
}

Page({
  data: {
    racketId: 0,
    racket: null,
    stringingRecords: [],
    sessions: [],
    usage: emptyUsage(),
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
      const [detail, sessions] = await Promise.all([getRacketDetailFromApi(this.data.racketId), listSessionsFromApi()])
      const racket = detail.racket
      this.setData({
        racket,
        stringingRecords: detail.stringingRecords,
        sessions,
        usage: getUsageSummary(racket, sessions),
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
