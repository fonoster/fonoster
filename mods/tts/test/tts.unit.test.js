const AbstractTTS = require('../src/abstract_tts')
const MaryTTS = require('../src/mary_tts')
const assert = require('assert')
const path = require('path')
const {
  computeFilename,
  transcode,
  optionsToQueryString
} = require('../src/utils')

if (process.env.NODE_ENV === 'dev') {
  require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') })
}

describe('TTS Utils', () => {
  it('Test compute filename', done => {
    const t = computeFilename('Hello World', {
      voice: 'Anna',
      speed: 0.1,
      language: 'en',
      cachingFields: ['voice', 'speed']
    })
    assert.equal('940c2687367636c07be34668c6d8299f.wav', t)
    done()
  })

  // Needs an running instace of minio
  it('Test options to query', done => {
    const options = {
      voice: 'peter',
      language: 'spanish'
    }
    const q = optionsToQueryString(options)
    assert.equal('voice=peter&language=spanish', q)
    done()
  })

  // Needs an running instace of minio
  it('Test convert audio', done => {
    transcode(
      __dirname + '/../etc/test.wav',
      __dirname + '/../etc/test_transcoded.wav'
    )
      .then(r => done())
      .catch(e => done(e))
  })

  it('Test marytts plus transcode', done => {
    const tts = new MaryTTS()
    tts
      .synthesize('hey this is a test')
      .then(r => done())
      .catch(e => done(e))
  })
})
