const expect = require('chai').expect
const path = require('path')
const {
  computeFilename,
  transcode,
  optionsToQueryString
} = require('../src/utils')

if (process.env.NODE_ENV === 'dev') {
  require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') })
}

describe('@yaps/tts/utils', () => {
  it('converts a json object into a query string', () => {
    const options = {
      voice: 'peter',
      language: 'spanish'
    }
    const q = optionsToQueryString(options)
    expect(q).to.be.equal('voice=peter&language=spanish')
  })

  it('will compute the filename base on given parameters', () => {
    const t = computeFilename('Hello World', {
      voice: 'Anna',
      speed: 0.1,
      language: 'en',
      cachingFields: ['voice', 'speed']
    })
    expect(t).to.be.equal('940c2687367636c07be34668c6d8299f.wav')
  })
})
