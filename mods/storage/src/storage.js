/**
 * @author Pedro Sanders
 * @module @yaps/storage
 * @since v1
 */
const fs = require('fs')
const promisifyAll = require('grpc-promise').promisifyAll
const grpc = require('@yaps/core').grpc
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

        console.log(`Connecting with apiserver @ ${super.getOptions().endpoint}`)

        const service = new StorageService
          .StorageClient(super.getOptions().endpoint, credentials)

        //promisifyAll(service, {metadata})

        this.uploadObject = filename => {

            const readStream = fs.createReadStream(filename,
              { highWaterMark: 1 * 1024 })

            const request = new StoragePB.UploadObjectRequest()
            const call = service.uploadObject(request, (error, response) => {});

            readStream.on('data', chunk => {
                console.log('CHUKIFYING: ', chunk)
                const request = new StoragePB.UploadObjectRequest()
                request.setChunks(Buffer.from(chunk))
                call.write(request)
            })
            .on('end', () => call.end())
            .on('error', err => {
                console.error('pinga: ', err)
                call.end()
            })
        }

    }

}

module.exports = Storage
