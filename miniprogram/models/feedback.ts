export interface FeedbackDraft {
  content: string
  contact: string
}

export interface Feedback {
  id: number
  content: string
  contact: string
  status: number
  createdAt?: string
}
