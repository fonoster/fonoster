/**
 * @author Pedro Sanders
 * @since v1
 */
const Minio = require('minio')
const sleep = require('syncho').sleep

class Storage {

    constructor(storageBucket) {
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
        let result

        this.fsConn.fPutObject(this.storageBucket, filename,
            filePath, metadata, (err, etag) => result = err ? err : etag )

        while(result === undefined) sleep(100)

        return this.getFileURLSync(filename)
    }

    getFileURLSync(filename) {
        let exist
        this.fsConn.statObject(this.storageBucket,
            filename, (e, dataStream) => {
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

        //while(url === undefined) sleep(1200)

        const url = `http://${process.env.FS_HOST}:${process.env.FS_PORT}/${this.storageBucket}/${filename}`

        return url
    }

}

module.exports = Storage
