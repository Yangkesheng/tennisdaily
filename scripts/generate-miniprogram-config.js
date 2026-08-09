const fs = require('fs')
const path = require('path')

const rootDir = path.resolve(__dirname, '..')
const yamlPath = path.join(rootDir, 'miniprogram', 'app-config.yaml')
const outputPath = path.join(rootDir, 'miniprogram', 'services', 'api-config.ts')

const readScalar = (content, section, key, fallback) => {
  const lines = content.split(/\r?\n/)
  let inSection = false

  for (const line of lines) {
    if (!line.trim() || line.trim().startsWith('#')) {
      continue
    }

    const sectionMatch = line.match(/^([^\s:][^:]*):\s*$/)
    if (sectionMatch) {
      inSection = sectionMatch[1] === section
      continue
    }

    if (!inSection) {
      continue
    }

    const keyMatch = line.match(new RegExp(`^\\s+${key}:\\s*(.+?)\\s*$`))
    if (keyMatch) {
      return keyMatch[1].replace(/^['"]|['"]$/g, '')
    }
  }

  return fallback
}

const yamlContent = fs.readFileSync(yamlPath, 'utf8')
const apiBaseUrl = readScalar(yamlContent, 'api', 'baseUrl', 'http://localhost:8081')
const useCloudContainer = readScalar(yamlContent, 'api', 'useCloudContainer', 'false') === 'true'
const cloudEnv = readScalar(yamlContent, 'api', 'cloudEnv', '')
const cloudService = readScalar(yamlContent, 'api', 'cloudService', '')
const cloudStorageBucket = readScalar(yamlContent, 'api', 'cloudStorageBucket', '')
const cloudAvatarFolder = readScalar(yamlContent, 'api', 'cloudAvatarFolder', 'avatar')
const cloudRacketFolder = readScalar(yamlContent, 'api', 'cloudRacketFolder', 'racket_library')
const cloudShoeFolder = readScalar(yamlContent, 'api', 'cloudShoeFolder', 'shoes')
const tokenKey = readScalar(yamlContent, 'storage', 'tokenKey', 'token')
const output = `// This file is generated from miniprogram/app-config.yaml. Do not edit manually.\nexport const API_BASE_URL = '${apiBaseUrl}'\nexport const USE_CLOUD_CONTAINER = ${useCloudContainer}\nexport const CLOUD_ENV = '${cloudEnv}'\nexport const CLOUD_SERVICE = '${cloudService}'\nexport const CLOUD_STORAGE_BUCKET = '${cloudStorageBucket}'\nexport const CLOUD_AVATAR_FOLDER = '${cloudAvatarFolder}'\nexport const CLOUD_RACKET_FOLDER = '${cloudRacketFolder}'\nexport const CLOUD_SHOE_FOLDER = '${cloudShoeFolder}'\nexport const TOKEN_STORAGE_KEY = '${tokenKey}'\n`

fs.writeFileSync(outputPath, output)
console.log(`Generated ${path.relative(rootDir, outputPath)} from ${path.relative(rootDir, yamlPath)}`)
