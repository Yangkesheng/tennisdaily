import { TOKEN_STORAGE_KEY } from './api-config'
import { request } from './request'

export interface UserProfile {
  id: number
  phone: string
  maskedPhone: string
  nickname: string
  avatarUrl: string
  createdAt: string
  updatedAt: string
}

interface WechatLoginResponse {
  token: string
  userId: number
  openid: string
}

interface PhoneLoginResponse {
  token: string
  user: UserProfile
  isNewUser: boolean
}

const LOGIN_PAGE_PATH = '/pages/login/login'
let isRedirectingToLogin = false

const requestWechatCode = (): Promise<string> => {
  return new Promise((resolve, reject) => {
    wx.login({
      success: (result) => {
        if (!result.code) {
          reject(new Error('微信登录失败'))
          return
        }

        resolve(result.code)
      },
      fail: () => {
        reject(new Error('微信登录失败'))
      },
    })
  })
}

export const getToken = () => {
  return wx.getStorageSync(TOKEN_STORAGE_KEY) as string | ''
}

export const clearToken = () => {
  wx.removeStorageSync(TOKEN_STORAGE_KEY)
}

export const loginWithWechat = async (): Promise<WechatLoginResponse> => {
  const code = await requestWechatCode()
  const loginResult = await request<WechatLoginResponse>({
    url: '/api/auth/wechat-login',
    method: 'POST',
    data: {
      code,
    },
    auth: false,
  })

  wx.setStorageSync(TOKEN_STORAGE_KEY, loginResult.token)

  return loginResult
}

export const loginWithPhone = async (phoneCode: string): Promise<PhoneLoginResponse> => {
  const loginCode = await requestWechatCode()
  const loginResult = await request<PhoneLoginResponse>({
    url: '/api/auth/phone-login',
    method: 'POST',
    data: {
      loginCode,
      phoneCode,
    },
    auth: false,
  })

  wx.setStorageSync(TOKEN_STORAGE_KEY, loginResult.token)

  return loginResult
}

export const getCurrentUserFromApi = async (): Promise<UserProfile> => {
  return request<UserProfile>({
    url: '/api/auth/me',
  })
}

export const getAdminPermissionsFromApi = async (): Promise<{ isAdmin: boolean }> => {
  return request<{ isAdmin: boolean }>({
    url: '/api/admin/permissions',
  })
}

export const updateUserProfile = async (profile: Pick<UserProfile, 'nickname' | 'avatarUrl'>): Promise<UserProfile> => {
  return request<UserProfile>({
    url: '/api/auth/profile',
    method: 'PUT',
    data: profile,
  })
}

/**
 * 确保已通过微信官方隐私授权（type="nickname" 输入框在未授权时会降级为普通输入框）。
 * 已授权时立即成功，不会重复弹出授权弹窗。
 */
export const ensurePrivacyAuthorized = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (typeof wx.requirePrivacyAuthorize !== 'function') {
      resolve()
      return
    }

    wx.requirePrivacyAuthorize({
      success: () => resolve(),
      fail: () => reject(new Error('需要同意隐私授权后才能设置昵称')),
    })
  })
}

export const logoutFromApi = async (): Promise<void> => {
  const token = getToken()
  if (token) {
    await request<WechatMiniprogram.IAnyObject>({
      url: '/api/auth/logout',
      method: 'POST',
    })
  }

  clearToken()
}

export const redirectToLogin = () => {
  if (isRedirectingToLogin) {
    return
  }

  const pages = getCurrentPages()
  const currentRoute = pages[pages.length - 1]?.route || ''
  if (`/${currentRoute}` === LOGIN_PAGE_PATH) {
    return
  }

  isRedirectingToLogin = true
  wx.navigateTo({
    url: LOGIN_PAGE_PATH,
    complete: () => {
      isRedirectingToLogin = false
    },
  })
}

export const requireLoginPage = () => {
  if (getToken()) {
    return false
  }

  redirectToLogin()
  return true
}

export const ensureLogin = async () => {
  const token = getToken()

  if (!token) {
    redirectToLogin()
    throw new Error('请先登录')
  }

  return token
}
