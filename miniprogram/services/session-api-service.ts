import type { SessionCalendar, SessionCalendarDay, SessionDraft, SessionPageParams, SessionPageResult, SessionStats, TennisSession } from '../models/session'
import { ensureLogin } from './auth-service'
import { mapApiSessionToLocal, mapLocalDraftToApiPayload, type ApiSession } from './session-api-mapper'
import { request } from './request'

interface DeleteSessionResponse {
  deleted: boolean
}

interface ApiSessionPageResult {
  list?: ApiSession[] | null
  total?: number | null
  page?: number | null
  pageSize?: number | null
  totalPages?: number | null
  hasMore?: boolean | null
}

interface ApiSessionCalendar {
  year?: number | null
  month?: number | null
  activeDayCount?: number | null
  days?: SessionCalendarDay[] | null
}

const normalizeSessionCalendar = (calendar: ApiSessionCalendar | null, year: number, month?: number): SessionCalendar => {
  const days = Array.isArray(calendar?.days) ? calendar.days : []

  return {
    year: calendar?.year || year,
    month: typeof calendar?.month === 'number' ? calendar.month : month || 0,
    activeDayCount: typeof calendar?.activeDayCount === 'number' ? calendar.activeDayCount : days.length,
    days,
  }
}

const normalizeSessionPage = (result: ApiSessionPageResult | null, params: SessionPageParams): SessionPageResult => {
  const list = Array.isArray(result?.list) ? result.list : []

  return {
    list: list.map(mapApiSessionToLocal),
    total: result?.total || 0,
    page: result?.page || params.page,
    pageSize: result?.pageSize || params.pageSize,
    totalPages: result?.totalPages || 0,
    hasMore: !!result?.hasMore,
  }
}

export const listSessionsRemote = async (dateText?: string): Promise<TennisSession[]> => {
  await ensureLogin()
  const query = dateText ? `?date=${encodeURIComponent(dateText)}` : ''
  const sessions = await request<ApiSession[]>({
    url: `/api/sessions${query}`,
  })

  return sessions.map(mapApiSessionToLocal)
}

export const listSessionsPageRemote = async (params: SessionPageParams): Promise<SessionPageResult> => {
  await ensureLogin()
  const queryItems = [
    `page=${params.page}`,
    `pageSize=${params.pageSize}`,
  ]

  if (params.date) {
    queryItems.push(`date=${encodeURIComponent(params.date)}`)
  }

  const result = await request<ApiSessionPageResult>({
    url: `/api/sessions?${queryItems.join('&')}`,
  })

  return normalizeSessionPage(result, params)
}

export const getSessionByIdRemote = async (id: string): Promise<TennisSession | null> => {
  await ensureLogin()
  const session = await request<ApiSession>({
    url: `/api/sessions/${id}`,
  })

  return mapApiSessionToLocal(session)
}

export const getLatestSessionRemote = async (): Promise<TennisSession | null> => {
  await ensureLogin()
  const session = await request<ApiSession | null>({
    url: '/api/sessions/latest',
  })

  return session ? mapApiSessionToLocal(session) : null
}

export const getSessionCalendarRemote = async (year: number, month: number): Promise<SessionCalendar> => {
  await ensureLogin()
  const calendar = await request<ApiSessionCalendar | null>({
    url: `/api/sessions/calendar?year=${year}&month=${month}`,
  })

  return normalizeSessionCalendar(calendar, year, month)
}

export const getSessionYearCalendarRemote = async (year: number): Promise<SessionCalendar> => {
  await ensureLogin()
  const calendar = await request<ApiSessionCalendar | null>({
    url: `/api/sessions/calendar?year=${year}`,
  })

  return normalizeSessionCalendar(calendar, year)
}

export const saveSessionRemote = async (draft: SessionDraft): Promise<TennisSession> => {
  await ensureLogin()
  const session = await request<ApiSession>({
    url: '/api/sessions',
    method: 'POST',
    data: mapLocalDraftToApiPayload(draft),
  })

  return mapApiSessionToLocal(session)
}

export const updateSessionRemote = async (id: string, draft: SessionDraft): Promise<TennisSession> => {
  await ensureLogin()
  const session = await request<ApiSession>({
    url: `/api/sessions/${id}`,
    method: 'PUT',
    data: mapLocalDraftToApiPayload(draft),
  })

  return mapApiSessionToLocal(session)
}

export const deleteSessionRemote = async (id: string): Promise<boolean> => {
  await ensureLogin()
  const result = await request<DeleteSessionResponse>({
    url: `/api/sessions/${id}`,
    method: 'DELETE',
  })

  return result.deleted
}

export const getSessionStatsRemote = async (): Promise<SessionStats> => {
  await ensureLogin()

  return request<SessionStats>({
    url: '/api/stats/month',
  })
}
