import type { SessionCalendar, SessionDraft, SessionPageParams, SessionPageResult, SessionStats, TennisSession } from '../models/session'
import {
  deleteSessionRemote,
  getLatestSessionRemote,
  getSessionCalendarRemote,
  getSessionByIdRemote,
  getSessionStatsRemote,
  listSessionsPageRemote,
  listSessionsRemote,
  saveSessionRemote,
  updateSessionRemote,
} from './session-api-service'

export const getTodayText = () => {
  const now = new Date()
  const year = now.getFullYear()
  const month = `${now.getMonth() + 1}`.padStart(2, '0')
  const day = `${now.getDate()}`.padStart(2, '0')

  return `${year}-${month}-${day}`
}

export const createDefaultSessionDraft = (): SessionDraft => {
  return {
    date: getTodayText(),
    durationMinutes: 120,
    rating: 3,
    courtName: '',
    partner: '',
    type: 'doubles',
    matchRank: '',
    cost: 0,
    racketId: 0,
    racketName: '',
    shoeName: '',
    note: '',
  }
}

export const listSessionsPageFromApi = async (params: SessionPageParams): Promise<SessionPageResult> => {
  return listSessionsPageRemote(params)
}

export const listSessionsByDatePageFromApi = async (dateText: string, page: number, pageSize: number): Promise<SessionPageResult> => {
  return listSessionsPageRemote({ date: dateText, page, pageSize })
}

export const listSessionsFromApi = async (): Promise<TennisSession[]> => {
  return listSessionsRemote()
}

export const listSessionsByDateFromApi = async (dateText: string): Promise<TennisSession[]> => {
  return listSessionsRemote(dateText)
}

export const listRecentSessionsFromApi = async (days: number): Promise<TennisSession[]> => {
  const sessions = await listSessionsFromApi()
  const now = new Date(`${getTodayText()}T23:59:59`)
  const start = new Date(now)
  start.setDate(start.getDate() - days + 1)

  return sessions.filter((session) => {
    const sessionDate = new Date(`${session.date}T00:00:00`)

    return sessionDate >= start && sessionDate <= now
  })
}

export const getLatestSessionFromApi = async (): Promise<TennisSession | null> => {
  return getLatestSessionRemote()
}

export const getSessionCalendarFromApi = async (year: number, month: number): Promise<SessionCalendar> => {
  return getSessionCalendarRemote(year, month)
}

export const getSessionByIdFromApi = async (id: string): Promise<TennisSession | null> => {
  return getSessionByIdRemote(id)
}

export const saveSessionToApi = async (draft: SessionDraft): Promise<TennisSession> => {
  return saveSessionRemote(draft)
}

export const updateSessionToApi = async (id: string, draft: SessionDraft): Promise<TennisSession | null> => {
  return updateSessionRemote(id, draft)
}

export const deleteSessionFromApi = async (id: string): Promise<boolean> => {
  return deleteSessionRemote(id)
}

export const getSessionStatsFromApi = async (): Promise<SessionStats> => {
  return getSessionStatsRemote()
}
