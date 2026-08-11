import type { Feedback, FeedbackDraft } from '../models/feedback'
import { ensureLogin } from './auth-service'
import { request } from './request'

export const createFeedbackFromApi = async (draft: FeedbackDraft): Promise<Feedback> => {
  await ensureLogin()

  return request<Feedback>({
    url: '/api/feedback',
    method: 'POST',
    data: draft,
  })
}
