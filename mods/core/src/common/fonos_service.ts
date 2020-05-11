const grpc = require('./grpc_hack')
const merge = require('deepmerge')
const fs = require('fs')
const path = require('path')
const logger = require('./logger')
const { getClientCredentials } = require('../common/trust_util')
const defaultOptions = {
  endpoint: 'localhost:50052',
  bucket: process.env.FS_DEFAULT_STORAGE_BUCKET || 'default'
}

class Service {
  ServiceClient: any
  options: any
  metadata: any
  service: any
  /**
   * Use the Options object to overwrite the service default configuration.
   * @typedef {Object} Options
   * @property {string} endpoint - The endpoint URI to send requests to.
   * The endpoint should be a string like '{serviceHost}:{servicePort}'.
   * @property {string} accessKeyId - your Fonos access key ID.
   * @property {string} accessKeySecret - your Fonos secret access key.
   * @property {string} bucket - The bucket to upload apps and media files.
   */

  /**
   * Constructs a service object.
   *
   * @param {Options} options - Overwrite for the service's defaults configuration.
   */
  constructor (ServiceClient, options = {}) {
    this.ServiceClient = ServiceClient
    this.options = merge(defaultOptions, options)
    const accessFile =
      process.env.API_ACCESS_FILE ||
      path.join(require('os').homedir(), '.fonos', 'access')
    try {
      const fileContent = fs
        .readFileSync(accessFile)
        .toString()
        .trim()
      const inFileOptions = JSON.parse(fileContent)
      this.options = merge(this.options, inFileOptions)
    } catch (err) {
      throw new Error(`Malformed access file found at: ${accessFile}`)
    }

    if (process.env.FONOS_ENDPOINT)
      this.options.endpoint = process.env.FONOS_ENDPOINT
    if (process.env.FONOS_ACCESS_KEY_ID)
      this.options.accessKeyId = process.env.FONOS_ACCESS_KEY_ID
    if (process.env.FONOS_ACCESS_KEY_SECRET)
      this.options.accessKeySecret = process.env.FONOS_ACCESS_KEY_SECRET
    this.options = merge(this.options, options)

    logger.log(
      'debug',
      `@fonos/core.Service constructor [merged options -> ${JSON.stringify(
        this.options
      )}]`
    )

    if (!this.options.accessKeyId || !this.options.accessKeySecret) {
      throw new Error('Not valid credentials found')
    }

    const metadata = new grpc.Metadata()
    metadata.add('access_key_id', this.options.accessKeyId)
    metadata.add('access_key_secret', this.options.accessKeySecret)
    this.metadata = metadata
  }

  init () {
    this.service = new this.ServiceClient(
      this.options.endpoint,
      getClientCredentials()
    )
  }

  getOptions () {
    return this.options
  }

  getService () {
    return this.service
  }

  getMeta () {
    return this.metadata
  }
}

module.exports = Service
