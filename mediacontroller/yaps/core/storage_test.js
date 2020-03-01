/**
 * @author Pedro Sanders
 * @since v1
 *
 * Unit Test for the "Internal Storage"
 */
const assert = require('assert')
const Storage = require('./storage')
const storageConfig = {
    endPoint: '127.0.0.1',
    port: 9000,
    useSSL: false,
    accessKey: 'minio',
    secretKey: 'minio123'
}

// Needs an running instace of minio
describe('Internal Storage', () => {

    it('Test upload', done => {
        const storage = new Storage(storageConfig)
        storage.uploadFileSync('package.json', __dirname + '/package.json')
        done()
    })

    it('Test get URI', done => {
        process.env.MC_TTS_TEMP_FOLDER = __dirname
        process.env.FS_HOST = 'fs'
        process.env.FS_PORT = 9001
        const storage = new Storage(storageConfig)
        const result = storage.getFileURLSync('package.json')
        assert.ok(result.includes('/default/package.json'))
        const result2 = storage.getFileURLSync('package1.json')
        assert.equal(result2, void(0))
        done()
    })

})
