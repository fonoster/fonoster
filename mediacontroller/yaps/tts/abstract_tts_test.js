/**
 * @author Pedro Sanders
 * @since v1
 *
 * Unit Test for the "Abstract TTs Object"
 */

const assert = require('assert')
const AbstractTTS = require('./abstract_tts')
const MockTTS = require('./mock_tts')
const fsConfig = {
    endPoint: '127.0.0.1',
    port: 9001,
    useSSL: false,
    accessKey: 'minio',
    secretKey: 'minio123'
}

describe('Abstract TTS tests', () => {

    it('Test generate filename', done => {
        const tts = new AbstractTTS('abstract', fsConfig)
        const t = tts.computeFilename('Hello World', {
            voice: 'Anna',
            speed: 0.1,
            language: 'en',
            cachingFields: [
                'voice',
                'speed'
            ]
        })
        assert.equal('940c2687367636c07be34668c6d8299f', t)
        done()
    })

    // Needs an running instace of minio
    it('Test push to FS', done => {
        const tts = new AbstractTTS('abstract', fsConfig)
        tts.pushFileToFS('package.json', __dirname + '/package.json')
        done()
    })

    // Needs an running instace of minio
    it('Test get URI', done => {
        process.env.MC_TTS_TEMP_FOLDER = __dirname
        process.env.FS_HOST = 'fs'
        process.env.FS_PORT = 9001
        const tts = new AbstractTTS('abstract', fsConfig)
        const result = tts.getFileURL('package.json')
        assert.ok(result.includes('/default/package.json'))
        const result2 = tts.getFileURL('package1.json')
        assert.equal(result2, void(0))
        done()
    })

    // Needs an running instace of minio
    it.skip('Test convert audio', done => {
        const tts = new AbstractTTS('abstract', fsConfig)
        tts.convertToWav(__dirname + '/test.wav')
        done()
    })

    // Needs an running instace of minio
    it('Test MockTTs ', done => {
        process.env.MC_TTS_TEMP_FOLDER = __dirname
        const tts = new MockTTS(fsConfig)
        const url = tts.synthesize('hello world')
        assert.ok(url.includes('/default/'))
        done()
    })

})
