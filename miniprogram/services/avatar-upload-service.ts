import { CLOUD_AVATAR_FOLDER } from './api-config'

export const MAX_AVATAR_SIZE = 2 * 1024 * 1024
const AVATAR_COMPRESS_QUALITY = 80
const AVATAR_SIZE_LIMIT_MESSAGE = '头像不能超过 2MB'

const getFileExtension = (filePath: string) => {
  const match = filePath.match(/\.([a-zA-Z0-9]+)(?:\?.*)?$/)
  return match ? match[1] : 'jpg'
}

const createCloudAvatarPath = (filePath: string) => {
  const extension = getFileExtension(filePath)
  const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`
  return `${CLOUD_AVATAR_FOLDER}/${suffix}.${extension}`
}

const getFileSize = async (filePath: string): Promise<number> => {
  const result = await wx.getFileInfo({ filePath })
  return result.size
}

export const prepareAvatarForUpload = async (filePath: string, size: number): Promise<string> => {
  if (size <= MAX_AVATAR_SIZE) {
    return filePath
  }

  let compressedFilePath: string
  try {
    const result = await wx.compressImage({
      src: filePath,
      quality: AVATAR_COMPRESS_QUALITY,
    })
    compressedFilePath = result.tempFilePath
  } catch {
    throw new Error(`${AVATAR_SIZE_LIMIT_MESSAGE}，请更换图片`)
  }

  const compressedSize = await getFileSize(compressedFilePath)
  if (compressedSize > MAX_AVATAR_SIZE) {
    throw new Error(`${AVATAR_SIZE_LIMIT_MESSAGE}，请更换图片`)
  }

  return compressedFilePath
}

export const uploadAvatarToCloudStorage = async (filePath: string): Promise<string> => {
  if (!wx.cloud) {
    throw new Error('云开发未初始化，请检查小程序环境配置')
  }

  const uploadResult = await wx.cloud.uploadFile({
    cloudPath: createCloudAvatarPath(filePath),
    filePath,
  })

  return uploadResult.fileID
}

export const deleteAvatarFromCloudStorage = async (fileID: string): Promise<void> => {
  if (!wx.cloud) {
    throw new Error('云开发未初始化，请检查小程序环境配置')
  }

  await wx.cloud.deleteFile({
    fileList: [fileID],
  })
}
