import type { Racket, RacketBrand, RacketDraft, RacketLibraryGroup, RacketLibraryItem, RacketSeries, StringingRecord } from '../models/racket'
import { ensureLogin } from './auth-service'
import { request } from './request'

interface ApiRacket {
  id: number
  libraryId?: number
  name: string
  brand?: string
  model?: string
  status: number
  imageUrl?: string
  fileId?: string
  fileID?: string
  fileid?: string
  weight?: number
  headSize?: number
  purchaseDate?: string
  purchasePrice?: number
  stringName?: string
  storeName?: string
  verticalTension?: number
  horizontalTension?: number
  lastStringDate?: string
  lastStringCost?: number
  latestStringingRecord?: ApiStringingRecord
  totalMinutes?: number
  totalHours?: number
  usageCount?: number
  usageMinutes?: number
  usageHours?: number
  afterStringingUsageCount?: number
  afterStringingUsageMinutes?: number
  afterStringingUsageHours?: number
  createdAt?: string
  updatedAt?: string
}

interface ApiRacketStats {
  racketCount: number
  racketCost: number
  stringingCost: number
  totalCost: number
  racketCostText: string
  stringingCostText: string
  totalCostText: string
}

interface ApiRacketDetail {
  racket: ApiRacket
  stringingRecords: ApiStringingRecord[]
}

interface ApiStringingRecord {
  id: number
  racketId: number
  stringName: string
  storeName?: string
  verticalTension?: number
  horizontalTension?: number
  cost: number
  stringDate: string
  createdAt?: string
  updatedAt?: string
}

interface ApiRacketBrand {
  id: number
  name: string
  imageUrl?: string
  fileId?: string
  fileID?: string
  fileid?: string
}

interface ApiRacketSeries {
  id: number
  brandId: number
  name: string
}

export interface ApiRacketLibraryItem {
  id: number
  brandId?: number
  brand?: string
  seriesId?: number
  series?: string
  model?: string
  releaseYear?: number
  weight?: number
  headSize?: number
  stringPattern?: string
  imageUrl?: string
  fileId?: string
  fileID?: string
  fileid?: string
}

interface ApiRacketLibraryGroup {
  brandId?: number
  brand: string
  items: ApiRacketLibraryItem[]
}

interface ApiRacketPayload {
  libraryId?: number
  name: string
  brand?: string
  model?: string
  status?: number
  imageUrl?: string
  purchaseDate?: string
  purchasePrice?: number
}

const getImageSource = (item: { imageUrl?: string; fileId?: string; fileID?: string; fileid?: string }) => {
  return item.imageUrl || item.fileId || item.fileID || item.fileid || ''
}

const mapApiRacket = (racket: ApiRacket): Racket => {
  const latestStringingRecord = racket.latestStringingRecord

  return {
    id: racket.id,
    libraryId: racket.libraryId,
    name: racket.name,
    brand: racket.brand || '',
    model: racket.model || '',
    status: racket.status === 1 || racket.status === 2 || racket.status === 3 ? racket.status : 2,
    imageUrl: getImageSource(racket),
    weight: racket.weight || 0,
    headSize: racket.headSize || 0,
    purchaseDate: racket.purchaseDate || '',
    purchasePrice: racket.purchasePrice || 0,
    stringName: latestStringingRecord?.stringName || racket.stringName || '',
    storeName: latestStringingRecord?.storeName || racket.storeName || '',
    verticalTension: latestStringingRecord?.verticalTension || racket.verticalTension || 0,
    horizontalTension: latestStringingRecord?.horizontalTension || racket.horizontalTension || 0,
    lastStringDate: latestStringingRecord?.stringDate || racket.lastStringDate || '',
    lastStringCost: latestStringingRecord?.cost || racket.lastStringCost || 0,
    totalMinutes: racket.totalMinutes || racket.usageMinutes || 0,
    totalHours: racket.totalHours || racket.usageHours || 0,
    usageCount: racket.usageCount || 0,
    usageMinutes: racket.usageMinutes || racket.totalMinutes || 0,
    usageHours: racket.usageHours || racket.totalHours || 0,
    afterStringingUsageCount: racket.afterStringingUsageCount || 0,
    afterStringingUsageMinutes: racket.afterStringingUsageMinutes || 0,
    afterStringingUsageHours: racket.afterStringingUsageHours || 0,
    createdAt: racket.createdAt,
    updatedAt: racket.updatedAt,
  }
}

const mapApiStringingRecord = (record: ApiStringingRecord): StringingRecord => {
  return {
    id: record.id,
    racketId: record.racketId,
    stringName: record.stringName,
    storeName: record.storeName || '',
    verticalTension: record.verticalTension || 0,
    horizontalTension: record.horizontalTension || 0,
    cost: record.cost || 0,
    stringDate: record.stringDate || '',
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  }
}

const mapDraftToPayload = (draft: RacketDraft): ApiRacketPayload => {
  const payload: ApiRacketPayload = {
    name: draft.name,
    status: draft.status,
    imageUrl: draft.imageUrl || '',
    purchaseDate: draft.purchaseDate,
    purchasePrice: draft.purchasePrice || 0,
  }

  if (draft.libraryId > 0) {
    payload.libraryId = draft.libraryId
  }
  if (draft.brand) {
    payload.brand = draft.brand
  }
  if (draft.model) {
    payload.model = draft.model
  }

  return payload
}

