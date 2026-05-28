import { API_BASE_URL, TOKEN_STORAGE_KEY } from './api-config'

export interface ApiResponse<T> {
  code: number
  message: string
  data: T
}

export type RequestMethod = 'GET' | 'POST' | 'PUT' | 'DELETE'

interface RequestOptions {
  url: string
  method?: RequestMethod
  data?: WechatMiniprogram.IAnyObject
  auth?: boolean
}

const getFriendlyErrorMessage = (message: string) => {
  if (!message || message === 'internal error') {
    return '服务暂时不可用'
  }

  if (message === 'unauthorized') {
    return '登录已过期'
  }

  if (message === 'invalid request') {
    return '记录信息有误'
  }

  if (message === 'not found') {
    return '记录不存在'
  }

  return message
}

export const request = <T>(options: RequestOptions): Promise<T> => {
  const token = wx.getStorageSync(TOKEN_STORAGE_KEY) as string | ''
  const headers: WechatMiniprogram.IAnyObject = {
    'Content-Type': 'application/json',
  }

  if (options.auth !== false && token) {
    headers.Authorization = `Bearer ${token}`
  }

  return new Promise((resolve, reject) => {
    wx.request<ApiResponse<T>>({
      url: `${API_BASE_URL}${options.url}`,
      method: options.method || 'GET',
      data: options.data,
      header: headers,
      success: (res) => {
        const body = res.data

        if (!body || body.code !== 0) {
          reject(new Error(getFriendlyErrorMessage(body?.message || '请求失败')))
          return
        }

        resolve(body.data)
      },
      fail: () => {
        reject(new Error('网络连接失败'))
      },
    })
  })
}
