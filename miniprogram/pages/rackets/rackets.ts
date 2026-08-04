import type { Racket } from '../../models/racket'
import { deleteRacketFromApi, listRacketsFromApi } from '../../services/racket-api-service'

interface RacketView extends Racket {
  statusLabel: string
  statusClass: string
  stringingText: string
}

interface RacketsData {
  rackets: Racket[]
  visibleRackets: RacketView[]
  touchStartX: number
  touchStartY: number
  openedRacketId: number
  isSwipeAction: boolean
}

const getStringingText = (racket: Racket) => {
  if (!racket.stringName) {
    return ''
  }

  if (racket.verticalTension && racket.horizontalTension) {
    const tensionText = racket.verticalTension === racket.horizontalTension
      ? `${racket.verticalTension}磅`
      : `竖${racket.verticalTension} / 横${racket.horizontalTension}磅`

    return `${racket.stringName} · ${tensionText}`
  }

  return racket.stringName
}

const createRacketView = (racket: Racket): RacketView => {
  return {
    ...racket,
    statusLabel: racket.status === 1 ? '主力' : racket.status === 3 ? '退役' : '在用',
    statusClass: racket.status === 1 ? 'primary' : racket.status === 3 ? 'retired' : 'active',
    stringingText: getStringingText(racket),
  }
}

Component({
  data: {
    rackets: [],
    visibleRackets: [],
    touchStartX: 0,
    touchStartY: 0,
    openedRacketId: 0,
    isSwipeAction: false,
  } as RacketsData,
  pageLifetimes: {
    show() {
      this.refreshRackets()
    },
  },
  methods: {
    async refreshRackets() {
      try {
        const rackets = await listRacketsFromApi(true)

        this.setData({
          rackets,
          visibleRackets: rackets.map(createRacketView),
        })
      } catch (error) {
        wx.showToast({
          title: error instanceof Error ? error.message : '服务暂时不可用',
          icon: 'none',
        })
      }
    },
    onTouchStart(event: WechatMiniprogram.TouchEvent) {
      const touch = event.touches[0]
      if (!touch) {
        return
      }

      this.setData({
        touchStartX: touch.clientX,
        touchStartY: touch.clientY,
      })
    },
    onTouchEnd(event: WechatMiniprogram.TouchEvent) {
      const touch = event.changedTouches[0]
      const id = Number(event.currentTarget.dataset.id) || 0
      if (!touch || !id) {
        return
      }

      const deltaX = touch.clientX - this.data.touchStartX
      const deltaY = touch.clientY - this.data.touchStartY
      if (Math.abs(deltaY) > 50 || Math.abs(deltaX) < 60) {
        return
      }

      this.setData({
        openedRacketId: deltaX < 0 ? id : 0,
        isSwipeAction: true,
      })
    },
    deleteRacket(event: WechatMiniprogram.TouchEvent) {
      const id = Number(event.currentTarget.dataset.id) || 0
      if (!id) {
        return
      }

      wx.showModal({
        title: '删除球拍',
        content: '删除后不会在列表中显示，历史记录不受影响',
        confirmText: '删除',
        confirmColor: '#d93025',
        success: async (res) => {
          if (!res.confirm) {
            return
          }

          try {
            await deleteRacketFromApi(id)
            wx.showToast({ title: '已删除', icon: 'success' })
            this.setData({ openedRacketId: 0 })
            this.refreshRackets()
          } catch (error) {
            wx.showToast({
              title: error instanceof Error ? error.message : '删除失败',
              icon: 'none',
            })
          }
        },
      })
    },
    goDetail(event: WechatMiniprogram.TouchEvent) {
      const id = event.currentTarget.dataset.id as number | undefined

      if (this.data.isSwipeAction) {
        this.setData({
          isSwipeAction: false,
        })
        return
      }

      if (!id || this.data.openedRacketId === id) {
        return
      }

      wx.navigateTo({
        url: `/pages/racket-detail/racket-detail?id=${id}`,
      })
    },
    addRacket() {
      wx.navigateTo({
        url: '/pages/racket-library/racket-library',
      })
    },
    onShareAppMessage() {
      return {
        title: '我的网球装备',
        path: '/pages/rackets/rackets',
      }
    },
    onShareTimeline() {
      return {
        title: '我的网球装备',
      }
    },
  },
})
