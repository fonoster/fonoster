const merge = require('deepmerge')
const fs = require('fs')
const path = require('path')
const logger = require('./logger')

class AbstractService {

    constructor(options) {
        const defaultConfig = {
           endpoint: process.env.APISERVER_ENDPOINT,
           bucket: process.env.FS_DEFAULT_STORAGE_BUCKET
        }

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

        logger.log('debug', `@yaps/core.AbstractService constructor [defaultConfig -> ${JSON.stringify(defaultConfig)}]`)
        logger.log('debug', `@yaps/core.AbstractService constructor [options -> ${JSON.stringify(options)}]`)
        logger.log('debug', `@yaps/core.AbstractService constructor [merge options -> ${JSON.stringify(this.options)}]`)

        if (!this.options.accessKeyId || !this.options.accessKeySecret) {
            throw new Error('Not valid credentials found')
        }
    }

    getOptions() {
        return this.options
    }
}

module.exports = AbstractService
