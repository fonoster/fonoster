/**
 * @author Pedro Sanders
 * @since v1
 */
const Minio = require('minio')
const sleep = require('syncho').sleep
const logger = require('../utils/logger')

class Storage {

    constructor(storageBucket) {
        logger.log('debug', `core.Storage [initializing storageBucket: ${storageBucket}]`)
        this.storageBucket = storageBucket
        this.fsConn = new Minio.Client({
            endPoint: process.env.FS_HOST,
            port: parseInt(process.env.FS_PORT),
            useSSL: false,
            accessKey: process.env.FS_USERNAME,
            secretKey: process.env.FS_SECRET
        })
    }

    uploadFileSync(filename, filePath, metadata = {}) {
        logger.log('debug', `core.Storage.uploadFileSync [filename: ${filename}]`)
        logger.log('debug', `core.Storage.uploadFileSync [filePath: ${filePath}]`)
        logger.log('debug', `core.Storage.uploadFileSync [metadata: ${JSON.stringify(metadata)}]`)
        let result

        this.fsConn.fPutObject(this.storageBucket, filename,
            filePath, metadata, (err, etag) => {
                result = err ? err : etag
                if (err) {
                    logger.error(`core.Storage.uploadFileSync [error: ${err}]`)
                }
            })

        while(result === undefined) sleep(100)

        logger.log('debug', `core.Storage.uploadFileSync [fPutObject.result: ${result}]`)

        return this.getFileURLSync(filename)
    }

    getFileURLSync(filename) {
        logger.log('debug', `core.Storage.getFileURLSync [filename: ${filename}]`)
        let exist
        this.fsConn.statObject(this.storageBucket, filename, (e, dataStream) => {
              exist = e ? false : true
              if (e) {
                  logger.log('warn', `core.Storage.getFileURLSync [error: ${e}]`)
              }
        })

        while(exist === undefined) sleep(100)

        logger.log('debug', `core.Storage.getFileURLSync [statObject.exist: ${exist}]`)

        if (!exist) return void(0)

        // It exist, so lets get the URL
        /*let url
        this.fsConn.presignedGetObject('default', filename, 1000, function(e, presignedUrl) {
            if (e) throw e
            url = presignedUrl
        })*/

        //while(url === undefined) sleep(1200)

        const url = `http://${process.env.FS_HOST}:${process.env.FS_PORT}/${this.storageBucket}/${filename}`

        logger.log('debug', `core.Storage.getFileURLSync [url: ${url}]`)

        return url
    }

}

module.exports = Storage
