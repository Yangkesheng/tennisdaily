import type { Shoe, ShoeBrand, ShoeDraft, ShoeLibraryGroup, ShoeLibraryItem, ShoeLibraryStatsBrand, ShoeSeries, ShoeStats } from '../models/shoe'
import { ensureLogin } from './auth-service'
import { request } from './request'

interface ApiShoe {
  id: number
  libraryId?: number
  name: string
  brand?: string
  model?: string
  status: number
  gender?: number
  size?: string
  colorway?: string
  purchaseDate?: string
  purchasePrice?: number | null
  releaseYear?: number
  fileId?: string
  fileID?: string
  fileid?: string
  imageUrl?: string
  createdAt?: string
  updatedAt?: string
}

interface ApiShoeLibraryItem {
  id: number
  brandId?: number
  brand?: string
  seriesId?: number
  series?: string
  model?: string
  gender?: number
  releaseYear?: number
  colorway?: string
  weight?: string
  width?: string
  surface?: string
  price?: number
  colorwayCount?: number
  fileId?: string
  fileID?: string
  fileid?: string
  imageUrl?: string
}

interface ApiShoeLibraryGroup {
  brandId?: number
  brand: string
  items: ApiShoeLibraryItem[]
}

interface ApiShoeSeries {
  id: number
  brandId: number
  gender: number
  name: string
}

interface ApiShoeLibraryStatsSeries {
  seriesId: number
  series: string
  count: number
}

interface ApiShoeLibraryStatsBrand {
  brandId: number
  brand: string
  count: number
  series: Record<string, ApiShoeLibraryStatsSeries[]>
}

interface ApiShoePayload {
  libraryId?: number
  name: string
  brand?: string
  model?: string
  status?: number
  size?: string
  colorway?: string
  purchaseDate?: string
  purchasePrice?: number
}

const getImageSource = (item: { imageUrl?: string; fileId?: string; fileID?: string; fileid?: string }) => {
  return item.fileId || item.fileID || item.fileid || item.imageUrl || ''
}

const mapApiShoe = (shoe: ApiShoe): Shoe => {
  return {
    id: shoe.id,
    libraryId: shoe.libraryId,
    name: shoe.name,
    brand: shoe.brand || '',
    model: shoe.model || '',
    status: shoe.status === 1 || shoe.status === 2 || shoe.status === 3 ? shoe.status : 2,
    gender: shoe.gender || 0,
    size: shoe.size || '',
    colorway: shoe.colorway || '',
    purchaseDate: shoe.purchaseDate || '',
    purchasePrice: shoe.purchasePrice || 0,
    releaseYear: shoe.releaseYear || 0,
    imageUrl: getImageSource(shoe),
    createdAt: shoe.createdAt,
    updatedAt: shoe.updatedAt,
  }
}

const mapApiLibraryItem = (item: ApiShoeLibraryItem, group?: ApiShoeLibraryGroup): ShoeLibraryItem => {
  return {
    id: item.id,
    brandId: item.brandId || group?.brandId || 0,
    brand: item.brand || group?.brand || '',
    seriesId: item.seriesId || 0,
    series: item.series || '',
    model: item.model || '',
    gender: item.gender || 0,
    releaseYear: item.releaseYear || 0,
    colorway: item.colorway || '',
    weight: item.weight || '',
    width: item.width || '',
    surface: item.surface || '',
    price: item.price || 0,
    colorwayCount: item.colorwayCount || 0,
    imageUrl: getImageSource(item),
  }
}

const mapLibraryGroups = (groups: ApiShoeLibraryGroup[]): ShoeLibraryGroup[] => {
  return groups.map((group) => ({
    brandId: group.brandId || 0,
    brand: group.brand,
    items: group.items.map((item) => mapApiLibraryItem(item, group)),
  }))
}

