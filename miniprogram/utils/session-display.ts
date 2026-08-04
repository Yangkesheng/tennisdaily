export type SessionDisplayField = 'duration' | 'courtName' | 'partner' | 'racketName' | 'shoeName' | 'cost' | 'note'

export interface SessionDisplayFieldOption {
  key: SessionDisplayField
  label: string
}

const STORAGE_KEY = 'session_list_display_fields_v1'

export const SESSION_DISPLAY_FIELD_OPTIONS: SessionDisplayFieldOption[] = [
  { key: 'duration', label: '时长' },
  { key: 'courtName', label: '场地' },
  { key: 'partner', label: '搭档' },
  { key: 'racketName', label: '球拍' },
  { key: 'shoeName', label: '球鞋' },
  { key: 'cost', label: '费用' },
  { key: 'note', label: '备注' },
]

const ALL_FIELDS = SESSION_DISPLAY_FIELD_OPTIONS.map((option) => option.key)

const isDisplayField = (value: unknown): value is SessionDisplayField => {
  return typeof value === 'string' && (ALL_FIELDS as string[]).includes(value)
}

export const loadVisibleDisplayFields = (): SessionDisplayField[] => {
  try {
    const stored = wx.getStorageSync(STORAGE_KEY)

    if (Array.isArray(stored)) {
      const fields = stored.filter(isDisplayField)

      if (fields.length) {
        return fields
      }
    }
  } catch {
    // 读取本地偏好失败时回退到默认值
  }

  return [...ALL_FIELDS]
}

export const saveVisibleDisplayFields = (fields: SessionDisplayField[]) => {
  try {
    wx.setStorageSync(STORAGE_KEY, fields)
  } catch {
    // 本地缓存失败不影响列表使用
  }
}
