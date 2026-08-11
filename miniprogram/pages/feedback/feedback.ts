import type { FeedbackDraft } from '../../models/feedback'
import { createFeedbackFromApi } from '../../services/feedback-api-service'
import { requireLoginPage } from '../../services/auth-service'

interface FeedbackInputEvent {
  detail: {
    value: string
  }
}

interface FeedbackData {
  content: string
  contact: string
  isSubmitting: boolean
}

Page({
  data: {
    content: '',
    contact: '',
    isSubmitting: false,
  } as FeedbackData,
  contentInputValue: '',
  contactInputValue: '',
  onContentInput(event: FeedbackInputEvent) {
    // 输入过程中不调用 setData，避免 textarea 重渲染导致 iOS 失焦
    this.contentInputValue = event.detail.value
  },
  syncContentValue(event: FeedbackInputEvent) {
    this.contentInputValue = event.detail.value
    this.setData({ content: event.detail.value })
  },
  onContactInput(event: FeedbackInputEvent) {
    this.contactInputValue = event.detail.value
  },
  syncContactValue(event: FeedbackInputEvent) {
    this.contactInputValue = event.detail.value
    this.setData({ contact: event.detail.value })
  },
  async submitFeedback() {
    if (this.data.isSubmitting) {
      return
    }
    if (requireLoginPage()) {
      return
    }

    const content = (this.contentInputValue || this.data.content).trim()
    if (!content) {
      wx.showToast({
        title: '请填写反馈内容',
        icon: 'none',
      })
      return
    }

    this.setData({ isSubmitting: true })

    const draft: FeedbackDraft = {
      content,
      contact: (this.contactInputValue || this.data.contact).trim(),
    }

    try {
      await createFeedbackFromApi(draft)
      wx.showToast({
        title: '反馈已提交，感谢支持',
        icon: 'success',
      })
      setTimeout(() => {
        wx.navigateBack()
      }, 800)
    } catch (error) {
      wx.showToast({
        title: error instanceof Error ? error.message : '提交失败，请稍后重试',
        icon: 'none',
      })
      this.setData({ isSubmitting: false })
    }
  },
})
