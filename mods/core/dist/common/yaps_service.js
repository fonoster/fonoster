var grpc = require('./grpc_hack')
var merge = require('deepmerge')
var fs = require('fs')
var path = require('path')
var logger = require('./logger')
var getClientCredentials = require('../common/trust_util').getClientCredentials
var defaultOptions = {
  endpoint: 'localhost:50052',
  bucket: process.env.FS_DEFAULT_STORAGE_BUCKET || 'default'
}
var Service = /** @class */ (function () {
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
  function Service (ServiceClient, options) {
    if (options === void 0) {
      options = {}
    }
    this.ServiceClient = ServiceClient
    this.options = merge(defaultOptions, options)
    var accessFile =
      process.env.YAPS_ACCESS_FILE ||
      path.join(require('os').homedir(), '.yaps', 'access')
    try {
      var fileContent = fs
        .readFileSync(accessFile)
        .toString()
        .trim()
      var inFileOptions = JSON.parse(fileContent)
      this.options = merge(this.options, inFileOptions)
    } catch (err) {
      throw new Error('Malformed access file found at: ' + accessFile)
    }
    if (process.env.YAPS_ENDPOINT)
      this.options.endpoint = process.env.YAPS_ENDPOINT
    if (process.env.YAPS_ACCESS_KEY_ID)
      this.options.accessKeyId = process.env.YAPS_ACCESS_KEY_ID
    if (process.env.YAPS_ACCESS_KEY_SECRET)
      this.options.accessKeySecret = process.env.YAPS_ACCESS_KEY_SECRET
    this.options = merge(this.options, options)
    logger.log(
      'debug',
      '@yaps/core.Service constructor [merged options -> ' +
        JSON.stringify(this.options) +
        ']'
    )
    if (!this.options.accessKeyId || !this.options.accessKeySecret) {
      throw new Error('Not valid credentials found')
    }
    var metadata = new grpc.Metadata()
    metadata.add('access_key_id', this.options.accessKeyId)
    metadata.add('access_key_secret', this.options.accessKeySecret)
    this.metadata = metadata
  }
  Service.prototype.init = function (endpoint, credentials) {
    this.service = new this.ServiceClient(
      this.options.endpoint,
      getClientCredentials()
    )
  }
  Service.prototype.getOptions = function () {
    return this.options
  }
  Service.prototype.getService = function () {
    return this.service
  }
  Service.prototype.getMeta = function () {
    return this.metadata
  }
  return Service
})()
module.exports = Service
//# sourceMappingURL=yaps_service.js.map
