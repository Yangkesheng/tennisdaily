import type { PersonalRecords } from '../../models/records'
import type { RacketDashboard } from '../../models/racket'
import type { ShoeStats } from '../../models/shoe'
import { getCurrentUserFromApi, requireLoginPage, type UserProfile } from '../../services/auth-service'
import { getPersonalRecordsFromApi } from '../../services/records-api-service'
import { getRacketStatsFromApi } from '../../services/racket-api-service'
import { getShoeStatsFromApi } from '../../services/shoe-api-service'

interface ProfileData {
  user: UserProfile | null
  isExpenseVisible: boolean
  streakDays: number
  streakVisible: boolean
  totalCount: number
  totalHoursText: string
  totalCostText: string
  championCount: number
  dashboard: RacketDashboard
  shoeDashboard: ShoeStats
  gearTotalCostText: string
}

const formatMoneyText = (value: number) => {
  if (!value) {
    return '0'
  }

  return Number.isInteger(value) ? `${value}` : value.toFixed(1)
}

const buildRecordsView = (records: PersonalRecords) => {
  return {
    streakDays: records.currentStreakDays,
    streakVisible: records.currentStreakDays > 0,
    totalCount: records.totalCount,
    totalHoursText: (records.totalMinutes / 60).toFixed(1),
    totalCostText: formatMoneyText(records.totalCost),
    championCount: records.championCount,
  }
}

Component({
  data: {
    user: null,
    isExpenseVisible: true,
    streakDays: 0,
    streakVisible: false,
    totalCount: 0,
    totalHoursText: '0.0',
    totalCostText: '0',
    championCount: 0,
    dashboard: {
      racketCount: 0,
      racketCost: 0,
      stringingCost: 0,
      totalCost: 0,
      racketCostText: '0.00',
      stringingCostText: '0.00',
      totalCostText: '0.00',
    },
    shoeDashboard: {
      shoeCount: 0,
      shoeCost: 0,
      totalCost: 0,
      shoeCostText: '0.00',
      totalCostText: '0.00',
    },
    gearTotalCostText: '0',
  } as ProfileData,
  pageLifetimes: {
    show() {
      this.refreshDashboard()
    },
  },
  methods: {
    async refreshDashboard() {
      if (requireLoginPage()) {
        return
      }

      try {
        const [records, dashboard, shoeDashboard, user] = await Promise.all([
          getPersonalRecordsFromApi(),
          getRacketStatsFromApi(),
          getShoeStatsFromApi(),
          getCurrentUserFromApi(),
        ])

        this.setData({
          ...buildRecordsView(records),
          user,
          dashboard,
          shoeDashboard,
          gearTotalCostText: formatMoneyText(dashboard.totalCost + shoeDashboard.totalCost),
        })
      } catch (error) {
        wx.showToast({
          title: error instanceof Error ? error.message : '服务暂时不可用',
          icon: 'none',
        })
      }
    },
    toggleExpenseVisible() {
      this.setData({
        isExpenseVisible: !this.data.isExpenseVisible,
      })
    },
    goRecords() {
      wx.navigateTo({
        url: '/pages/records/records',
      })
    },
    goShoes() {
      wx.navigateTo({
        url: '/pages/shoes/shoes',
      })
    },
    goRackets() {
      wx.navigateTo({
        url: '/pages/rackets/rackets',
      })
    },
    goUserProfile() {
      wx.navigateTo({
        url: '/pages/user-profile/user-profile',
      })
    },
    goFeedback() {
      wx.navigateTo({
        url: '/pages/feedback/feedback',
      })
    },
    goPrivacy() {
      wx.navigateTo({
        url: '/pages/privacy/privacy',
      })
    },
    onShareAppMessage() {
      return {
        title: '我的网球日记',
        path: '/pages/profile/profile',
      }
    },
    onShareTimeline() {
      return {
        title: '我的网球日记',
      }
    },
  },
})
