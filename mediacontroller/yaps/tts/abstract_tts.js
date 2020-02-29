/**
 * @author Pedro Sanders
 * @since v1
 */
const Minio = require('minio')
const flat = require('flat')
const crypto = require('crypto')
const deasync = require('deasync')

class AbstractTTS {

    // I have fsConfig here for testing
    constructor(name, fsConfig) {
        this.name = name

        const fsConfigFromEnv = {
            endPoint: process.env.FS_HOST,
            port: parseInt(process.env.FS_PORT),
            useSSL: false,
            accessKey: process.env.FS_USERNAME,
            secretKey: process.env.FS_SECRET
        }

        this.fsConn = fsConfig? new Minio.Client(fsConfig) :
            new Minio.Client(fsConfigFromEnv)
    }

    computeFilename(text, options = {}) {
        let c = text
        if (options.cachingFields) {
            const flatObj = flat(options)
            c = options.cachingFields
                    .map(opt => flatObj[opt])
                    .sort()
                    .join()
        }
        return crypto.createHash('md5')
            .update(`${text},${c}`).digest('hex')
    }

    generateSpeach(text, options, callback) {
        const filename = this.computeFilename(text, options)
        const url = this.getFileURL(filename) // Get from minio

        if (url !== undefined) return url

        try {
            const origFilePath = callback(filename, options)
            const finalFilePath = this.convertToWav(origFilePath)
            this.pushFileToFS(filename, finalFilePath)
            return this.getFileURL(filename)
        } catch(e) {
            console.error(e)
        }
    }

    convertToWav(fileIn) {
        const fileOut = fileIn.replace('.wav', '.sln')
        const sox = require('sox-audio')()

        sox.on('error', (err, stdout, stderr) => {
            console.log('Cannot process audio: ' + err.message);
            console.log('Sox Command Stdout: ', stdout);
            console.log('Sox Command Stderr: ', stderr)
        });

        sox.input(f)
        sox.output(out)
           .outputSampleRate(8000)
           .outputFileType('wav')
        sox.run()
        return fileOut
    }

    pushFileToFS(filename, filePath, metadata = {}) {
        const fPutObjectSync = deasync()
        let result

        this.fsConn.fPutObject('default', filename, filePath, metadata,
          (err, etag) => result = err ? err : etag )

        while(result === undefined) require('deasync').sleep(100)

        return result
    }

    getFileURL(filename) {
        let exist
        this.fsConn.statObject('default', filename, (e, dataStream) => {
            exist = e ? false : true
        })

        while(exist === undefined) require('deasync').sleep(100)

        if (!exist) return void(0)

        // It exist, so lets get the URL
        let url
        this.fsConn.presignedGetObject('default', filename, 1000, function(e, presignedUrl) {
            if (e) throw e
            url = presignedUrl
        })

        while(url === undefined) require('deasync').sleep(100)

        return url
    }

    getEngineName() {
        return this.name
    }
}

module.exports = AbstractTTS
