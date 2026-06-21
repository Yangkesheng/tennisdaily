
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
      wx.setStorageSync(PRIVACY_ACCEPTED_STORAGE_KEY, '1')
      this.triggerEvent('accept')
    },
    reject() {
      this.triggerEvent('reject')
    },
    openPrivacyPolicy() {
      this.triggerEvent('openpolicy')
    },
  },
})
