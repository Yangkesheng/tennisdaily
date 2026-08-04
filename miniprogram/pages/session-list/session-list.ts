import type { SessionPageResult, TennisSession, TennisSessionType } from '../../models/session'
import {
  deleteSessionFromApi,
  listSessionsByDateFromApi,
  listSessionsPageFromApi,
} from '../../services/session-service'
import type { SessionDisplayField, SessionDisplayFieldOption } from '../../utils/session-display'
import {
  SESSION_DISPLAY_FIELD_OPTIONS,
  loadVisibleDisplayFields,
  saveVisibleDisplayFields,
} from '../../utils/session-display'

interface SessionListItem extends TennisSession {
  typeLabel: string
  typeClass: string
  offsetX: number
  deleteOpacity: number
  showDuration: boolean
  showCourtName: boolean
  showPartner: boolean
  showRacketName: boolean
  showShoeName: boolean
  showCost: boolean
  showNote: boolean
}

interface SessionDisplayFieldView extends SessionDisplayFieldOption {
  visible: boolean
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
  showDisplaySettings: boolean
  visibleFields: SessionDisplayField[]
  displayFieldOptions: SessionDisplayFieldView[]
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

const getSessionTypeDisplay = (session: TennisSession) => {
  const typeLabel = session.typeText || getSessionTypeLabel(session.type)
  const rankLabel = session.matchRankLabel || ''

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

const createShowFlags = (visibleFields: SessionDisplayField[]) => {
  const visible = new Set(visibleFields)

  return {
    showDuration: visible.has('duration'),
    showCourtName: visible.has('courtName'),
    showPartner: visible.has('partner'),
    showRacketName: visible.has('racketName'),
    showShoeName: visible.has('shoeName'),
    showCost: visible.has('cost'),
    showNote: visible.has('note'),
  }
}

const withTypeLabel = (sessions: TennisSession[], visibleFields: SessionDisplayField[]): SessionListItem[] => {
  return sessions.map((session) => ({
    ...session,
    typeLabel: getSessionTypeDisplay(session),
    typeClass: getSessionTypeClass(session.type),
    offsetX: 0,
    deleteOpacity: 0,
    ...createShowFlags(visibleFields),
  }))
}

const buildDisplayFieldOptions = (visibleFields: SessionDisplayField[]): SessionDisplayFieldView[] => {
  return SESSION_DISPLAY_FIELD_OPTIONS.map((option) => ({
    ...option,
    visible: visibleFields.includes(option.key),
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
    showDisplaySettings: false,
    visibleFields: [],
    displayFieldOptions: [],
  } as SessionListData,
  onLoad(options: { date?: string; range?: string }) {
    const visibleFields = loadVisibleDisplayFields()

    this.setData({
      routeDateFilter: options.date || '',
      routeRangeFilter: options.range || '',
      page: 1,
      visibleFields,
      displayFieldOptions: buildDisplayFieldOptions(visibleFields),
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
            sessions: withTypeLabel(sessions, this.data.visibleFields),
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
          sessions: withTypeLabel(result.list, this.data.visibleFields),
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
    applyDisplayFields() {
      this.setData({
        sessions: this.data.sessions.map((session) => ({
          ...session,
          ...createShowFlags(this.data.visibleFields),
        })),
      })
    },
    openDisplaySettings() {
      this.setData({
        showDisplaySettings: true,
      })
    },
    closeDisplaySettings() {
      this.setData({
        showDisplaySettings: false,
      })
    },
    noop() {
      // 阻止点击冒泡与滚动穿透
    },
    onToggleDisplayField(event: WechatMiniprogram.TouchEvent) {
      const key = event.currentTarget.dataset.field as SessionDisplayField
      const displayFieldOptions = this.data.displayFieldOptions.map((option) =>
        option.key === key ? { ...option, visible: !option.visible } : option,
      )
      const visibleFields = displayFieldOptions.filter((option) => option.visible).map((option) => option.key)

      saveVisibleDisplayFields(visibleFields)
      this.setData({
        displayFieldOptions,
        visibleFields,
      })
      this.applyDisplayFields()
    },
    resetDisplayFields() {
      const visibleFields = SESSION_DISPLAY_FIELD_OPTIONS.map((option) => option.key)

      saveVisibleDisplayFields(visibleFields)
      this.setData({
        displayFieldOptions: buildDisplayFieldOptions(visibleFields),
        visibleFields,
      })
      this.applyDisplayFields()
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
