import Numbers from '@fonos/numbers'
import logger from '@fonos/logger'

export default function (extension: string) {
  // We check for a handler, and return default none exist
  try {
    const numbers = new Numbers()
    const app = numbers.getIngressAppSync({ e164Number: extension })
    const appsDir = `/fonos/apps/${app.getAccessKeyId()}`
    const packageBase = `${appsDir}/${app.getName()}`
    const pathToEntryPoint = `${packageBase}/package.json`
    // const pathToAppConfig = `${packageBase}/fonos.json`

    try {
      const entryPoint = require(pathToEntryPoint).main
      return {
        entryPoint: `${packageBase}/${entryPoint}`
      }
    } catch (e) {
      logger.log(
        'error',
        `@fonos/dispatcher [unable find entry point. Ensure that path '${pathToEntryPoint}' exist and has the correct permissions.`
      )
    }
  } catch (e) {
    logger.log(
      'error',
      `@fonos/dispatcher getIngressInfo [could not find handler for ext '${extension}']`
    )
  }
}
