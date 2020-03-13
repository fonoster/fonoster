/**
 * @author Pedro Sanders
 * @since v1
 */
const Minio = require('minio')
const StoragePB = require('./protos/storage_pb')
const {
    auth
} = require('../common/trust_util')
const {
    extract,
    removeDirSync
} = require('../common/trust_util')
const objectid = require('objectid')
const path = require('path')
const fs = require('fs')
const inly = require('inly')
const walk = require('walk')
const storageValidator = require('../schemas/storage.schema')
const redis = require('./redis')
const logger = require('../common/logger')

const fsInstance = () => new Minio.Client({
    endPoint: process.env.FS_HOST,
    port: parseInt(process.env.FS_PORT),
    useSSL: false,
    accessKey: process.env.FS_USERNAME,
    secretKey: process.env.FS_SECRET
})

const uploadToFS = (bucket, pathToObject, object) => new Promise((resolve, reject) => {
    logger.log('verbose', `@yaps/core uploadToFS [bucket -> ${bucket}]`)
    logger.log('verbose', `@yaps/core uploadToFS [path -> ${pathToObject}]`)
    logger.log('verbose', `@yaps/core uploadToFS [object -> ${object}]`)

    const splitPath = p => path.dirname(p).split(path.sep)
    const dirCount = splitPath(pathToObject).length
    const baseDir = splitPath(pathToObject).slice(0, dirCount).join('/')
    const walker = walk.walk(pathToObject)

    logger.log('debug', `@yaps/core uploadToFS [dirCount -> ${dirCount}]`)
    logger.log('debug', `@yaps/core uploadToFS [baseDir -> ${baseDir}]`)

    walker.on('file', (root, stats, next) => {
        const filePath = root + '/' + stats.name
        const destFilePath = root + '/' + (object || stats.name)
        const dest = destFilePath.substring(baseDir.length + 1)

        logger.log('debug', `@yaps/core uploadToFS [root -> ${root}]`)
        logger.log('debug', `@yaps/core uploadToFS [filePath -> ${filePath}]`)
        logger.log('debug', `@yaps/core uploadToFS [destFilePath -> ${destFilePath}]`)
        logger.log('debug', `@yaps/core uploadToFS [dest -> ${dest}]`)

        fsInstance().fPutObject(bucket, dest , filePath, err => {
            if (err) {
                reject(err)
                logger.log('error', err)
            }
            next()
        })
    })

    walker.on('errors', (root, nodeStatsArray, next) => {
        reject(root)
    })

    walker.on('end', () => {
        resolve()
    })
})

const uploadObject = (call, callback) => {

    // I swear I don't like this :(
    const delayVerification = request => {
        logger.log('verbose', `@yaps/core delay verification`)

        /*try {
            auth(call)
        } catch(e) {
            logger.log('error', e)
            callback(new Error('UNAUTHENTICATED'), null)
            return
        }*/

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
        console.log('pinga')
        logger.log('error', err)
    })

    call.on('end', async(chunk) => {
        logger.log('verbose', `@yaps/core uploadObject [object -> ${object}]`)
        logger.log('verbose', `@yaps/core uploadObject [bucket -> ${bucket}]`)

        // Back to what it is supposed to be
        fs.renameSync(`/tmp/${tmpName}`, `/tmp/${object}`)

        // Unzip file if needed
        if(object.endsWith('.zip') || object.endsWith('.tar')
            || object.endsWith('.tar.gz')) {

            logger.log('verbose', `@yaps/core uploadObject [extracting -> /tmp/${object}}]`)
            await extract(`/tmp/${object}`, `/tmp`)

            const nameWithoutExt = object.split('.')[0]
            // Upload to fs
            await uploadToFS(bucket, `/tmp/${nameWithoutExt}`)
            // Removing extracted dir
            removeDirSync(`/tmp/${nameWithoutExt}`, { recursive: true })
        } else {
            // Upload to fs
            await uploadToFS(bucket, `/tmp/${object}`, object)
        }

        // Remove temporal file
        logger.log('verbose', `@yaps/core uploadObject [removing tmpfile -> /tmp/${object}}]`)
        fs.unlinkSync(`/tmp/${object}`)

        const response  = new StoragePB.UploadObjectResponse()
        callback(null, response)
    })
}

module.exports.uploadObject = uploadObject
