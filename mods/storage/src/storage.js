const fs = require('fs')
const path = require('path')
const { grpc } = require('@fonos/core')
const { logger } = require('@fonos/core')
const { storageValidator } = require('@fonos/core').validators
const { FonosService, StorageService, StoragePB } = require('@fonos/core')
const { getClientCredentials } = require('@fonos/core').trust_util

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
  constructor (options) {
    super(StorageService.StorageClient, options).init()
  }

  /**
   * Upload an object to Fonos Object Storage subsystem.
   *
   * @param {Object} request - Object with information about the origin and
   * destination of an object
   * @param {string} request.filename - Path to the object to be uploaded
   * @param {string} request.bucket - Directory at the Storage system to
   * save your file.
   * @throws if the path does not exist or if is a directory
   * @throws if the bucket does not exist
   * @example
   *
   * const request = {
   *    filename: '/path/to/file',
   *    bucklet: 'hello-monkeys'
   * }
   *
   * storage.uploadObject(request)
   * .then(() => {
   *   console.log(result)            // returns and empty Object
   * }).catch(e => console.error(e))  // an error occurred
   */
  async uploadObject (request) {
    return new Promise((resolve, reject) => {
      logger.log(
        'verbose',
        `@fonos/storage uploadObject [request -> ${JSON.stringify(request)}]`
      )

      // WARNING: I'm not happy with this. Seems inconsistent with the other
      // errors...
      // WARNING: There seems to be a bug with the validate method.
      // If I pass request.metadata it will overwrite the object
      // and make == {}
      const meta = request.metadata
      const errors = storageValidator.uploadObjectRequest.validate({
        name: request.filename,
        bucket: request.bucket
        // metadata: request.metadata
      })

      if (errors.length > 0) {
        logger.log('warn', `@fonos/storage uploadObject [invalid argument/s]`)
        reject(new Error(errors[0].message))
        return
      }

      if (fs.lstatSync(request.filename).isDirectory()) {
        logger.log(
          'warn',
          `@fonos/storage uploadObject [uploading directory is not supported]`
        )
        reject(new Error('Uploading a directory is not supported'))
        return
      }

      const objectName = path.basename(request.filename)
      const readStream = fs.createReadStream(request.filename, {
        highWaterMark: 1 * 1024
      })

      const call = super
        .getService()
        .uploadObject(super.getMeta(), (err, res) => {
          if (err) {
            reject(err)
          } else {
            resolve(res)
          }
        })

      logger.log(
        'debug',
        `@fonos/storage uploadObject [objectName -> ${objectName}]`
      )

      readStream
        .on('data', chunk => {
          const uor = new StoragePB.UploadObjectRequest()
          uor.setChunks(Buffer.from(chunk))
          uor.setName(objectName)
          uor.setBucket(request.bucket)

          if (request.metadata && Object.keys(request.metadata).length > 0) {
            const keys = Object.keys(request.metadata)
            keys.forEach(k => uor.getMetadataMap().set(k, request.metadata[k]))
          }
          call.write(uor)
        })
        .on('end', () => {
          logger.log(
            'debug',
            `@fonos/storage upload complete [filename -> ${request.filename}]`
          )
          call.end()
        })
        .on('error', err => {
          logger.log('error', err)
          call.end()
        })
    }).catch(e => {
      throw e
    })
  }

  /**
   * Get Object URL.
   *
   * @param {Object} request - Object with information about the location and
   * and name of the requested object
   * @param {string} request.name - The name of the object
   * @param {string} request.bucket - Bucket where object is located
   * save your file.
   * @return {string} localy accessible URL to the object
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
   *   console.log(result)            // returns a localy accesible URL
   * }).catch(e => console.error(e))  // an error occurred
   */
  async getObjectURL (request) {
    return new Promise((resolve, reject) => {
      logger.log(
        'verbose',
        `@fonos/storage getObjectURL [name: ${request.name}]`
      )
      logger.log(
        'debug',
        `@fonos/storage getObjectURL [bucket: ${request.bucket}]`
      )

      const gour = new StoragePB.GetObjectURLRequest()
      gour.setName(request.name)
      gour.setBucket(request.bucket)

      super.getService().getObjectURL(gour, super.getMeta(), (err, res) => {
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
  uploadObjectSync (request) {
    const sleep = require('sync').sleep
    let result
    let error

    this.uploadObject(request)
      .then(r => (result = r))
      .catch(e => (error = e))

    while (result === undefined && error === undefined) sleep(100)

    if (error) throw error

    return result
  }

  // Internal API
  getObjectURLSync (request) {
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

module.exports.Storage = Storage
