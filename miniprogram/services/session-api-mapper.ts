import type { MatchRank, SessionDraft, TennisSession, TennisSessionType } from '../models/session'

export interface ApiSession {
  id: number
  date: string
  durationMinutes: number
  rating: number
  type: number
  typeLabel: string
  matchRank: number
  matchRankLabel: string
  courtName: string
  partner?: string
  cost: number
  racketId?: number
  racketName: string
  shoeName: string
  note: string
  createdAt: string
  updatedAt: string
}

export interface ApiSessionPayload {
  date: string
  durationMinutes: number
  rating: number
  type: number
  matchRank: number
  courtName: string
  partner: string
  cost: number
  racketId: number
  racketName: string
  shoeName: string
  note: string
}

const localTypeToApi: Record<TennisSessionType, number> = {
  '': 1,
  doubles: 1,
  singles: 2,
  training: 3,
  singlesMatch: 4,
  doublesMatch: 5,
}

const localRankToApi: Record<MatchRank, number> = {
  '': 0,
  champion: 1,
  runnerUp: 2,
  semiFinal: 3,
  quarterFinal: 4,
  groupStage: 5,
}

const apiTypeToLocal = (type: number): TennisSessionType => {
  switch (type) {
    case 1:
      return 'doubles'
    case 2:
      return 'singles'
    case 3:
      return 'training'
    case 4:
      return 'singlesMatch'
    case 5:
      return 'doublesMatch'
    default:
      return ''
  }
}

const apiRankToLocal = (rank: number): MatchRank => {
  switch (rank) {
    case 1:
      return 'champion'
    case 2:
      return 'runnerUp'
    case 3:
      return 'semiFinal'
    case 4:
      return 'quarterFinal'
    case 5:
      return 'groupStage'
    default:
      return ''
  }
}

const parseApiTime = (timeText: string) => {
  const time = new Date(timeText).getTime()

  return Number.isNaN(time) ? Date.now() : time
}

export const mapApiSessionToLocal = (session: ApiSession): TennisSession => {
  return {
    id: `${session.id}`,
    date: session.date,
    durationMinutes: session.durationMinutes,
    rating: session.rating,
    courtName: session.courtName || '',
    partner: session.partner || '',
    type: apiTypeToLocal(session.type),
    matchRank: apiRankToLocal(session.matchRank),
    cost: session.cost || 0,
    racketId: session.racketId || 0,
    racketName: session.racketName || '',
    shoeName: session.shoeName || '',
    note: session.note || '',
    createdAt: parseApiTime(session.createdAt),
    updatedAt: parseApiTime(session.updatedAt),
  }
}

export const mapLocalDraftToApiPayload = (draft: SessionDraft): ApiSessionPayload => {
  const type = localTypeToApi[draft.type]
  const isMatchType = draft.type === 'singlesMatch' || draft.type === 'doublesMatch'

  return {
    date: draft.date,
    durationMinutes: draft.durationMinutes,
    rating: draft.rating,
    type,
    matchRank: isMatchType ? localRankToApi[draft.matchRank] : 0,
    courtName: draft.courtName,
    partner: draft.partner,
    cost: draft.cost,
    racketId: draft.racketId,
    racketName: draft.racketName,
    shoeName: draft.shoeName,
    note: draft.note,
  }
}
