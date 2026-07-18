import { CLOUD_AVATAR_FOLDER } from './api-config'

const getFileExtension = (filePath: string) => {
  const match = filePath.match(/\.([a-zA-Z0-9]+)(?:\?.*)?$/)
  return match ? match[1] : 'jpg'
}

const createCloudAvatarPath = (filePath: string) => {
  const extension = getFileExtension(filePath)
  const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`
  return `${CLOUD_AVATAR_FOLDER}/${suffix}.${extension}`
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
