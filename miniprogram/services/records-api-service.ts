import type { PersonalRecords } from '../models/records'
import { ensureLogin } from './auth-service'
import { request } from './request'

interface ApiPersonalRecords {
  totalCount?: number | null
  totalMinutes?: number | null
  totalCost?: number | null
  currentStreakDays?: number | null
  longestStreakDays?: number | null
  longestStreakStartDate?: string | null
  longestStreakEndDate?: string | null
  longestSessionMinutes?: number | null
  longestSessionDate?: string | null
  bestMonthYear?: number | null
  bestMonthMonth?: number | null
  bestMonthMinutes?: number | null
  bestMonthSessionCount?: number | null
  maxSessionsPerDay?: number | null
  maxSessionsPerDayDate?: string | null
  bestMonthCostYear?: number | null
  bestMonthCostMonth?: number | null
  bestMonthCost?: number | null
  championCount?: number | null
  runnerUpCount?: number | null
  earliestSessionDate?: string | null
}

const normalizeNumber = (value: number | null | undefined) => {
  return typeof value === 'number' && !Number.isNaN(value) ? value : 0
}

const normalizeRecords = (records: ApiPersonalRecords | null | undefined): PersonalRecords => ({
  totalCount: normalizeNumber(records?.totalCount),
  totalMinutes: normalizeNumber(records?.totalMinutes),
  totalCost: normalizeNumber(records?.totalCost),
  currentStreakDays: normalizeNumber(records?.currentStreakDays),
  longestStreakDays: normalizeNumber(records?.longestStreakDays),
  longestStreakStartDate: records?.longestStreakStartDate || '',
  longestStreakEndDate: records?.longestStreakEndDate || '',
  longestSessionMinutes: normalizeNumber(records?.longestSessionMinutes),
  longestSessionDate: records?.longestSessionDate || '',
  bestMonthYear: normalizeNumber(records?.bestMonthYear),
  bestMonthMonth: normalizeNumber(records?.bestMonthMonth),
  bestMonthMinutes: normalizeNumber(records?.bestMonthMinutes),
  bestMonthSessionCount: normalizeNumber(records?.bestMonthSessionCount),
  maxSessionsPerDay: normalizeNumber(records?.maxSessionsPerDay),
  maxSessionsPerDayDate: records?.maxSessionsPerDayDate || '',
  bestMonthCostYear: normalizeNumber(records?.bestMonthCostYear),
  bestMonthCostMonth: normalizeNumber(records?.bestMonthCostMonth),
  bestMonthCost: normalizeNumber(records?.bestMonthCost),
  championCount: normalizeNumber(records?.championCount),
  runnerUpCount: normalizeNumber(records?.runnerUpCount),
  earliestSessionDate: records?.earliestSessionDate || '',
})

export const getPersonalRecordsFromApi = async (): Promise<PersonalRecords> => {
  await ensureLogin()
  const records = await request<ApiPersonalRecords | null>({
    url: '/api/stats/records',
  })

  return normalizeRecords(records)
}
