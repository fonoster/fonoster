/**
 * @author Pedro Sanders
 * @since v1
 */
const merge = require('deepmerge')

const defaultConfig = {
    endpoint: 'localhost:50052'
}

module.exports.mergeOptions = options => merge(defaultConfig, options || {})
module.exports.getCredentials = options => {}
