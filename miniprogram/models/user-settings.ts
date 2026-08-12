export interface UserSettings {
  signature: string
  defaultCourtName: string
  defaultDurationMinutes: number
}

export interface UpdateUserSettingsPayload {
  signature?: string
  defaultCourtName?: string
  defaultDurationMinutes?: number
}
