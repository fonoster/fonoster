/**
 * @author Pedro Sanders
 * @since v1
 */
// TODO: This should be taken from the database.
module.exports.getIngressApp = function(extension) {
    this.getConfig = () => {
        return {
            storageBucket: 'default-test',
            appId: 'presidential-poll'
        }
    }

    this.getPathToEntryPoint = () => {
        const packageBase = `/apps/${this.getConfig().appId}`
        const package = `${packageBase}/package.json`
        console.log('package: ', package)
        let entryPoint
        try {
            entryPoint = require(package).main
        } catch(e) {
            throw `Unable to find ${package}`
        }
        return `${packageBase}/${entryPoint || 'index.js'}`
    }

    return this
}
