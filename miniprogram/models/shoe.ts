export type ShoeStatus = 1 | 2 | 3

export interface ShoeWear {
  state: string
  display: string
  score: number
  remainingHours: number
}

export interface Shoe {
  id: number
  libraryId?: number
  name: string
  brand: string
  model: string
  status: ShoeStatus
  gender: number
  size: string
  colorway: string
  purchaseDate: string
  purchasePrice: number
  releaseYear: number
  imageUrl: string
  usageCount: number
  usageMinutes: number
  usageHours: number
  totalMinutes: number
  totalHours: number
  wear: ShoeWear | null
  createdAt?: string
  updatedAt?: string
}

export interface ShoeDraft {
  libraryId: number
  name: string
  brand: string
  model: string
  status: ShoeStatus
  size: string
  colorway: string
  purchaseDate: string
  purchasePrice: number
  imageUrl?: string
}

export interface ShoeBrand {
  id: number
  name: string
  imageUrl: string
  count?: number
  series?: Record<string, ShoeLibraryStatsSeries[]>
}

export interface ShoeSeries {
  id: number
  brandId: number
  gender: number
  name: string
  count?: number
}

export interface ShoeLibraryItem {
  id: number
  brandId: number
  brand: string
  seriesId: number
  series: string
  model: string
  gender: number
  releaseYear: number
  colorway: string
  weight: string
  width: string
  surface: string
  price: number
  colorwayCount: number
  imageUrl: string
}

export interface ShoeLibraryGroup {
  brandId: number
  brand: string
  items: ShoeLibraryItem[]
}

export interface ShoeLibraryStatsSeries {
  seriesId: number
  series: string
  count: number
}

export interface ShoeLibraryStatsBrand {
  brandId: number
  brand: string
  count: number
  series: Record<string, ShoeLibraryStatsSeries[]>
}

export interface ShoeStats {
  shoeCount: number
  shoeCost: number
  totalCost: number
  shoeCostText: string
  totalCostText: string
}

export interface AdminPermissions {
  isAdmin: boolean
}

export interface CreateShoeBrandPayload {
  name: string
  slug?: string
  fileId?: string
}

export interface CreateShoeSeriesPayload {
  brandId: number
  gender: number
  name: string
}

export interface CreateShoeLibraryPayload {
  brandId: number
  seriesName: string
  model: string
  gender: number
  colorway: string
  releaseYear?: number
  weight?: string
  width?: string
  surface?: string
  price?: number
  colorwayCount?: number
  fileId?: string
  imageUrl?: string
}

export interface CreateShoeLibraryResult {
  created: number
  items: ShoeLibraryItem[]
}
