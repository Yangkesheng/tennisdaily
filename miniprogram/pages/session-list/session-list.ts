import type { TennisSession, TennisSessionType } from '../../models/session'
import { listRecentSessions, listSessions, listSessionsByDate } from '../../services/session-service'

interface SessionListItem extends TennisSession {
  typeLabel: string
}

interface SessionListData {
  sessions: SessionListItem[]
  titleText: string
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

const withTypeLabel = (sessions: TennisSession[]): SessionListItem[] => {
  return sessions.map((session) => ({
    ...session,
    typeLabel: getSessionTypeLabel(session.type),
  }))
}

Component({
  data: {
    sessions: [],
    titleText: '记录',
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
