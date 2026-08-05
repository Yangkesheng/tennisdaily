
const PRIVACY_ACCEPTED_STORAGE_KEY = 'privacy_policy_accepted'

Component({
  properties: {
    visible: {
      type: Boolean,
      value: false,
    },
  },
  methods: {
    noop() {},
    accept() {
      const applyAccept = () => {
        wx.setStorageSync(PRIVACY_ACCEPTED_STORAGE_KEY, '1')
        this.triggerEvent('accept')
      }

      if (typeof wx.requirePrivacyAuthorize !== 'function') {
        applyAccept()
        return
      }

      wx.requirePrivacyAuthorize({
        success: applyAccept,
        fail: () => {
          wx.showToast({
            title: '未同意隐私授权，无法继续登录',
            icon: 'none',
          })
        },
      })
    },
    reject() {
      this.triggerEvent('reject')
    },
    openPrivacyPolicy() {
      this.triggerEvent('openpolicy')
    },
  },
})
