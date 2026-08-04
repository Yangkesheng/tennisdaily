import type { MatchRank, SessionCategory, SessionDraft, SessionSubCategory, TennisSession, TennisSessionType } from '../models/session'
import { SESSION_CATEGORY, getCategoryFromSessionType, getSessionTypeFromCategory } from '../models/session'

export interface ApiSession {
  id: number
  date: string
  durationMinutes: number
  rating: number
  type: number
  typeLabel: string
  category?: number | null
  categoryText?: string | null
  subCategory?: number | null
  subCategoryText?: string | null
  typeText?: string | null
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
  category: number
  subCategory: number
  matchRank: number
  courtName: string
  partner: string
  cost: number
  racketId: number
  shoeName: string
  note: string
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
  return typeof rank === 'number' && !Number.isNaN(rank) ? rank : 0
}

const parseApiTime = (timeText: string) => {
  const time = new Date(timeText).getTime()

  return Number.isNaN(time) ? Date.now() : time
}

const normalizeCategoryPair = (session: ApiSession): { category: SessionCategory; subCategory: SessionSubCategory } => {
  if (session.category && session.subCategory) {
    const category = session.category as SessionCategory
    const subCategory = session.subCategory as SessionSubCategory

    return { category, subCategory }
  }

  return getCategoryFromSessionType(apiTypeToLocal(session.type))
}

const createTypeText = (session: ApiSession, categoryText: string, subCategoryText: string) => {
  if (session.typeText) {
    return session.typeText
  }

  if (categoryText && subCategoryText) {
    return `${categoryText} · ${subCategoryText}`
  }

  return session.typeLabel || ''
}

export const mapApiSessionToLocal = (session: ApiSession): TennisSession => {
  const { category, subCategory } = normalizeCategoryPair(session)
  const categoryText = session.categoryText || ''
  const subCategoryText = session.subCategoryText || ''

  return {
    id: `${session.id}`,
    date: session.date,
    durationMinutes: session.durationMinutes,
    rating: session.rating,
    courtName: session.courtName || '',
    partner: session.partner || '',
    type: getSessionTypeFromCategory(category, subCategory),
    typeText: createTypeText(session, categoryText, subCategoryText),
    category,
    categoryText,
    subCategory,
    subCategoryText,
    matchRank: apiRankToLocal(session.matchRank),
    matchRankLabel: session.matchRankLabel || '',
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
  const category = draft.category || getCategoryFromSessionType(draft.type).category
  const subCategory = draft.subCategory || getCategoryFromSessionType(draft.type).subCategory
  const isMatchType = category === SESSION_CATEGORY.match

  return {
    date: draft.date,
    durationMinutes: draft.durationMinutes,
    rating: draft.rating,
    category,
    subCategory,
    matchRank: isMatchType ? draft.matchRank : 0,
    courtName: draft.courtName,
    partner: draft.partner,
    cost: draft.cost,
    racketId: draft.racketId,
    shoeName: draft.shoeName,
    note: draft.note,
  }
}
