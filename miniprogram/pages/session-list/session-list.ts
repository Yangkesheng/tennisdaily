import type { MatchRank, SessionPageResult, TennisSession, TennisSessionType } from '../../models/session'
import {
  deleteSessionFromApi,
  listSessionsByDateFromApi,
  listSessionsPageFromApi,
} from '../../services/session-service'

interface SessionListItem extends TennisSession {
  typeLabel: string
  typeClass: string
  offsetX: number
  deleteOpacity: number
}

interface SessionListData {
  sessions: SessionListItem[]
  titleText: string
  routeDateFilter: string
  routeRangeFilter: string
  page: number
  pageSize: number
  pageSizeInput: string
  total: number
  totalPages: number
  hasMore: boolean
  paginationText: string
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

const getSessionTypeClass = (type: TennisSessionType) => {
  switch (type) {
    case 'training':
      return 'training'
    case 'singles':
      return 'singles'
    case 'doubles':
      return 'doubles'
    case 'singlesMatch':
      return 'singles-match'
    case 'doublesMatch':
      return 'doubles-match'
    default:
      return 'default'
  }
}

const withTypeLabel = (sessions: TennisSession[]): SessionListItem[] => {
  return sessions.map((session) => ({
    ...session,
    typeLabel: getSessionTypeDisplay(session),
    typeClass: getSessionTypeClass(session.type),
    offsetX: 0,
    deleteOpacity: 0,
  }))
}

const DEFAULT_PAGE_SIZE = 10
const MIN_PAGE_SIZE = 1
const MAX_PAGE_SIZE = 100

const normalizePageSize = (value: string | number) => {
  const pageSize = Number(value) || DEFAULT_PAGE_SIZE

  return Math.min(MAX_PAGE_SIZE, Math.max(MIN_PAGE_SIZE, Math.floor(pageSize)))
}

const createPaginationText = (result: SessionPageResult) => {
  if (!result.total) {
    return '共 0 条'
  }

  return `共 ${result.total} 条`
}

Page({
  data: {
    sessions: [],
    titleText: '记录',
    routeDateFilter: '',
    routeRangeFilter: '',
    page: 1,
    pageSize: DEFAULT_PAGE_SIZE,
    pageSizeInput: `${DEFAULT_PAGE_SIZE}`,
    total: 0,
    totalPages: 0,
    hasMore: false,
    paginationText: '共 0 条',
    swipeStartX: 0,
    swipeStartOffset: 0,
    swipingSessionId: '',
    deleteWidthPx: getDeleteWidthPx(),
  } as SessionListData,
  onLoad(options: { date?: string; range?: string }) {
    this.setData({
      routeDateFilter: options.date || '',
      routeRangeFilter: options.range || '',
      page: 1,
    })
  },
  onShow() {
    this.refreshSessions()
  },
  async refreshSessions() {
      const dateFilter = this.data.routeDateFilter
      const rangeFilter = this.data.routeRangeFilter
      const titleText = dateFilter ? dateFilter : rangeFilter === 'recent' ? '最近记录' : '记录'

      try {
        if (dateFilter) {
          const sessions = await listSessionsByDateFromApi(dateFilter)

          this.setData({
            sessions: withTypeLabel(sessions),
            titleText,
            page: 1,
            pageSize: sessions.length || this.data.pageSize,
            pageSizeInput: `${sessions.length || this.data.pageSize}`,
            total: sessions.length,
            totalPages: sessions.length ? 1 : 0,
            hasMore: false,
            paginationText: `共 ${sessions.length} 条`,
          })
          return
        }

        const result = await listSessionsPageFromApi({
          page: this.data.page,
          pageSize: this.data.pageSize,
        })

        this.setData({
          sessions: withTypeLabel(result.list),
          titleText,
          page: result.page,
          pageSize: result.pageSize,
          pageSizeInput: `${result.pageSize}`,
          total: result.total,
          totalPages: result.totalPages,
          hasMore: result.hasMore,
          paginationText: createPaginationText(result),
        })
      } catch (error) {
        wx.showToast({
          title: error instanceof Error ? error.message : '服务暂时不可用',
          icon: 'none',
        })
      }
    },
    onPageSizeInput(event: { detail: { value: string } }) {
      this.setData({
        pageSizeInput: event.detail.value,
      })
    },
    applyPageSize() {
      const pageSize = normalizePageSize(this.data.pageSizeInput)

      this.setData({
        page: 1,
        pageSize,
        pageSizeInput: `${pageSize}`,
      })
      this.refreshSessions()
    },
    goPrevPage() {
      if (this.data.page <= 1) {
        return
      }

      this.setData({
        page: this.data.page - 1,
      })
      this.refreshSessions()
    },
    goNextPage() {
      if (!this.data.hasMore) {
        return
      }

      this.setData({
        page: this.data.page + 1,
      })
      this.refreshSessions()
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
})
