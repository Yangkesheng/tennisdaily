import type { SessionDraft, SessionStats, TennisSession } from '../models/session'
import { ensureLogin } from './auth-service'
import { mapApiSessionToLocal, mapLocalDraftToApiPayload, type ApiSession } from './session-api-mapper'
import { request } from './request'

interface DeleteSessionResponse {
  deleted: boolean
}

export const listSessionsRemote = async (): Promise<TennisSession[]> => {
  await ensureLogin()
  const sessions = await request<ApiSession[]>({
    url: '/api/sessions',
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
