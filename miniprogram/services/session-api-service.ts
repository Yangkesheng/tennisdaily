import type { SessionCalendar, SessionCalendarDay, SessionDraft, SessionStats, TennisSession } from '../models/session'
import { ensureLogin } from './auth-service'
import { mapApiSessionToLocal, mapLocalDraftToApiPayload, type ApiSession } from './session-api-mapper'
import { request } from './request'

interface DeleteSessionResponse {
  deleted: boolean
}

interface ApiSessionCalendar {
  year?: number | null
  month?: number | null
  activeDayCount?: number | null
  days?: SessionCalendarDay[] | null
}

const normalizeSessionCalendar = (calendar: ApiSessionCalendar | null, year: number, month: number): SessionCalendar => {
  const days = Array.isArray(calendar?.days) ? calendar.days : []

  return {
    year: calendar?.year || year,
    month: calendar?.month || month,
    activeDayCount: typeof calendar?.activeDayCount === 'number' ? calendar.activeDayCount : days.length,
    days,
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
