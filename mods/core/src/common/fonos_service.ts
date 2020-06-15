import logger from '@fonos/logger'
import { getClientCredentials } from '../common/trust_util'
import * as fs from 'fs'
import * as path from 'path'
import grpc from './grpc_hack'

// The ESM entry point was dropped due to a Webpack bug (https://github.com/webpack/webpack/issues/6584).
const merge = require('deepmerge')
const ACCEES_FILE =
  process.env.API_ACCESS_FILE ||
  path.join(require('os').homedir(), '.fonos', 'access')
const getAccessFile = () =>
  fs
    .readFileSync(ACCEES_FILE)
    .toString()
    .trim()

const defaultOptions = {
  endpoint: 'localhost:50052',
  bucket: 'default'
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
  constructor (ServiceClient?: any, options: any = {}) {
    this.ServiceClient = ServiceClient
    this.options = merge(defaultOptions, options)

    try {
      this.options = merge(this.options, JSON.parse(getAccessFile()))
    } catch (err) {
      throw new Error(`Malformed access file found at: ${ACCEES_FILE}`)
    }

    this.overwriteOptionsWithEnv(options)

    if (!this.options.accessKeyId || !this.options.accessKeySecret) {
      throw new Error('Not valid credentials found')
    }

    this.metadata = new grpc.Metadata()
    this.metadata.add('access_key_id', this.options.accessKeyId)
    this.metadata.add('access_key_secret', this.options.accessKeySecret)
  }

  init (): void {
    this.service = new this.ServiceClient(
      this.options.endpoint,
      getClientCredentials()
    )
  }

  overwriteOptionsWithEnv (options: any) {
    if (process.env.FONOS_ENDPOINT)
      this.options.endpoint = process.env.FONOS_ENDPOINT
    if (process.env.FONOS_ACCESS_KEY_ID)
      this.options.accessKeyId = process.env.FONOS_ACCESS_KEY_ID
    if (process.env.FONOS_ACCESS_KEY_SECRET)
      this.options.accessKeySecret = process.env.FONOS_ACCESS_KEY_SECRET
    this.options = merge(this.options, options)
  }

  getOptions (): any {
    return this.options
  }

  getService (): any {
    return this.service
  }

  getMeta (): any {
    return this.metadata
  }
}

export { Service as default }
