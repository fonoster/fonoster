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

class Storage extends AbstractService {

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

        //promisifyAll(service, {metadata})

        this.uploadObject = request => new Promise((resolve, reject) => {
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

            // Upload request
            const uor = new StoragePB.UploadObjectRequest()
            uor.setName(objectName)
            uor.setBucket(request.bucket)

            const call = service.uploadObject(uor, (err, res) => {
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