const mapDraftToPayload = (draft: ShoeDraft): ApiShoePayload => {
  const payload: ApiShoePayload = {
    name: draft.name,
    status: draft.status,
    size: draft.size,
    colorway: draft.colorway,
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

export const listShoesFromApi = async (includeRetired = true): Promise<Shoe[]> => {
  await ensureLogin()
  const shoes = await request<ApiShoe[]>({
    url: `/api/shoes?includeRetired=${includeRetired ? 'true' : 'false'}`,
  })

  return shoes.map(mapApiShoe)
}

export const getShoeStatsFromApi = async (): Promise<ShoeStats> => {
  await ensureLogin()
  return request<ShoeStats>({
    url: '/api/shoes/stats',
  })
}

export const createShoeFromApi = async (draft: ShoeDraft): Promise<Shoe> => {
  await ensureLogin()
  const shoe = await request<ApiShoe>({
    url: '/api/shoes',
    method: 'POST',
    data: mapDraftToPayload(draft),
  })

  return mapApiShoe(shoe)
}

export const getShoeDetailFromApi = async (id: number): Promise<Shoe> => {
  await ensureLogin()
  const shoe = await request<ApiShoe>({
    url: `/api/shoes/${id}`,
  })

  return mapApiShoe(shoe)
}

export const updateShoeFromApi = async (id: number, draft: ShoeDraft): Promise<Shoe> => {
  await ensureLogin()
  const shoe = await request<ApiShoe>({
    url: `/api/shoes/${id}`,
    method: 'PUT',
    data: mapDraftToPayload(draft),
  })

  return mapApiShoe(shoe)
}

export const deleteShoeFromApi = async (id: number): Promise<void> => {
  await ensureLogin()
  await request<WechatMiniprogram.IAnyObject>({
    url: `/api/shoes/${id}`,
    method: 'DELETE',
  })
}

export const setPrimaryShoeFromApi = async (id: number): Promise<void> => {
  await ensureLogin()
  await request<WechatMiniprogram.IAnyObject>({
    url: `/api/shoes/${id}/set-primary`,
    method: 'POST',
  })
}

export const retireShoeFromApi = async (id: number): Promise<void> => {
  await ensureLogin()
  await request<WechatMiniprogram.IAnyObject>({
    url: `/api/shoes/${id}/retire`,
    method: 'POST',
  })
}

export const getShoeLibraryStatsFromApi = async (): Promise<ShoeLibraryStatsBrand[]> => {
  await ensureLogin()
  const stats = await request<ApiShoeLibraryStatsBrand[]>({
    url: '/api/shoe-library/stats',
  })

  return stats.map((brand) => ({
    brandId: brand.brandId,
    brand: brand.brand,
    count: brand.count,
    series: brand.series,
  }))
}

export const listShoeSeriesFromApi = async (brandId?: number, gender?: number): Promise<ShoeSeries[]> => {
  await ensureLogin()
  const params = [
    brandId ? `brandId=${brandId}` : '',
    gender ? `gender=${gender}` : '',
  ].filter(Boolean)
  const series = await request<ApiShoeSeries[]>({
    url: `/api/shoe-series${params.length ? `?${params.join('&')}` : ''}`,
  })

  return series.map((item) => ({
    id: item.id,
    brandId: item.brandId,
    gender: item.gender,
    name: item.name,
  }))
}

export const listShoeLibraryFromApi = async (brandId?: number, seriesId?: number, gender?: number): Promise<ShoeLibraryGroup[]> => {
  await ensureLogin()
  const params = [
    brandId ? `brandId=${brandId}` : '',
    seriesId ? `seriesId=${seriesId}` : '',
    gender ? `gender=${gender}` : '',
  ].filter(Boolean)
  const groups = await request<ApiShoeLibraryGroup[]>({
    url: `/api/shoe-library${params.length ? `?${params.join('&')}` : ''}`,
  })

  return mapLibraryGroups(groups)
}

export const listShoeLibraryItemsFromApi = async (brandId: number, seriesId?: number, gender?: number): Promise<ShoeLibraryItem[]> => {
  const groups = await listShoeLibraryFromApi(brandId, seriesId, gender)

  return groups.reduce<ShoeLibraryItem[]>((items, group) => items.concat(group.items), [])
}

export const mapShoeBrands = (brands: ShoeLibraryStatsBrand[]): ShoeBrand[] => {
  return brands.map((brand) => ({
    id: brand.brandId,
    name: brand.brand,
    imageUrl: '',
    count: brand.count,
    series: brand.series,
  }))
}
