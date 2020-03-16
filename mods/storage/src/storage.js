/**
 * @author Pedro Sanders
 * @module @yaps/storage
 * @since v1
 */
const fs = require('fs')
const path = require('path')
const { grpc } = require('@yaps/core')
const { logger } = require('@yaps/core')
const { storageValidator } = require('@yaps/core').validators
const {
    AbstractService,
    StorageService,
    StoragePB
} = require('@yaps/core')
const {
    getClientCredentials
} = require('@yaps/core').trust_util

/**
 * @alias module:@yaps/storage.Storage
 * @typicalname storage
 * @classdesc Use YAPS Storage, a capability of YAPS Systems Storage,
 * to create, manage, and deploy an buckets and to upload and download files
 * to your buckets.
 *
 * @extends AbstractService
 * @example
 *
 * ```Basic example```
 *
 * const YAPS = require('@yaps/sdk')
 * const storage = new YAPS.Storage()
 *
 * const request = {
 *    filename: 'path/to/your/file',
 *    bucket: 'bucket-name'
 * }
 *
 * storage.uploadObject(request)
 * .then(result => {
 *    console.log(result)            // successful response
 * }).catch(e => console.error(e))   // an error occurred
 */
class Storage extends AbstractService {

    /**
     * Upload Object Response
     *
     * @typedef {Object} UploadObjectResponse
     * @property {number} size - Size of uploaded file in bytes.
     */

    /**
     * Constructs a service object.
     *
     * @param {Options} options - Overwrite for the service's defaults configuration
     */
    constructor(options) {
        super(options)

        const metadata = new grpc.Metadata()
        metadata.add('access_key_id', super.getOptions().accessKeyId)
        metadata.add('access_key_secret', super.getOptions().accessKeySecret)

        const credentials = grpc.credentials.createInsecure()

        logger.log('verbose', `@yaps/storage connecting with apiserver [endpoint -> ${super.getOptions().endpoint}]`)
        logger.log('debug', `@yaps/storage [access_key_id -> ${super.getOptions().accessKeyId} ]`)
        logger.log('debug', `@yaps/storage [access_key_secret -> ${super.getOptions().accessKeySecret.substring(0, 20)}... ]`)

        const service = new StorageService
            .StorageClient(super.getOptions().endpoint, credentials)

        /**
         * Uploads object to a YAPS bucket.
         *
         * @async
         * @function
         * @param {Object} - Object upload request.
         * @return {Promise<UploadObjectResponse>} - The response.
         * @example
         *
         * const YAPS = require('@yaps/sdk')
         * const storage = new YAPS.Storage()
         *
         * const request = {
         *    filename: 'path/to/your/file',
         *    bucket: 'bucket-name',
         *    metadata: { 'Content-Type': 'audio/x-wav' }
         * }
         *
         * storage.uploadObject(request)
         * .then(result => {
         *    console.log(result)            // successful response
         * }).catch(e => console.error(e))   // an error occurred
         */
        this.uploadObject = request => new Promise((resolve, reject) => {
            logger.log('verbose', `@yaps/storage uploadObject [request -> ${JSON.stringify(request)}]`)

            // WARNING: I'm not happy with this. Seems inconsistent with the other
            // errors...
            // WARNING: There seems to be a bug with the validate method.
            // If I pass request.metadata it will overwrite the object
            // and make == {}
            const meta = request.metadata
            const errors = storageValidator.uploadObjectRequest.validate({
                name: request.filename,
                bucket: request.bucket,
                // metadata: request.metadata
            })

            if(errors.length > 0) {
                logger.log('warn', `@yaps/storage uploadObject [invalid argument/s]`)
                reject(new Error(errors[0].message))
                return
            }

            if(fs.lstatSync(request.filename).isDirectory()) {
                logger.log('warn', `@yaps/storage uploadObject [uploading directory is not supported]`)
                reject(new Error('Uploading a directory is not supported'))
                return
            }

            const objectName = path.basename(request.filename)
            const readStream = fs.createReadStream(request.filename,
                { highWaterMark: 1 * 1024 })

            const call = service.uploadObject(metadata, (err, res) => {
                if (err) {
                    reject(err)
                } else {
                    resolve(res)
                }
            })

            logger.log('debug', `@yaps/storage uploadObject [objectName -> ${objectName}]`)

            readStream.on('data', chunk => {
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
                logger.log('debug', `@yaps/storage upload complete [filename -> ${request.filename}]`)
                call.end()
            })
            .on('error', err => {
                logger.log('error', err)
                call.end()
            })
        }).catch(e => { throw e })

        /**
         * Get the URL for a given object and bucket.
         *
         * @async
         * @function
         * @param {Object} - Request to retrive object.
         * @return {Promise<UploadObjectResponse>} - The response.
         * @example
         *
         * const YAPS = require('@yaps/sdk')
         * const storage = new YAPS.Storage()
         *
         * const request = {
         *    name: 'object-name',
         *    bucket: 'bucket-name'
         * }
         *
         * storage.getObjectURL(request)
         * .then(result => {
         *    console.log(result)            // successful response
         * }).catch(e => console.error(e))   // an error occurred
         */
        this.getObjectURL = request => new Promise((resolve, reject) => {
            logger.log('verbose', `@yaps/storage getObjectURL [name: ${request.name}]`)
            logger.log('debug', `@yaps/storage getObjectURL [bucket: ${request.bucket}]`)

            const gour = new StoragePB.GetObjectURLRequest()
            gour.setName(request.name)
            gour.setBucket(request.bucket)

            service.getObjectURL(gour, metadata, (err, res) => {
                if (err) {
                    logger.log('error', err)
                    reject(err)
                } else {
                    logger.log('debug', `@yaps/storage getObjectURL [url: ${res}]`)
                    resolve(res.getUrl())
                }
            })
        }).catch(e => { throw e })

        /**
         * Upload object synchronously.
         *
         * @private
         * @function
         * @param {Object} - Object upload request
         * @return {Promise<UploadObjectResponse>} - The response
         * @example
         *
         * const YAPS = require('@yaps/sdk')
         * const storage = new YAPS.Storage()
         *
         * const request = {
         *    filename: 'path/to/your/file',
         *    bucket: 'bucket-name',
         *    metadata: { 'Content-Type': 'audio/x-wav' }
         * }
         *
         * const result = storage.uploadObjectSync(request)
         */
        this.uploadObjectSync = request => {
            const sleep = require('syncho').sleep
            let result
            let error

            this.uploadObject(request)
              .then(r => result = r)
                .catch(e => error = e)

            while(result === undefined && error === undefined) sleep(100)

            if (error) throw error

            return result
        }

        /**
         * Get the URL for a given object and bucket synchronously
         *
         * @private
         * @function
         * @param {Object} - Object upload request
         * @return {Promise<UploadObjectResponse>} - The response
         * @example
         *
         * const YAPS = require('@yaps/sdk')
         * const storage = new YAPS.Storage()
         *
         * const request = {
         *    filename: 'path/to/your/file',
         *    bucket: 'bucket-name',
         *    metadata: { 'Content-Type': 'audio/x-wav' }
         * }
         *
         * const result storage.getObjectURLSync(request)
         */
        this.getObjectURLSync = request => {
            const sleep = require('syncho').sleep
            let result
            let error
            this.getObjectURL(request)
            .then(r => result = r)
            .catch(e => error = e)

            while(result === undefined && error === undefined) sleep(100)

            if (error) throw error

            return result
        }

    }
}

module.exports.Storage = Storage
