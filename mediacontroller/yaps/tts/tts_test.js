/**
 * @author Pedro Sanders
 * @since v1
 *
 * Unit Test for the "Abstract TTs Object"
 */

const assert = require('assert')
const AbstractTTS = require('./abstract_tts')
const {
    computeFilename,
    transcodeSync
} = require('./utils')

describe('TTS Utils', () => {

    it('Test compute filename', done => {
        const t = computeFilename('Hello World', {
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
    it('Test convert audio', done => {
        transcodeSync(__dirname + '/../etc/test.wav')
        done()
    })

})
