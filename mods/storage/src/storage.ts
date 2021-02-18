import fs from 'fs'
import path from 'path'
import { FonosService, StorageService, StoragePB } from '@fonos/core'

interface UploadObjectRequest {
  bucket: 'apps' | 'public' | 'recordings'
  filename: string
  metadata?: any
}

interface GetObjectURLRequest {
  bucket: 'apps' | 'public' | 'recordings'
  filename: string
}

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
export default class Storage extends FonosService {
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
   * @param {UploadObjectRequest} request - Object with information about the origin and
   * destination of an object
   * @param {string} request.bucket - Bucket at the Storage system
   * @param {string} request.dir - Directory on the Storage system where your objec will be uploaded
   * @param {string} request.filename - Path to the object to be uploaded
   * @throws if the path does not exist or if is a directory
   * @throws if the directory does not exist
   * @example
   *
   * const request = {
   *    filename: '/path/to/file',
   *    bucket: 'apps',
   *    directory: '/'
   * }
   *
   * storage.uploadObject(request)
   * .then(() => {
   *   console.log(result)            // returns and empty Object
   * }).catch(e => console.error(e))  // an error occurred
   */
  async uploadObject (request: UploadObjectRequest): Promise<any> {
    return new Promise((resolve, reject) => {

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
            resolve({ size: res.getSize()})
          }
        })

      let bucket:StoragePB.GetObjectURLRequest.Bucket
      switch (request.bucket) {
        case 'apps':
          bucket = StoragePB.GetObjectURLRequest.Bucket.APPS;
          break;
        case 'recordings':
          bucket = StoragePB.GetObjectURLRequest.Bucket.RECORDINGS;
          break;
        case 'public':
          bucket = StoragePB.GetObjectURLRequest.Bucket.PUBLIC;
          break;  
      }

      readStream
        .on('data', chunk => {
          const uor = new StoragePB.UploadObjectRequest()
          uor.setChunks(Buffer.from(chunk))
          uor.setFilename(objectName)
          uor.setBucket(bucket)

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
   * @param {GetObjectURLRequest} request - Object with information about the location and
   * and name of the requested object
   * @param {string} request.name - The name of the object
   * save your file.
   * @return {Promise<string>} localy accessible URL to the object
   * @throws if directory or object doesn't exist
   * @example
   *
   * const request = {
   *    filename: 'object-name',
   *    bucket: 'bucket-name'
   * }
   *
   * storage.getObjectURL(request)
   * .then(result => {
   *   console.log(result)
   * }).catch(e => console.error(e))  // an error occurred
   */
  async getObjectURL (request: GetObjectURLRequest): Promise<any> {
    return new Promise((resolve, reject) => {
      let bucket:StoragePB.GetObjectURLRequest.Bucket
      switch (request.bucket) {
        case 'apps':
          bucket = StoragePB.GetObjectURLRequest.Bucket.APPS;
          break;
        case 'recordings':
          bucket = StoragePB.GetObjectURLRequest.Bucket.RECORDINGS;
          break;
        case 'public':
          bucket = StoragePB.GetObjectURLRequest.Bucket.PUBLIC;
          break;  
      }

      const gour = new StoragePB.GetObjectURLRequest()
      gour.setFilename(request.filename)
      gour.setBucket(bucket)

      super
        .getService()
        .getObjectURL(gour, super.getMeta(), (err: any, res: any) => {
          if (err) {
            reject(err as Error)
          } else {
            resolve({
              url: res.getUrl()
            })
          }
        })
    }).catch(e => {
      throw e
    })
  }

  // Internal API
  uploadObjectSync (request: UploadObjectRequest) {
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
  getObjectURLSync (request: GetObjectURLRequest) {
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

