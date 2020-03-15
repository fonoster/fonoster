/**
 * @author Pedro Sanders
 * @since v1
 *
 * Unit Test for the "Internal Storage"
 */
const Storage = require('../src/storage')
const assert = require('assert')

// Needs an running instace of minio
describe('Internal Storage', () => {

    before (() => {
        process.env.MC_TTS_TEMP_FOLDER = __dirname
        process.env.FS_HOST = '127.0.0.1'
        process.env.FS_PORT = 9000
        process.env.FS_USERNAME = 'minio'
        process.env.FS_SECRET = 'minio123'
        process.env.FS_DEFAULT_STORAGE_BUCKET = 'default'
    })

    it('Test upload', done => {
        const storage = new Storage(process.env.FS_DEFAULT_STORAGE_BUCKET)
        storage.uploadFileSync('test.wav', __dirname + '/../etc/test.wav')
        done()
    })

    it('Test get URI', done => {
        const storage = new Storage(process.env.FS_DEFAULT_STORAGE_BUCKET)
        const result = storage.getFileURLSync('test.wav')
        assert.ok(result.includes('/default/test.wav'))
        const result2 = storage.getFileURLSync('package1.json')
        assert.equal(result2, void(0))
        done()
    })

})
