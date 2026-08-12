import type { PersonalRecords } from '../../models/records'
import { requireLoginPage } from '../../services/auth-service'
import { getPersonalRecordsFromApi } from '../../services/records-api-service'

interface RecordsData {
  loading: boolean
  loadFailed: boolean
  isExpenseVisible: boolean
  streakDays: number
  totalCount: number
  totalHoursText: string
  totalCostText: string
  maxSessionsText: string
  maxSessionsDetail: string
  longestStreakText: string
  bestMonthCostText: string
  bestMonthCostDetail: string
  championCountText: string
  runnerUpCountText: string
  longestSessionText: string
  longestSessionDetail: string
  bestMonthText: string
  bestMonthDetail: string
}

const dateOnly = (value: string) => {
  return (value || '').split(' ')[0]
}

const formatMoneyText = (value: number) => {
  if (!value) {
    return '0'
  }

  return Number.isInteger(value) ? `${value}` : value.toFixed(1)
}

const emptyData = (): RecordsData => ({
  loading: true,
  loadFailed: false,
  isExpenseVisible: true,
  streakDays: 0,
  totalCount: 0,
  totalHoursText: '0.0',
  totalCostText: '0',
  maxSessionsText: '暂无',
  maxSessionsDetail: '',
  longestStreakText: '暂无',
  bestMonthCostText: '¥0',
  bestMonthCostDetail: '',
  championCountText: '0 次',
  runnerUpCountText: '0 次',
  longestSessionText: '暂无',
  longestSessionDetail: '',
  bestMonthText: '暂无',
  bestMonthDetail: '',
})

const buildView = (records: PersonalRecords): Omit<RecordsData, 'loading' | 'loadFailed' | 'isExpenseVisible'> => {
  const longestDate = dateOnly(records.longestSessionDate)
  const bestMonthLabel = records.bestMonthYear ? `${records.bestMonthYear}年${records.bestMonthMonth}月` : ''
  const bestMonthHours = Math.round(records.bestMonthMinutes / 60)
  const maxSessionsDate = dateOnly(records.maxSessionsPerDayDate)
  const bestMonthCostLabel = records.bestMonthCostYear ? `${records.bestMonthCostYear}年${records.bestMonthCostMonth}月` : ''

  return {
    streakDays: records.currentStreakDays,
    totalCount: records.totalCount,
    totalHoursText: (records.totalMinutes / 60).toFixed(1),
    totalCostText: formatMoneyText(records.totalCost),
    maxSessionsText: records.maxSessionsPerDay > 0 ? `${records.maxSessionsPerDay} 场` : '暂无',
    maxSessionsDetail: maxSessionsDate,
    longestStreakText: records.longestStreakDays > 0 ? `${records.longestStreakDays} 天` : '暂无',
    bestMonthCostText: `¥${formatMoneyText(records.bestMonthCost)}`,
    bestMonthCostDetail: bestMonthCostLabel,
    championCountText: `${records.championCount} 次`,
    runnerUpCountText: `${records.runnerUpCount} 次`,
    longestSessionText: records.longestSessionMinutes > 0 ? `${records.longestSessionMinutes} 分钟` : '暂无',
    longestSessionDetail: longestDate,
    bestMonthText: bestMonthHours > 0 ? `${bestMonthHours} 小时` : '暂无',
    bestMonthDetail: bestMonthLabel
      ? `${bestMonthLabel}${records.bestMonthSessionCount > 0 ? ` · ${records.bestMonthSessionCount} 场` : ''}`
      : '',
  }
}

Page({
  data: emptyData(),
  onShow() {
    this.refreshRecords()
  },
  async refreshRecords() {
    if (requireLoginPage()) {
      return
    }

    this.setData({
      loading: true,
      loadFailed: false,
    })

    try {
      const records = await getPersonalRecordsFromApi()
      this.setData({
        ...buildView(records),
        loading: false,
      })
    } catch (error) {
      this.setData({
        loading: false,
        loadFailed: true,
      })
      wx.showToast({
        title: error instanceof Error ? error.message : '个人记录加载失败',
        icon: 'none',
      })
    }
  },
  retryRecords() {
    this.refreshRecords()
  },
  toggleExpenseVisible() {
    this.setData({
      isExpenseVisible: !this.data.isExpenseVisible,
    })
  },
})
