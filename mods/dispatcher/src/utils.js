/**
 * @author Pedro Sanders
 * @since v1
 */
const fs = require('fs')
const { logger } = require('@yaps/core')
const Numbers = require('@yaps/numbers')

module.exports.getIngressInfo = extension => {

    try {
        const numbers = new Numbers()

        // We check for a handler, and return default if it does not exist
        let appName = 'default'
        try {
            const app = numbers.getIngressApp({e164Number: extension})
            appName = app.getName()
        } catch(e) {
            logger.log('error', `@yaps/dispatcher getIngressInfo [could not find handler for ext '${extension}']`)
        }

        logger.log('debug', `@yaps/dispatcher getIngressInfo [apps dir: ${process.env.MC_APPS_DIR}]`)
        logger.log('debug', `@yaps/dispatcher getIngressInfo [appName: ${appName}]`)

        const packageBase =  `${process.env.MC_APPS_DIR}/${appName}`
        const pathToEntryPoint = `${packageBase}/package.json`
        const pathToAppConfig =  `${packageBase}/yaps.json`

        let entryPoint
        let bucket

        try {
            entryPoint = require(pathToEntryPoint).main
        } catch(e) {}

        try {
            bucket = JSON.parse(fs.readFileSync(pathToAppConfig)).bucket
        } catch(e) {}

        return {
            entryPoint: `${packageBase}/${entryPoint || 'index.js'}`,
            bucket: bucket || process.env.FS_DEFAULT_STORAGE_BUCKET
        }
    } catch(err) {
        throw err
    }

}
