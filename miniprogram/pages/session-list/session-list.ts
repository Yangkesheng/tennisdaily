import type { TennisSession, TennisSessionType } from '../../models/session'
import { deleteSession, listRecentSessions, listSessions, listSessionsByDate } from '../../services/session-service'

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
    case 'match':
      return '比赛'
    default:
      return '未分类'
  }
}

const getDeleteWidthPx = () => {
  const systemInfo = wx.getSystemInfoSync()

  return Math.round((systemInfo.windowWidth * 150) / 750)
}

const withTypeLabel = (sessions: TennisSession[]): SessionListItem[] => {
  return sessions.map((session) => ({
    ...session,
    typeLabel: getSessionTypeLabel(session.type),
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
    refreshSessions() {
      const pages = getCurrentPages()
      const currentPage = pages[pages.length - 1] as WechatMiniprogram.Page.Instance<WechatMiniprogram.IAnyObject, WechatMiniprogram.IAnyObject> & {
        options?: {
          date?: string
          range?: string
        }
      }
      const dateFilter = currentPage.options?.date || ''
      const rangeFilter = currentPage.options?.range || ''
      const sessions = dateFilter
        ? listSessionsByDate(dateFilter)
        : rangeFilter === 'recent'
          ? listRecentSessions(30)
          : listSessions()
      const titleText = dateFilter ? dateFilter : rangeFilter === 'recent' ? '近 30 天' : '记录'

      this.setData({
        sessions: withTypeLabel(sessions),
        titleText,
      })
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
        success: (result) => {
          if (!result.confirm) {
            return
          }

          deleteSession(id)
          this.refreshSessions()

          wx.showToast({
            title: '已删除',
            icon: 'success',
          })
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
