const StoragePB = require('./protos/storage_pb')
const grpc = require('grpc')
const objectid = require('objectid')
const fs = require('fs')
const storageValidator = require('../schemas/storage.schema')
const logger = require('../common/logger')
const {
    auth
} = require('../common/trust_util')
const {
    extract,
    removeDirSync,
    uploadToFS,
    getFilesizeInBytes,
    mapToObj,
    fsInstance
} = require('../common/utils')

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
    let metadata
    let verified = false

    call.on('data', request => {
        if (!verified) {
            delayVerification(request)
            object = request.getName()
            bucket = request.getBucket()
            metadata = mapToObj(request.getMetadataMap())
            verified = true
        }
        const chunk = request.getChunks()
        writeStream.write(Buffer.alloc(chunk.length, chunk))
    })

    call.on('error', err => {
        logger.log('error', err)
    })

    call.on('end', () => writeStream.end())

    writeStream.on('finish', async(chunk) => {
        try {
            logger.log('verbose', `@yaps/core uploadObject [object ready for upload]`)
            logger.log('debug', `@yaps/core uploadObject [object: ${object}]`)
            logger.log('debug', `@yaps/core uploadObject [bucket: ${bucket}]`)
            logger.log('debug', `@yaps/core uploadObject [metadata: ${JSON.stringify(metadata)}]`)

            const fileSize = getFilesizeInBytes(`/tmp/${tmpName}`)
            logger.log('debug', `@yaps/core uploadObject [file size -> ${fileSize}]`)

            // Back to what it is supposed to be
            fs.renameSync(`/tmp/${tmpName}`, `/tmp/${object}`)

            // Unzip file if needed
            if(object.endsWith('.zip')
                || object.endsWith('.tar')
                || object.endsWith('.tgz')
                || object.endsWith('.tar.gz')) {

                logger.log('verbose', `@yaps/core uploadObject [extracting files: /tmp/${object}]`)
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
            logger.log('verbose', `@yaps/core uploadObject [removing tmpfile: /tmp/${object}}]`)
            fs.unlinkSync(`/tmp/${object}`)
        } catch(err) {
            if (err.code === 'NoSuchBucket') {
                logger.log('error', `${err.message} -> bucket: ${bucket}`)
                callback({
                    message: `${err.message} -> bucket: ${bucket}`,
                    status: grpc.status.FAILED_PRECONDITION
                })
            } else if(err.code === 'TAR_BAD_ARCHIVE') {
                logger.log('error', err.message)
                callback(new Error('DATA_LOSS'), err)
            } else {
                logger.log('error', err.message)
                callback(new Error('UNKNOWN'), err)
            }
        }
    })
}

const getObjectURL = (call, callback) => {
    try {
        auth(call)
    } catch(e) {
        logger.log('error', e)
        callback(new Error('UNAUTHENTICATED'), null)
        return
    }

    logger.log('debug', `@yaps/core getObjectURL [request: ${call.request.getName()}]`)

    // Validating the request
    const errors = storageValidator.getObjectURLRequest.validate({
        name: call.request.getName(),
        bucket: call.request.getBucket()
    })

    if(errors.length > 0) {
        logger.log('warn', `@yaps/core getObjectURL [invalid argument]`)
        callback(new Error('INVALID_ARGUMENT'), errors[0].message)
        return
    }

    fsInstance().statObject(call.request.getBucket(), call.request.getName(),
        (err, dataStream) => {
        const name = call.request.getName()
        const bucket = call.request.getBucket()
        if (err) {
            callback({
                message: `${err.message}: filename '${name}' in bucket '${bucket}'`,
                status: grpc.status.NOT_FOUND
            })
            return
        }
        const url = `http://${process.env.FS_HOST}:${process.env.FS_PORT}/${bucket}/${name}`
        const response  = new StoragePB.GetObjectURLResponse()
        response.setUrl(url)
        callback(null, response)
    })
}

module.exports.uploadObject = uploadObject
module.exports.getObjectURL = getObjectURL
