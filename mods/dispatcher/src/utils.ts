const fs = require('fs')
const { logger } = require('@fonos/core')
const Numbers = require('@fonos/numbers')

module.exports.getIngressInfo = extension => {
  try {
    const numbers = new Numbers()

    // We check for a handler, and return default if it does not exist
    let appName = 'default'
    try {
      const app = numbers.getIngressAppSync({ e164Number: extension })
      appName = app.getName()
    } catch (e) {
      logger.log(
        'error',
        `@fonos/dispatcher getIngressInfo [could not find handler for ext '${extension}']`
      )
    }

    const appsDir = process.env.APPS_DIR || '/fonos/apps'

    logger.log(
      'debug',
      `@fonos/dispatcher getIngressInfo [apps dir: ${appsDir}, app name: ${appName}]`
    )

    const packageBase = `${appsDir}/${appName}`
    const pathToEntryPoint = `${packageBase}/package.json`
    const pathToAppConfig = `${packageBase}/fonos.json`

    let entryPoint
    let bucket

    try {
      entryPoint = require(pathToEntryPoint).main
    } catch (e) {}

    try {
      bucket = JSON.parse(fs.readFileSync(pathToAppConfig)).bucket
    } catch (e) {}

    return {
      entryPoint: `${packageBase}/${entryPoint || 'index.js'}`,
      bucket
      //bucket: bucket || process.env.FS_DEFAULT_STORAGE_BUCKET
    }
  } catch (err) {
    throw err
  }
}
