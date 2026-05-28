import type { MatchRank, TennisSession, TennisSessionType } from '../../models/session'
import {
  deleteSessionFromApi,
  listRecentSessionsFromApi,
  listSessionsByDateFromApi,
  listSessionsFromApi,
} from '../../services/session-service'

interface SessionListItem extends TennisSession {
  typeLabel: string
  offsetX: number
  deleteOpacity: number
}

interface SessionListData {
  sessions: SessionListItem[]
  titleText: string
  swipeStartX: number
  swipeStartOffset: number
  swipingSessionId: string
  deleteWidthPx: number
}

const getSessionTypeLabel = (type: TennisSessionType) => {
  switch (type) {
    case 'singles':
      return '单打'
    case 'doubles':
      return '双打'
    case 'training':
      return '训练'
    case 'singlesMatch':
      return '单打比赛'
    case 'doublesMatch':
      return '双打比赛'
    default:
      return '未分类'
  }
}

const getMatchRankLabel = (rank: MatchRank) => {
  switch (rank) {
    case 'champion':
      return '冠军'
    case 'runnerUp':
      return '亚军'
    case 'semiFinal':
      return '四强'
    case 'quarterFinal':
      return '八强'
    case 'groupStage':
      return '小组赛'
    default:
      return ''
  }
}

const getSessionTypeDisplay = (session: TennisSession) => {
  const typeLabel = getSessionTypeLabel(session.type)
  const rankLabel = getMatchRankLabel(session.matchRank)

  if ((session.type === 'singlesMatch' || session.type === 'doublesMatch') && rankLabel) {
    return `${typeLabel} ${rankLabel}`
  }

  return typeLabel
}

interface WindowInfoCompat {
  windowWidth: number
}

interface WxWindowInfoCompat {
  getWindowInfo?: () => WindowInfoCompat
}

const getDeleteWidthPx = () => {
  const wxInfo = wx as unknown as WxWindowInfoCompat
  const windowWidth = wxInfo.getWindowInfo ? wxInfo.getWindowInfo().windowWidth : 375

  return Math.round((windowWidth * 150) / 750)
}

const withTypeLabel = (sessions: TennisSession[]): SessionListItem[] => {
  return sessions.map((session) => ({
    ...session,
    typeLabel: getSessionTypeDisplay(session),
    offsetX: 0,
    deleteOpacity: 0,
  }))
}

Component({
  data: {
    sessions: [],
    titleText: '记录',
    swipeStartX: 0,
    swipeStartOffset: 0,
    swipingSessionId: '',
    deleteWidthPx: getDeleteWidthPx(),
  } as SessionListData,
  pageLifetimes: {
    show() {
      this.refreshSessions()
    },
  },
  methods: {
    async refreshSessions() {
      const pages = getCurrentPages()
      const currentPage = pages[pages.length - 1] as WechatMiniprogram.Page.Instance<WechatMiniprogram.IAnyObject, WechatMiniprogram.IAnyObject> & {
        options?: {
          date?: string
          range?: string
        }
      }
      const dateFilter = currentPage.options?.date || ''
      const rangeFilter = currentPage.options?.range || ''
      const titleText = dateFilter ? dateFilter : rangeFilter === 'recent' ? '近 30 天' : '记录'

      try {
        const sessions = dateFilter
          ? await listSessionsByDateFromApi(dateFilter)
          : rangeFilter === 'recent'
            ? await listRecentSessionsFromApi(30)
            : await listSessionsFromApi()

        this.setData({
          sessions: withTypeLabel(sessions),
          titleText,
        })
      } catch (error) {
        wx.showToast({
          title: error instanceof Error ? error.message : '服务暂时不可用',
          icon: 'none',
        })
      }
    },
    onSwipeStart(event: WechatMiniprogram.TouchEvent) {
      const id = event.currentTarget.dataset.id as string | undefined
      const touch = event.touches[0]

      if (!id || !touch) {
        return
      }

      const currentSession = this.data.sessions.find((session) => session.id === id)

      this.setData({
        swipeStartX: touch.clientX,
        swipeStartOffset: currentSession?.offsetX || 0,
        swipingSessionId: id,
      })
    },
    onSwipeMove(event: WechatMiniprogram.TouchEvent) {
      const id = event.currentTarget.dataset.id as string | undefined
      const touch = event.touches[0]

      if (!id || !touch || id !== this.data.swipingSessionId) {
        return
      }

      const deltaX = touch.clientX - this.data.swipeStartX
      const swipeDeleteOffset = -this.data.deleteWidthPx
      const nextOffset = Math.min(0, Math.max(swipeDeleteOffset, this.data.swipeStartOffset + deltaX))

      this.setData({
        sessions: this.data.sessions.map((session) => ({
          ...session,
          offsetX: session.id === id ? nextOffset : 0,
          deleteOpacity: session.id === id && nextOffset < -8 ? 1 : 0,
        })),
      })
    },
    onSwipeEnd(event: WechatMiniprogram.TouchEvent) {
      const id = event.currentTarget.dataset.id as string | undefined

      if (!id) {
        return
      }

      const currentSession = this.data.sessions.find((session) => session.id === id)
      const swipeDeleteOffset = -this.data.deleteWidthPx
      const shouldOpen = (currentSession?.offsetX || 0) <= swipeDeleteOffset / 2

      this.setData({
        sessions: this.data.sessions.map((session) => ({
          ...session,
          offsetX: session.id === id && shouldOpen ? swipeDeleteOffset : 0,
          deleteOpacity: session.id === id && shouldOpen ? 1 : 0,
        })),
        swipingSessionId: '',
      })
    },
    confirmDeleteSession(event: WechatMiniprogram.TouchEvent) {
      const id = event.currentTarget.dataset.id as string | undefined

      if (!id) {
        return
      }

      wx.showModal({
        title: '删除记录',
        content: '确定删除这次打球记录吗？',
        confirmText: '删除',
        confirmColor: '#e85d75',
        success: async (result) => {
          if (!result.confirm) {
            return
          }

          try {
            await deleteSessionFromApi(id)
            this.refreshSessions()

            wx.showToast({
              title: '已删除',
              icon: 'success',
            })
          } catch (error) {
            wx.showToast({
              title: error instanceof Error ? error.message : '删除失败',
              icon: 'none',
            })
          }
        },
      })
    },
    goEditSession(event: WechatMiniprogram.TouchEvent) {
      const id = event.currentTarget.dataset.id as string | undefined

      if (!id) {
        return
      }

      wx.navigateTo({
        url: `/pages/session-edit/session-edit?id=${id}`,
      })
    },
  },
})
