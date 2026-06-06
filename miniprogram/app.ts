import { CLOUD_ENV } from './services/api-config'

App<IAppOption>({
  globalData: {},
  onLaunch() {
    if (!wx.cloud) {
      console.error('wx.cloud 不可用，请确认已使用真实 AppID，并在微信开发者工具中启用云开发能力')
      return
    }

    wx.cloud.init({
      env: CLOUD_ENV,
      traceUser: true,
    })
  },
})
