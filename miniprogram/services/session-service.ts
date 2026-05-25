import type { SessionDraft, SessionStats, TennisSession } from '../models/session'

const STORAGE_KEY = 'tennis_sessions'

const isCurrentMonth = (dateText: string) => {
  const sessionDate = new Date(`${dateText}T00:00:00`)
  const now = new Date()

  return (
    sessionDate.getFullYear() === now.getFullYear() &&
    sessionDate.getMonth() === now.getMonth()
  )
}

const sortSessions = (sessions: TennisSession[]) => {
  return sessions.sort((a, b) => {
    const dateDiff = new Date(b.date).getTime() - new Date(a.date).getTime()

    if (dateDiff !== 0) {
      return dateDiff
    }

    return b.createdAt - a.createdAt
  })
}

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
    cost: 0,
    racketName: '',
    shoeName: '',
    note: '',
  }
}

export const listSessions = (): TennisSession[] => {
  const sessions = wx.getStorageSync(STORAGE_KEY) as TennisSession[] | ''

  if (!Array.isArray(sessions)) {
    return []
  }

  return sortSessions(sessions)
}

export const saveSession = (draft: SessionDraft): TennisSession => {
  const now = Date.now()
  const session: TennisSession = {
    ...draft,
    id: `session_${now}`,
    createdAt: now,
    updatedAt: now,
  }
  const sessions = listSessions()

  wx.setStorageSync(STORAGE_KEY, sortSessions([session, ...sessions]))

  return session
}

export const updateSession = (id: string, draft: SessionDraft): TennisSession | null => {
  const sessions = listSessions()
  const targetSession = sessions.find((session) => session.id === id)

  if (!targetSession) {
    return null
  }

  const updatedSession: TennisSession = {
    ...targetSession,
    ...draft,
    id,
    updatedAt: Date.now(),
  }

  wx.setStorageSync(
    STORAGE_KEY,
    sortSessions(sessions.map((session) => (session.id === id ? updatedSession : session))),
  )

  return updatedSession
}

export const deleteSession = (id: string): boolean => {
  const sessions = listSessions()
  const nextSessions = sessions.filter((session) => session.id !== id)

  if (nextSessions.length === sessions.length) {
    return false
  }

  wx.setStorageSync(STORAGE_KEY, sortSessions(nextSessions))

  return true
}

export const getSessionById = (id: string): TennisSession | null => {
  return listSessions().find((session) => session.id === id) || null
}

export const listSessionsByDate = (dateText: string): TennisSession[] => {
  return listSessions().filter((session) => session.date === dateText)
}

export const listRecentSessions = (days: number): TennisSession[] => {
  const now = new Date(`${getTodayText()}T23:59:59`)
  const start = new Date(now)
  start.setDate(start.getDate() - days + 1)

  return listSessions().filter((session) => {
    const sessionDate = new Date(`${session.date}T00:00:00`)

    return sessionDate >= start && sessionDate <= now
  })
}

export const getLatestSession = (): TennisSession | null => {
  const [latestSession] = listSessions()

  return latestSession || null
}

export const getSessionStats = (): SessionStats => {
  const sessions = listSessions()
  const monthSessions = sessions.filter((session) => isCurrentMonth(session.date))

  return {
    monthCount: monthSessions.length,
    monthMinutes: monthSessions.reduce((total, session) => total + session.durationMinutes, 0),
    monthCost: monthSessions.reduce((total, session) => total + session.cost, 0),
    totalCount: sessions.length,
  }
}
