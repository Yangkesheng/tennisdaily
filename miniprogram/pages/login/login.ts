interface LoginData {
  currentYear: number
}

Component({
  data: {
    currentYear: new Date().getFullYear(),
  } as LoginData,
  methods: {
    loginAndEnter() {
      wx.setStorageSync('tennis_login_ready', true)
      wx.switchTab({
        url: '/pages/index/index',
      })
    },
  },
})
