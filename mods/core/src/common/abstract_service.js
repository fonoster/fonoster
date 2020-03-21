const merge = require('deepmerge')
const fs = require('fs')
const path = require('path')
const logger = require('./logger')

class AbstractService {
  /**
   * Use the Options object to overwrite the service default configuration.
   * @typedef {Object} Options
   * @property {string} endpoint - The endpoint URI to send requests to.
   * The endpoint should be a string like '{serviceHost}:{servicePort}'.
   * @property {string} accessKeyId - your YAPS access key ID.
   * @property {string} accessKeySecret - your YAPS secret access key.
   * @property {string} bucket - The bucket to upload apps and media files.
   */

  /**
   * Constructs a service object.
   *
   * @param {Options} options - Overwrite for the service's defaults configuration.
   */
  constructor (options = {}) {
    const defaultConfig = {
      bucket: process.env.FS_DEFAULT_STORAGE_BUCKET
    }

    try {
      let accessFile
      if (process.env.YAPS_ACCESS_FILE) {
        accessFile = process.env.YAPS_ACCESS_FILE
      } else {
        accessFile = path.join(require('os').homedir(), '.yaps', 'access')
      }
      const access = JSON.parse(
        fs
          .readFileSync(accessFile)
          .toString()
          .trim()
      )
      defaultConfig.endpoint = access.endpoint
      defaultConfig.accessKeyId = access.accessKeyId
      defaultConfig.accessKeySecret = access.accessKeySecret
    } catch (e) {}

    if (process.env.YAPS_ENDPOINT) {
      defaultConfig.endpoint = process.env.YAPS_ENDPOINT
    }

    if (process.env.YAPS_ACCESS_KEY_ID) {
      defaultConfig.accessKeyId = process.env.YAPS_ACCESS_KEY_ID
    }

    if (process.env.YAPS_ACCESS_KEY_SECRET) {
      defaultConfig.accessKeySecret = process.env.YAPS_ACCESS_KEY_SECRET
    }

    this.options = merge(defaultConfig, options)

    logger.log(
      'debug',
      `@yaps/core.AbstractService constructor [defaultConfig -> ${JSON.stringify(
        defaultConfig
      )}]`
    )
    logger.log(
      'debug',
      `@yaps/core.AbstractService constructor [options -> ${JSON.stringify(
        options
      )}]`
    )
    logger.log(
      'debug',
      `@yaps/core.AbstractService constructor [merge options -> ${JSON.stringify(
        this.options
      )}]`
    )

    if (!this.options.accessKeyId || !this.options.accessKeySecret) {
      throw new Error('Not valid credentials found')
    }
  }

  getOptions () {
    return this.options
  }
}

module.exports = AbstractService
