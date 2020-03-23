/**
 * Another stupid module
 * @module storage
 */

const fs = require('fs')
const path = require('path')
const { grpc } = require('@yaps/core')
const { logger } = require('@yaps/core')
const { storageValidator } = require('@yaps/core').validators
const { AbstractService, StorageService, StoragePB } = require('@yaps/core')
const { getClientCredentials } = require('@yaps/core').trust_util

/**
 * @typicalname storage
 * @alias module:storage
 * @classdesc Use YAPS AppManager, a capability of YAPS Systems Manager,
 * to create, manage, and deploy an application. The AppManager requires of a
 * running YAPS platform.
 *
 * @extends AbstractService
 * @example
 *
 * const YAPS = require('@yaps/sdk')
 * const appmanager = new YAPS.AppManager()
 *
 * appmanager.listApps()
 * .then(result => {
 *    console.log(result)            // successful response
 * }).catch(e => console.error(e))   // an error occurred
 */
class Storage extends AbstractService {
  constructor (options) {
    super(options, StorageService.StorageClient)
  }

  async uploadObject (request) {
    return new Promise((resolve, reject) => {
      logger.log(
        'verbose',
        `@yaps/storage uploadObject [request -> ${JSON.stringify(request)}]`
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
        logger.log('warn', `@yaps/storage uploadObject [invalid argument/s]`)
        reject(new Error(errors[0].message))
        return
      }

      if (fs.lstatSync(request.filename).isDirectory()) {
        logger.log(
          'warn',
          `@yaps/storage uploadObject [uploading directory is not supported]`
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
        `@yaps/storage uploadObject [objectName -> ${objectName}]`
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
            `@yaps/storage upload complete [filename -> ${request.filename}]`
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

  async getObjectURL (request) {
    return new Promise((resolve, reject) => {
      logger.log(
        'verbose',
        `@yaps/storage getObjectURL [name: ${request.name}]`
      )
      logger.log(
        'debug',
        `@yaps/storage getObjectURL [bucket: ${request.bucket}]`
      )

      const gour = new StoragePB.GetObjectURLRequest()
      gour.setName(request.name)
      gour.setBucket(request.bucket)

      super.getService().getObjectURL(gour, super.getMeta(), (err, res) => {
        if (err) {
          logger.log('error', err)
          reject(err)
        } else {
          logger.log('debug', `@yaps/storage getObjectURL [url: ${res}]`)
          resolve(res.getUrl())
        }
      })
    }).catch(e => {
      throw e
    })
  }

  async uploadObjectSync (request) {
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

  async getObjectURLSync (request) {
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
