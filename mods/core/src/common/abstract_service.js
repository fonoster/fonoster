/**
 * @author Pedro Sanders
 * @since v1
 */
const merge = require('deepmerge')
const fs = require('fs')
const path = require('path')

const defaultConfig = {
   endpoint: 'localhost:50052'
}

class AbstractService {

    constructor(options) {
        try {
            const credentialsFile =
                path.join(require('os').homedir(), 'yaps', 'credentials')
            const credentials = fs.readFileSync(credentialsFile).toString().trim()
            defaultConfig.accessKeyId = credentials.split(':')[0]
            defaultConfig.accessKeySecret = credentials.split(':')[1]
        } catch (e) {
        }

        if(process.env.ACCESS_KEY_ID) {
            defaultConfig.accessKeyId = process.env.ACCESS_KEY_ID
        }

        if(process.env.ACCESS_KEY_SECRET) {
            defaultConfig.accessKeySecret = process.env.ACCESS_KEY_SECRET
        }

        this.options = merge(defaultConfig, options || {})

        if (!this.options.accessKeyId || !this.options.accessKeySecret) {
            throw `Client didn't find valid credentials`
        }
    }

    getOptions() {
        return this.options
    }
}

module.exports = AbstractService
