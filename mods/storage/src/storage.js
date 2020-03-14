/**
 * @author Pedro Sanders
 * @module @yaps/storage
 * @since v1
 */
const fs = require('fs')
const path = require('path')
const promisifyAll = require('grpc-promise').promisifyAll
const grpc = require('@yaps/core').grpc
const { storageValidator } = require('@yaps/core').validators
const logger = require('@yaps/core').logger
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
     * @property {number} size - Uploaded file size in bytes.
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
         * Creates a new application.
         *
         * @async
         * @function
         * @param {Object} - Object upload request
         * @return {Promise<UploadObjectResponse>} - The application just created
         * @example
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
        this.uploadObject = request => new Promise(async (resolve, reject) => {
            logger.log('verbose', `@yaps/storage uploadObject [request -> ${JSON.stringify(request)}]`)

            // WARNING: I'm not happy with this. Seems inconsistent with the other
            // errors...
            const errors = storageValidator.uploadObjectRequest.validate({
                name: request.filename,
                bucket: request.bucket
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
    }
}

module.exports = Storage
