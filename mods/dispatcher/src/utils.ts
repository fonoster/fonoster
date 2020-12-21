import Numbers from '@fonos/numbers'
import logger from '@fonos/logger'
import fs from 'fs'

export default function (extension: string) {
  // We check for a handler, and return default none exist
  let appName = 'default'
  try {
    const numbers = new Numbers()
    const app = numbers.getIngressAppSync({ e164Number: extension })
    appName = app.getName()
  } catch (e) {
    logger.log(
      'error',
      `@fonos/dispatcher getIngressInfo [could not find handler for ext '${extension}']`
    )
  }

  const appsDir = process.env.APPS_DIR || '/fonos/apps'
  const packageBase = `${appsDir}/${appName}`
  const pathToEntryPoint = `${packageBase}/package.json`
  const pathToAppConfig = `${packageBase}/fonos.json`

  let entryPoint
  let bucket

  try {
    entryPoint = require(pathToEntryPoint).main
  } catch (e) {
    logger.log(
      'error',
      `@fonos/dispatcher unable to access path to entry point`
    )
  }

  try {
    bucket = JSON.parse(`${fs.readFileSync(pathToAppConfig)}`).bucket
  } catch (e) {
    logger.log('warrn', `@fonos/dispatcher using default storage bucket`)
  }

  return {
    entryPoint: `${packageBase}/${entryPoint || 'index.js'}`,
    bucket: bucket || process.env.FS_DEFAULT_STORAGE_BUCKET
  }
}
