import { TOKEN_STORAGE_KEY } from './api-config'
import { request } from './request'

interface WechatLoginResponse {
  token: string
  userId: number
  openid: string
}

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

export const ensureLogin = async () => {
  const token = getToken()

  if (token) {
    return token
  }

  const loginResult = await loginWithWechat()

  return loginResult.token
}
