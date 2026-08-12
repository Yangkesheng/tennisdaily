import type { UpdateUserSettingsPayload, UserSettings } from '../models/user-settings'
import { ensureLogin } from './auth-service'
import { request } from './request'

interface ApiUserSettings {
  signature?: string | null
  defaultCourtName?: string | null
  defaultDurationMinutes?: number | null
}

const normalizeSettings = (settings: ApiUserSettings | null | undefined): UserSettings => ({
  signature: settings?.signature || '',
  defaultCourtName: settings?.defaultCourtName || '',
  defaultDurationMinutes: typeof settings?.defaultDurationMinutes === 'number' ? settings.defaultDurationMinutes : 0,
})

export const getUserSettingsFromApi = async (): Promise<UserSettings> => {
  await ensureLogin()
  const settings = await request<ApiUserSettings | null>({
    url: '/api/user-settings',
  })

  return normalizeSettings(settings)
}

export const updateUserSettingsFromApi = async (payload: UpdateUserSettingsPayload): Promise<UserSettings> => {
  await ensureLogin()
  const settings = await request<ApiUserSettings | null>({
    url: '/api/user-settings',
    method: 'PUT',
    data: payload,
  })

  return normalizeSettings(settings)
}
