import logger from '@fonos/logger'
import { FonosService, StorageService, StoragePB } from '@fonos/core'

/**
 * @classdesc Use Fonos Storage, a capability of Fonos Object Storage subsystem,
 * to upload, download, and delete objects.
 *
 * @extends FonosService
 * @example
 *
 * const Fonos = require('@fonos/sdk')
 * const storage = new Fonos.Storage()
 *
 * storage.uploadObject()
 * .then(result => {
 *    console.log(result)            // successful response
 * }).catch(e => console.error(e))   // an error occurred
 */
class Storage extends FonosService {
  /**
   * Constructs a new Storage object.
   *
   * @see module:core:FonosService
   */
  constructor (options: any) {
    super(StorageService.StorageClient, options)
    super.init()
  }

  /**
   * Get Object URL.
   *
   * @param {Object} request - Object with information about the location and
   * and name of the requested object
   * @param {string} request.name - The name of the object
   * @param {string} request.bucket - Bucket where object is located
   * save your file.
   * @return {Promise<string>} localy accessible URL to the object
   * @throws if bucket or object does not exist
   * @example
   *
   * const request = {
   *    name: 'object-name',
   *    bucket: 'bucket-name'
   * }
   *
   * storage.getObjectURL(request)
   * .then(result => {
   *   console.log(result)
   * }).catch(e => console.error(e))  // an error occurred
   */
  async getObjectURL (request: { name: string; bucket: string }): Promise<any> {
    return new Promise((resolve, reject) => {
      logger.log(
        'verbose',
        `@fonos/storage getObjectURL [name: ${request.name} bucket: ${request.bucket}]`
      )

      const gour = new StoragePB.GetObjectURLRequest()
      gour.setName(request.name)
      gour.setBucket(request.bucket)

      super
        .getService()
        .getObjectURL(gour, super.getMeta(), (err: any, res: any) => {
          if (err) {
            logger.log('error', err)
            reject(err)
          } else {
            logger.log('debug', `@fonos/storage getObjectURL [url: ${res}]`)
            resolve(res.getUrl())
          }
        })
    }).catch(e => {
      throw e
    })
  }

  // Internal API
  getObjectURLSync (request: { name: string; bucket: string }) {
    const sleep = require('sync').sleep
    let result
    let error
    this.getObjectURL(request)
      .then(r => (result = r))
      .catch(e => (error = e))

    while (result === undefined && error === undefined) sleep(100)

    if (error) throw error

    return result
  }
}

export default Storage
