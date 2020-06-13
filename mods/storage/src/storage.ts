import fs from 'fs'
import path from 'path'
import { FonosService, StorageService, StoragePB } from '@fonos/core'
import { UploadObjectResponse } from '@fonos/core/src/server/protos/storage_pb'

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
  async uploadObject (request: any): Promise<any> {
    return new Promise((resolve, reject) => {
      // WARNING: I'm not happy with this. Seems inconsistent with the other
      // errors...
      // WARNING: There seems to be a bug with the validate method.
      // If I pass request.metadata it will overwrite the object
      // and make == {}
      /*const meta = request.metadata
      const errors = storageValidator.uploadObjectRequest.validate({
        name: request.filename,
        bucket: request.bucket
        // metadata: request.metadata
      })*/

      /*if (errors.length > 0) {
        logger.log('warn', `@fonos/storage uploadObject [invalid argument/s]`)
        reject(new Error(errors[0].message))
        return
      }*/

      if (fs.lstatSync(request.filename).isDirectory()) {
        reject('Uploading a directory is not supported')
        return
      }

      const objectName = path.basename(request.filename)
      const readStream = fs.createReadStream(request.filename, {
        highWaterMark: 1 * 1024
      })

      const call = super
        .getService()
        .uploadObject(super.getMeta(), (err: any, res: any) => {
          if (err) {
            reject(err)
          } else {
            resolve(res as UploadObjectResponse)
          }
        })

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
        .on('end', () => call.end())
        .on('error', (err: any) => {
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
      const gour = new StoragePB.GetObjectURLRequest()
      gour.setName(request.name)
      gour.setBucket(request.bucket)

      super
        .getService()
        .getObjectURL(gour, super.getMeta(), (err: any, res: any) => {
          if (err) {
            reject(err)
          } else {
            resolve(res.getUrl())
          }
        })
    }).catch(e => {
      throw e
    })
  }

  // Internal API
  uploadObjectSync (request: any) {
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
