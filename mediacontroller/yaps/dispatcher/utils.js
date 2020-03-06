/**
 * @author Pedro Sanders
 * @since v1
 */
// TODO: This should be taken from the database.
module.exports.getIngressApp = extension => {
    this.getConfig = () => {
        storageBucket: 'default'
    }

    this.getPathToEntryPoint = appId => {
        const package = `/apps/${appId}/package.json`
        let entryPoint
        try {
            entryPoint = require(package).entryPoint
        } catch(e) {
            throw `Unable to find ${package}`
        }
        return entryPoint || 'index.js'
    }
}
