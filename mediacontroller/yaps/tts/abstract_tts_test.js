/**
 * @author Pedro Sanders
 * @since v1
 *
 * Unit Test for the "Abstract TTs Object"
 */
const assert = require('assert')
const AbstractTTs = require('./abstract_tts')

describe('Abstract TTS tests', () => {

    it('Test generate filename', done => {
        const tts = new AbstractTTs('abstract')
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

})
