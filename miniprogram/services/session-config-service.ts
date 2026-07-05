import type { MatchRankOption, SessionCategory, SessionCategoryOption, SessionConfig, SessionSubCategoryOption } from '../models/session'
import { request } from './request'

interface ApiSessionSubCategoryOption {
  value?: number | null
  label?: string | null
  category?: number | null
  typeText?: string | null
  legacyType?: number | null
}

interface ApiSessionCategoryOption {
  value?: number | null
  label?: string | null
  subCategories?: ApiSessionSubCategoryOption[] | null
}

interface ApiMatchRankOption {
  value?: number | null
  label?: string | null
}

interface ApiSessionConfig {
  categories?: ApiSessionCategoryOption[] | null
  matchRanks?: ApiMatchRankOption[] | null
}

const normalizeCategories = (categories: ApiSessionCategoryOption[] | null | undefined) => {
  const categoryOptions: SessionCategoryOption[] = []
  const subCategoryOptions: Record<number, SessionSubCategoryOption[]> = {}

  if (!Array.isArray(categories)) {
    return { categoryOptions, subCategoryOptions }
  }

  categories.forEach((category) => {
    if (typeof category.value !== 'number' || !category.label) {
      return
    }

    const categoryValue = category.value as SessionCategory
    categoryOptions.push({
      value: categoryValue,
      label: category.label,
    })

    subCategoryOptions[categoryValue] = Array.isArray(category.subCategories)
      ? category.subCategories
          .filter((subCategory) => typeof subCategory.value === 'number' && !!subCategory.label)
          .map((subCategory) => ({
            value: subCategory.value as number,
            label: subCategory.label || '',
            category: typeof subCategory.category === 'number' ? subCategory.category : categoryValue,
            typeText: subCategory.typeText || '',
            legacyType: typeof subCategory.legacyType === 'number' ? subCategory.legacyType : 0,
          }))
      : []
  })

  return { categoryOptions, subCategoryOptions }
}

const normalizeMatchRanks = (matchRanks: ApiMatchRankOption[] | null | undefined): MatchRankOption[] => {
  if (!Array.isArray(matchRanks)) {
    return []
  }

  return matchRanks
    .filter((rank) => typeof rank.value === 'number' && !!rank.label)
    .map((rank) => ({
      value: rank.value as number,
      label: rank.label || '',
    }))
}

export const getSessionConfigFromApi = async (): Promise<SessionConfig> => {
  const config = await request<ApiSessionConfig>({
    url: '/api/session-config',
    auth: false,
  })
  const { categoryOptions, subCategoryOptions } = normalizeCategories(config?.categories)

  if (!categoryOptions.length) {
    throw new Error('打球类型配置为空')
  }

  return {
    categories: categoryOptions,
    subCategoryOptions,
    matchRanks: normalizeMatchRanks(config?.matchRanks),
  }
}
