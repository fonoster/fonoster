/**
 * @author Pedro Sanders
 * @since v1
 */
const StoragePB = require('./protos/storage_pb')
const grpc = require('grpc')
const {
    auth
} = require('../common/trust_util')
const {
    extract,
    removeDirSync,
    uploadToFS,
    getFilesizeInBytes
} = require('../common/utils')
const objectid = require('objectid')
const fs = require('fs')
const storageValidator = require('../schemas/storage.schema')
const logger = require('../common/logger')

const uploadObject = (call, callback) => {
    try {
        auth(call)
    } catch(e) {
        logger.log('error', e)
        callback(new Error('UNAUTHENTICATED'), null)
        return
    }

    // I swear I don't like this :(
    const delayVerification = request => {
        logger.log('verbose', `@yaps/core uploadObject [delay verification]`)

        // Validating the request
        const errors = storageValidator.uploadObjectRequest.validate({
            name: request.getName(),
            bucket: request.getBucket()
        })

        if(errors.length > 0) {
            logger.log('warn', `@yaps/core uploadObject [invalid argument]`)
            callback(new Error('INVALID_ARGUMENT'), errors[0].message)
            return
        }
    }

    const tmpName = objectid()
    const writeStream = fs.createWriteStream(`/tmp/${tmpName}`)
    let object
    let bucket
    let ext
    let verified = false

    call.on('data', request => {
        if (!verified) {
            delayVerification(request)
            object = request.getName()
            bucket = request.getBucket()
            verified = true
        }
        const chunk = request.getChunks()
        writeStream.write(Buffer.alloc(chunk.length, chunk))
    })

    call.on('error', err => {
        logger.log('error', err)
    })

    call.on('end', async(chunk)=> {
        try {
            logger.log('verbose', `@yaps/core uploadObject [object ready for upload]`)
            logger.log('verbose', `@yaps/core uploadObject [object -> ${object}]`)
            logger.log('verbose', `@yaps/core uploadObject [bucket -> ${bucket}]`)

            // Back to what it is supposed to be
            fs.renameSync(`/tmp/${tmpName}`, `/tmp/${object}`)

            const fileSize = getFilesizeInBytes(`/tmp/${object}`)
            logger.log('debug', `@yaps/core uploadObject [file size -> ${fileSize}]`)

            // Unzip file if needed
            if(object.endsWith('.zip')
                || object.endsWith('.tar')
                || object.endsWith('.tgz')
                || object.endsWith('.tar.gz')) {

                logger.log('verbose', `@yaps/core uploadObject [extracting files -> /tmp/${object}]`)
                await extract(`/tmp/${object}`, `/tmp`)

                const nameWithoutExt = object.split('.')[0]
                // Upload to fs
                await uploadToFS(bucket, `/tmp/${nameWithoutExt}`)

                // Removing extracted dir
                removeDirSync(`/tmp/${nameWithoutExt}`, { recursive: true })

                const response  = new StoragePB.UploadObjectResponse()
                response.setSize(fileSize)
                callback(null, response)
            } else {
                // Upload to fs
                await uploadToFS(bucket, `/tmp/${object}`, object)
                const response  = new StoragePB.UploadObjectResponse()
                response.setSize(fileSize)
                callback(null, response)
            }

            // Remove temporal file
            logger.log('verbose', `@yaps/core uploadObject [removing tmpfile -> /tmp/${object}}]`)
            fs.unlinkSync(`/tmp/${object}`)
        } catch(err) {
            if (err.code === 'NoSuchBucket') {
                callback({
                    message: `${err.message} -> bucket: ${bucket}`,
                    status: grpc.status.FAILED_PRECONDITION
                })
            } else {
                console.log(err)
                callback(new Error('UNKNOWN'), err)
            }
        }
    })
}

module.exports.uploadObject = uploadObject
