import type { Racket, RacketFilter } from '../../models/racket'
import type { TennisSession } from '../../models/session'
import { deleteRacketFromApi, listRacketsFromApi } from '../../services/racket-api-service'
import { listSessionsFromApi } from '../../services/session-service'

interface RacketUsageSummary {
  totalCount: number
  totalMinutes: number
  totalHours: number
  afterStringingCount: number
  afterStringingMinutes: number
  afterStringingHours: number
}

interface RacketView extends Racket {
  statusLabel: string
  statusClass: string
  usage: RacketUsageSummary
}

interface RacketsData {
  filter: RacketFilter
  rackets: Racket[]
  sessions: TennisSession[]
  visibleRackets: RacketView[]
  touchStartX: number
  touchStartY: number
  openedRacketId: number
}

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

const createRacketView = (racket: Racket, sessions: TennisSession[]): RacketView => {
  return {
    ...racket,
    statusLabel: racket.status === 1 ? '主力' : racket.status === 3 ? '退役' : '',
    statusClass: racket.status === 1 ? 'primary' : racket.status === 3 ? 'retired' : '',
    usage: getUsageSummary(racket, sessions),
  }
}

const filterRackets = (rackets: Racket[], filter: RacketFilter) => {
  if (filter === 'using') {
    return rackets.filter((racket) => racket.status === 1 || racket.status === 2)
  }

  return rackets.filter((racket) => racket.status === 3)
}

Component({
  data: {
    filter: 'using',
    rackets: [],
    sessions: [],
    visibleRackets: [],
    touchStartX: 0,
    touchStartY: 0,
    openedRacketId: 0,
  } as RacketsData,
  pageLifetimes: {
    show() {
      this.refreshRackets()
    },
  },
  methods: {
    async refreshRackets() {
      try {
        const [rackets, sessions] = await Promise.all([listRacketsFromApi(true), listSessionsFromApi()])

        this.setData({
          rackets,
          sessions,
          visibleRackets: filterRackets(rackets, this.data.filter).map((racket) => createRacketView(racket, sessions)),
        })
      } catch (error) {
        wx.showToast({
          title: error instanceof Error ? error.message : '服务暂时不可用',
          icon: 'none',
        })
      }
    },
    selectFilter(event: WechatMiniprogram.TouchEvent) {
      const filter = event.currentTarget.dataset.filter as RacketFilter

      this.setData({
        filter,
        visibleRackets: filterRackets(this.data.rackets, filter).map((racket) => createRacketView(racket, this.data.sessions)),
      })
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

  },
})
