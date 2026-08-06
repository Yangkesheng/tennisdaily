import { CLOUD_SHOE_FOLDER } from './api-config'

export const MAX_SHOE_IMAGE_SIZE = 2 * 1024 * 1024
const SHOE_IMAGE_COMPRESS_QUALITY = 80
const SHOE_IMAGE_SIZE_LIMIT_MESSAGE = '图片不能超过 2MB'

const getFileExtension = (filePath: string) => {
  const match = filePath.match(/\.([a-zA-Z0-9]+)(?:\?.*)?$/)
  return match ? match[1] : 'jpg'
}

/**
 * 清洗云存储目录片段，与后端球拍库上传逻辑一致：
 * 保留字母数字、中文与 ! - _ . *，其余字符转为 -，连续 - 合并，空值回退 unknown。
 */
const sanitizeCloudSegment = (value: string) => {
  const mapped = Array.from(value.trim())
    .map((char) => {
      if (/[a-zA-Z0-9!\-_.*]/.test(char)) {
        return char
      }
      if (/[\u4e00-\u9fa5]/.test(char)) {
        return char
      }
      return '-'
    })
    .join('')
    .replace(/--+/g, '-')

  const trimmed = mapped.replace(/^[-.]+|[-.]+$/g, '')
  return trimmed || 'unknown'
}

// 路径结构对齐球拍库：{folder}/{品牌}/{系列}/{文件名}{ext}
// 文件名使用 型号+配色，如 vapor-12-white-orewood-brown.jpg
const createCloudShoePath = (filePath: string, brand: string, series: string, model: string, colorway: string) => {
  const extension = getFileExtension(filePath)
  const brandSegment = sanitizeCloudSegment(brand)
  const seriesSegment = sanitizeCloudSegment(series)
  const modelSegment = sanitizeCloudSegment(model)
  const colorwaySegment = sanitizeCloudSegment(colorway)
  const fileName = [modelSegment, colorwaySegment].filter((segment) => segment && segment !== 'unknown').join('-')
    || `${Date.now()}-${Math.random().toString(16).slice(2)}`
  return `${CLOUD_SHOE_FOLDER}/${brandSegment}/${seriesSegment}/${fileName}.${extension}`
}

const getFileSize = async (filePath: string): Promise<number> => {
  const result = await wx.getFileInfo({ filePath })
  return result.size
}

/**
 * 准备球鞋图：超过 2MB 先压缩，仍超限则报错。
 */
export const prepareShoeImageForUpload = async (filePath: string, size: number): Promise<string> => {
  if (size <= MAX_SHOE_IMAGE_SIZE) {
    return filePath
  }

  let compressedFilePath: string
  try {
    const result = await wx.compressImage({
      src: filePath,
      quality: SHOE_IMAGE_COMPRESS_QUALITY,
    })
    compressedFilePath = result.tempFilePath
  } catch {
    throw new Error(`${SHOE_IMAGE_SIZE_LIMIT_MESSAGE}，请更换图片`)
  }

  const compressedSize = await getFileSize(compressedFilePath)
  if (compressedSize > MAX_SHOE_IMAGE_SIZE) {
    throw new Error(`${SHOE_IMAGE_SIZE_LIMIT_MESSAGE}，请更换图片`)
  }

  return compressedFilePath
}

/**
 * 上传球鞋图到云存储，返回 fileID。
 */
export const uploadShoeImageToCloudStorage = async (
  filePath: string,
  brand: string,
  series: string,
  model: string,
  colorway: string,
): Promise<string> => {
  if (!wx.cloud) {
    throw new Error('云开发未初始化，请检查小程序环境配置')
  }

  const uploadResult = await wx.cloud.uploadFile({
    cloudPath: createCloudShoePath(filePath, brand, series, model, colorway),
    filePath,
  })

  return uploadResult.fileID
}

/**
 * 删除云存储中的球鞋图（替换/移除时清理旧文件）。
 */
export const deleteShoeImageFromCloudStorage = async (fileID: string): Promise<void> => {
  if (!fileID) {
    return
  }
  if (!wx.cloud) {
    throw new Error('云开发未初始化，请检查小程序环境配置')
  }

  await wx.cloud.deleteFile({
    fileList: [fileID],
  })
}
