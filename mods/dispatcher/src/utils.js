/**
 * @author Pedro Sanders
 * @since v1
 */
const { logger } = require('@yaps/core')
// TODO: This should be taken from the database.
module.exports.getIngressApp = function(extension) {
    this.getConfig = () => {
        return {
            bucket: process.env.MC_APP_BUCKET,
            appId: process.env.MC_APP_ID
        }
    }

    this.getPathToEntryPoint = () => {
        logger.info(`@yaps/dispatcher getPathToEntryPoint [appid: ${process.env.MC_APP_ID}]`)
        logger.info(`@yaps/dispatcher getPathToEntryPoint [apps dir: ${process.env.MC_APP_DIR}]`)

        const packageBase =  `${process.env.MC_APP_DIR}/${this.getConfig().appId}`
        const package = `${packageBase}/package.json`

        let entryPoint
        try {
            entryPoint = require(package).main
        } catch(e) {
            logger.info('error', e)
            throw new Error(`Unable to find ${package}`)
        }
        return `${packageBase}/${entryPoint || 'index.js'}`
    }

    return this
}
