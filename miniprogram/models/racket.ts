export type RacketStatus = 1 | 2 | 3
export type RacketFilter = 'using' | 'retired'

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
  tension: number
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
  tension: number
  lastStringDate: string
  lastStringCost: number
}

export interface RacketLibraryItem {
  id: number
  brand: string
  model: string
  releaseYear: number
  weight: number
  headSize: number
  imageUrl: string
}

export interface RacketLibraryGroup {
  brand: string
  items: RacketLibraryItem[]
}

export interface StringingRecord {
  id: number
  racketId: number
  stringName: string
  tension: number
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
