export type TennisSessionType = '' | 'training' | 'singles' | 'doubles' | 'match'

export interface TennisSession {
  id: string
  date: string
  durationMinutes: number
  rating: number
  courtName: string
  partner: string
  type: TennisSessionType
  cost: number
  racketName: string
  shoeName: string
  note: string
  createdAt: number
  updatedAt: number
}

export interface SessionDraft {
  date: string
  durationMinutes: number
  rating: number
  courtName: string
  partner: string
  type: TennisSessionType
  cost: number
  racketName: string
  shoeName: string
  note: string
}

export interface SessionStats {
  monthCount: number
  monthMinutes: number
  monthCost: number
  totalCount: number
}

export interface SessionTypeOption {
  label: string
  value: TennisSessionType
}
