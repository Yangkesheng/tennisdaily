export type RacketStatus = 1 | 2 | 3
export type RacketFilter = 'using' | 'retired'

export interface RacketBrand {
  id: number
  name: string
  imageUrl: string
  count?: number
}

export interface RacketSeries {
  id: number
  brandId: number
  name: string
  count?: number
}

export type StringHealthState = 'fresh' | 'peak' | 'good' | 'decline' | 'dead' | 'expired'

export interface StringHealth {
  state: StringHealthState
  display: string
  score: number
  remainingHours: number
}

export interface RacketLibraryStatsBrand extends RacketBrand {
  series: RacketSeries[]
  count: number
}

export interface Racket {
  id: number
  libraryId?: number
  name: string
  brand: string
  model: string
  status: RacketStatus
  imageUrl: string
  weight: number
  headSize: number
  purchaseDate: string
  purchasePrice: number
  stringName: string
  storeName: string
  verticalTension: number
  horizontalTension: number
  lastStringDate: string
  lastStringCost: number
  totalMinutes: number
  totalHours: number
  usageCount: number
  usageMinutes: number
  usageHours: number
  afterStringingUsageCount: number
  afterStringingUsageMinutes: number
  afterStringingUsageHours: number
  stringHealth?: StringHealth
  createdAt?: string
  updatedAt?: string
}

export interface RacketDraft {
  libraryId: number
  name: string
  brand: string
  model: string
  status: RacketStatus
  imageUrl: string
  weight: number
  headSize: number
  purchaseDate: string
  purchasePrice: number
  stringName: string
  storeName?: string
  verticalTension: number
  horizontalTension: number
  lastStringDate: string
  lastStringCost: number
}

export interface RacketLibraryItem {
  id: number
  brandId: number
  brand: string
  seriesId: number
  series: string
  model: string
  releaseYear: number
  weight: number
  headSize: number
  stringPattern: string
  imageUrl: string
}

export interface CreateRacketLibraryPayload {
  brandName: string
  seriesName: string
  model: string
  releaseYear?: number
  weight?: number
  headSize?: number
  stringPattern?: string
  fileId?: string
  imageUrl?: string
}

export interface CreateRacketLibraryResult {
  created: number
  items: RacketLibraryItem[]
}

export interface RacketLibraryGroup {
  brandId: number
  brand: string
  items: RacketLibraryItem[]
}

export interface StringingRecord {
  id: number
  racketId: number
  stringName: string
  storeName: string
  verticalTension: number
  horizontalTension: number
  cost: number
  stringDate: string
  createdAt?: string
  updatedAt?: string
}

export interface RacketDashboard {
  racketCount: number
  racketCost: number
  stringingCost: number
  totalCost: number
  racketCostText: string
  stringingCostText: string
  totalCostText: string
}
