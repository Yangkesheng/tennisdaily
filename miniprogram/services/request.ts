import { API_BASE_URL, CLOUD_ENV, CLOUD_SERVICE, TOKEN_STORAGE_KEY, USE_CLOUD_CONTAINER } from './api-config'

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

interface CallContainerOptions {
  config: {
    env: string
  }
  path: string
  method: RequestMethod
  data?: WechatMiniprogram.IAnyObject
  header: WechatMiniprogram.IAnyObject
  success: (res: { data: unknown; statusCode?: number; header?: WechatMiniprogram.IAnyObject }) => void
  fail: (err: { errMsg?: string }) => void
}

const LOGIN_PAGE_PATH = '/pages/login/login'
let isRedirectingToLogin = false

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

const parseApiResponse = <T>(raw: unknown): ApiResponse<T> | undefined => {
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw) as ApiResponse<T>
    } catch (error) {
      console.error('parse api response failed', raw, error)
      return undefined
    }
  }

  return raw as ApiResponse<T> | undefined
}

const redirectToLoginForAuth = () => {
  if (isRedirectingToLogin) {
    return
  }

  wx.removeStorageSync(TOKEN_STORAGE_KEY)
  isRedirectingToLogin = true

  const pages = getCurrentPages()
  const currentRoute = pages[pages.length - 1]?.route || ''
  if (`/${currentRoute}` === LOGIN_PAGE_PATH) {
    isRedirectingToLogin = false
    return
  }

  wx.navigateTo({
    url: LOGIN_PAGE_PATH,
    complete: () => {
      isRedirectingToLogin = false
    },
  })
}

const isUnauthorizedResponse = (body: ApiResponse<unknown> | undefined) => {
  return body?.message === 'unauthorized' || body?.code === 401 || body?.code === 40101
}

const handleApiResponse = <T>(body: ApiResponse<T> | undefined, resolve: (value: T) => void, reject: (reason?: Error) => void) => {
  if (!body || body.code !== 0) {
    if (isUnauthorizedResponse(body)) {
      redirectToLoginForAuth()
    }

    reject(new Error(getFriendlyErrorMessage(body?.message || '请求失败')))
    return
  }

  resolve(body.data)
}

export const request = <T>(options: RequestOptions): Promise<T> => {
  const token = wx.getStorageSync(TOKEN_STORAGE_KEY) as string | ''
  const headers: WechatMiniprogram.IAnyObject = {
    'Content-Type': 'application/json',
  }

  if (USE_CLOUD_CONTAINER) {
    headers['X-WX-SERVICE'] = CLOUD_SERVICE
  }

  if (options.auth !== false && token) {
    headers.Authorization = `Bearer ${token}`
  }

  return new Promise((resolve, reject) => {
    if (USE_CLOUD_CONTAINER) {
      if (!wx.cloud) {
        reject(new Error('云开发未初始化，请检查小程序 AppID 和云环境配置'))
        return
      }

      const cloud = wx.cloud as unknown as {
        callContainer?: (options: CallContainerOptions) => void
      }

      if (!cloud.callContainer) {
        reject(new Error('当前基础库不支持云托管调用，请升级微信开发者工具基础库'))
        return
      }

      cloud.callContainer({
        config: {
          env: CLOUD_ENV,
        },
        path: options.url,
        method: options.method || 'GET',
        data: options.data,
        header: headers,
        success: (res: { data: unknown }) => {
          console.log('callContainer success', {
            env: CLOUD_ENV,
            service: CLOUD_SERVICE,
            path: options.url,
            data: res.data,
          })
          handleApiResponse(parseApiResponse<T>(res.data), resolve, reject)
        },
        fail: (err) => {
          console.error('callContainer failed', {
            env: CLOUD_ENV,
            service: CLOUD_SERVICE,
            path: options.url,
            err,
          })
          reject(new Error(err.errMsg || '网络连接失败'))
        },
      })
      return
    }

    wx.request<ApiResponse<T>>({
      url: `${API_BASE_URL}${options.url}`,
      method: options.method || 'GET',
      data: options.data,
      header: headers,
      success: (res) => {
        handleApiResponse(parseApiResponse<T>(res.data), resolve, reject)
      },
      fail: (err) => {
        console.error('wx.request failed', err)
        reject(new Error('网络连接失败'))
      },
    })
  })
}

