import Numbers from '@fonos/numbers'
import logger from '@fonos/logger'

export default function (extension: string) {
  // We check for a handler, and return default none exist
  try {
    const numbers = new Numbers()
    const app = numbers.getIngressAppSync({ e164Number: extension })
    const appsDirBase = process.env.APPS_DIR || '/home/fonos/apps'
    const appsDir = `${appsDirBase}/${app.getAccessKeyId()}`
    const packageBase = `${appsDir}/${app.getRef()}`
    const pathToManifest = `${packageBase}/package.json`

    try {
      const entryPoint = require(pathToManifest).main
      return {
        entryPoint: `${packageBase}/${entryPoint}`,
        accessKeyId: app.getAccessKeyId()
      }
    } catch (e) {
      if (e instanceof SyntaxError) {
        logger.log(
          'error',
          `@fonos/dispatcher [Ensure that package.json in ${pathToManifest} has a valid syntax]`
        )
      }
      if (e instanceof Error)
      logger.log(
        'error',
        `@fonos/dispatcher [unable find entry point. Ensure that path '${pathToManifest}' exist and has the correct permissions.`
      )
    }
  } catch (e) {
    logger.log(
      'error',
      `@fonos/dispatcher getIngressInfo [could not find handler for ext '${extension}']`
    )
  }
}
