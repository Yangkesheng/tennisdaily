import type { RacketDashboard } from '../../models/racket'
import { getRacketStatsFromApi } from '../../services/racket-api-service'

interface ProfileData {
  dashboard: RacketDashboard
}

Component({
  data: {
    dashboard: {
      racketCount: 0,
      racketCost: 0,
      stringingCost: 0,
      totalCost: 0,
      racketCostText: '0.00',
      stringingCostText: '0.00',
      totalCostText: '0.00',
    },
  } as ProfileData,
  pageLifetimes: {
    show() {
      this.refreshRackets()
    },
  },
  methods: {
    async refreshRackets() {
      try {
        const dashboard = await getRacketStatsFromApi()

        this.setData({
          dashboard,
        })
      } catch (error) {
        wx.showToast({
          title: error instanceof Error ? error.message : '服务暂时不可用',
          icon: 'none',
        })
      }
    },
    goRackets() {
      wx.navigateTo({
        url: '/pages/rackets/rackets',
      })
    },
  },
})
