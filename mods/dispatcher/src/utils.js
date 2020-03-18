/**
 * @author Pedro Sanders
 * @since v1
 */
const fs = require('fs')
const { logger } = require('@yaps/core')
const AppManager = require('@yaps/appmanager')

module.exports.getIngressInfo = extension => {

    try {
        const appmanager = new AppManager()
        //const appRef = appmanager.getExtLink(extension)
        const appId = 'hello-monkeys'

        logger.info(`@yaps/dispatcher getIngressInfo [apps dir: ${process.env.MC_APPS_DIR}]`)
        logger.info(`@yaps/dispatcher getIngressInfo [appId: ${appId}]`)

        const packageBase =  `${process.env.MC_APPS_DIR}/${appId}`
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
