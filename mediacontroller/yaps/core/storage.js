/**
 * @author Pedro Sanders
 * @since v1
 */
const Minio = require('minio')
const sleep = require('syncho').sleep

class Storage {

    // I have config here for testing
    constructor(config) {
        const configFromEnv = {
            endPoint: process.env.FS_HOST,
            port: parseInt(process.env.FS_PORT),
            useSSL: false,
            accessKey: process.env.FS_USERNAME,
            secretKey: process.env.FS_SECRET
        }

        this.fsConn = config? new Minio.Client(config) :
            new Minio.Client(configFromEnv)
    }

    // Get this out of here...
    uploadFileSync(filename, filePath, metadata = {}) {
        let result

        this.fsConn.fPutObject('default', filename, filePath, metadata,
          (err, etag) => result = err ? err : etag )

        while(result === undefined) sleep(100)

        return result
    }

    // Get this out of here...
    getFileURLSync(filename) {
        let exist
        this.fsConn.statObject('default', filename, (e, dataStream) => {
            exist = e ? false : true
        })

        while(exist === undefined) sleep(100)

        if (!exist) return void(0)

        // It exist, so lets get the URL
        /*let url
        this.fsConn.presignedGetObject('default', filename, 1000, function(e, presignedUrl) {
            if (e) throw e
            url = presignedUrl
        })*/

        //while(url === undefined) sleep(100)

        const url = `http://${process.env.FS_HOST}:${process.env.FS_PORT}/${process.env.FS_DEFAULT_BUCKET}/${filename}`

        return url
    }

}

module.exports = Storage
