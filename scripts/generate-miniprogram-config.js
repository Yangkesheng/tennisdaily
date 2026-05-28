const fs = require('fs')
const path = require('path')

const rootDir = path.resolve(__dirname, '..')
const yamlPath = path.join(rootDir, 'miniprogram', 'app-config.yaml')
const outputPath = path.join(rootDir, 'miniprogram', 'services', 'api-config.ts')

const readScalar = (content, section, key, fallback) => {
  const sectionRegExp = new RegExp(`^${section}:\\s*$([\\s\\S]*?)(?=^[^\\s#][^\\n]*:|\\z)`, 'm')
  const sectionMatch = content.match(sectionRegExp)

  if (!sectionMatch) {
    return fallback
  }

  const keyRegExp = new RegExp(`^\\s+${key}:\\s*(.+?)\\s*$`, 'm')
  const keyMatch = sectionMatch[1].match(keyRegExp)

  return keyMatch ? keyMatch[1].replace(/^['"]|['"]$/g, '') : fallback
}

const yamlContent = fs.readFileSync(yamlPath, 'utf8')
const apiBaseUrl = readScalar(yamlContent, 'api', 'baseUrl', 'http://localhost:8081')
const tokenKey = readScalar(yamlContent, 'storage', 'tokenKey', 'token')
const output = `// This file is generated from miniprogram/app-config.yaml. Do not edit manually.\nexport const API_BASE_URL = '${apiBaseUrl}'\nexport const TOKEN_STORAGE_KEY = '${tokenKey}'\n`

fs.writeFileSync(outputPath, output)
console.log(`Generated ${path.relative(rootDir, outputPath)} from ${path.relative(rootDir, yamlPath)}`)