const mapApiLibraryItem = (item: ApiRacketLibraryItem, group?: ApiRacketLibraryGroup): RacketLibraryItem => {
  return {
    id: item.id,
    brandId: item.brandId || group?.brandId || 0,
    brand: item.brand || group?.brand || '',
    seriesId: item.seriesId || 0,
    series: item.series || '',
    model: item.model || '',
    releaseYear: item.releaseYear || 0,
    weight: item.weight || 0,
    headSize: item.headSize || 0,
    stringPattern: item.stringPattern || '',
    imageUrl: getImageSource(item),
  }
}

const mapLibraryGroups = (groups: ApiRacketLibraryGroup[]): RacketLibraryGroup[] => {
  return groups.map((group) => ({
    brandId: group.brandId || 0,
    brand: group.brand,
    items: group.items.map((item) => mapApiLibraryItem(item, group)),
  }))
}

export const listRacketsFromApi = async (includeRetired = true): Promise<Racket[]> => {
  await ensureLogin()
  const rackets = await request<ApiRacket[]>({
    url: `/api/rackets?includeRetired=${includeRetired ? 'true' : 'false'}`,
  })

  return rackets.map(mapApiRacket)
}

export const getRacketStatsFromApi = async (): Promise<ApiRacketStats> => {
  await ensureLogin()
  return request<ApiRacketStats>({
    url: '/api/rackets/stats',
  })
}

export const createRacketFromApi = async (draft: RacketDraft): Promise<Racket> => {
  await ensureLogin()
  const racket = await request<ApiRacket>({
    url: '/api/rackets',
    method: 'POST',
    data: mapDraftToPayload(draft),
  })

  return mapApiRacket(racket)
}

export const listRacketBrandsFromApi = async (): Promise<RacketBrand[]> => {
  await ensureLogin()
  const brands = await request<ApiRacketBrand[]>({
    url: '/api/racket-brands',
  })

  return brands.map((brand) => ({
    id: brand.id,
    name: brand.name,
    imageUrl: getImageSource(brand),
  }))
}

export const listRacketSeriesFromApi = async (brandId: number): Promise<RacketSeries[]> => {
  await ensureLogin()
  return request<ApiRacketSeries[]>({
    url: `/api/racket-series?brandId=${brandId}`,
  })
}

export const listRacketLibraryFromApi = async (brandId?: number, seriesId?: number): Promise<RacketLibraryGroup[]> => {
  await ensureLogin()
  const params = [
    brandId ? `brandId=${brandId}` : '',
    seriesId ? `seriesId=${seriesId}` : '',
  ].filter(Boolean)
  const groups = await request<ApiRacketLibraryGroup[]>({
    url: `/api/racket-library${params.length ? `?${params.join('&')}` : ''}`,
  })

  return mapLibraryGroups(groups)
}

export const listRacketLibraryItemsFromApi = async (brandId: number, seriesId?: number): Promise<RacketLibraryItem[]> => {
  const groups = await listRacketLibraryFromApi(brandId, seriesId)

  return groups.reduce<RacketLibraryItem[]>((items, group) => items.concat(group.items), [])
}

export const getRacketDetailFromApi = async (id: number): Promise<{ racket: Racket; stringingRecords: StringingRecord[] }> => {
  await ensureLogin()
  const detail = await request<ApiRacketDetail>({
    url: `/api/rackets/${id}`,
  })

  return {
    racket: mapApiRacket(detail.racket),
    stringingRecords: detail.stringingRecords.map(mapApiStringingRecord),
  }
}

export const listMyRacketsFromApi = async (): Promise<Racket[]> => {
  await ensureLogin()
  const rackets = await request<ApiRacket[]>({
    url: '/api/my-rackets',
  })

  return rackets.map(mapApiRacket)
}

export const updateRacketFromApi = async (id: number, draft: RacketDraft): Promise<Racket> => {
  await ensureLogin()
  const racket = await request<ApiRacket>({
    url: `/api/rackets/${id}`,
    method: 'PUT',
    data: mapDraftToPayload(draft),
  })

  return mapApiRacket(racket)
}

export const deleteRacketFromApi = async (id: number): Promise<void> => {
  await ensureLogin()
  await request<WechatMiniprogram.IAnyObject>({
    url: `/api/rackets/${id}`,
    method: 'DELETE',
  })
}

export const setPrimaryRacketFromApi = async (id: number): Promise<void> => {
  await ensureLogin()
  await request<WechatMiniprogram.IAnyObject>({
    url: `/api/rackets/${id}/set-primary`,
    method: 'POST',
  })
}

export const retireRacketFromApi = async (id: number): Promise<void> => {
  await ensureLogin()
  await request<WechatMiniprogram.IAnyObject>({
    url: `/api/rackets/${id}/retire`,
    method: 'POST',
  })
}

export interface StringingRecordPayload {
  stringName: string
  storeName?: string
  verticalTension: number
  horizontalTension: number
  cost: number
  stringDate: string
}

export const createStringingRecordFromApi = async (
  id: number,
  record: StringingRecordPayload,
): Promise<void> => {
  await ensureLogin()
  await request<WechatMiniprogram.IAnyObject>({
    url: `/api/rackets/${id}/stringing-records`,
    method: 'POST',
    data: record,
  })
}

export const updateStringingRecordFromApi = async (racketId: number, recordId: number, record: StringingRecordPayload): Promise<void> => {
  await ensureLogin()
  await request<WechatMiniprogram.IAnyObject>({
    url: `/api/rackets/${racketId}/stringing-records/${recordId}`,
    method: 'PUT',
    data: record,
  })
}

export const deleteStringingRecordFromApi = async (racketId: number, recordId: number): Promise<void> => {
  await ensureLogin()
  await request<WechatMiniprogram.IAnyObject>({
    url: `/api/rackets/${racketId}/stringing-records/${recordId}`,
    method: 'DELETE',
  })
}
