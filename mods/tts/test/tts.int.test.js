const MaryTTS = require('../src/mary_tts')

if (process.env.NODE_ENV === 'dev') {
  require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') })
}

describe('TTS Utils', () => {
  it('Test marytts plus transcode', done => {
    const tts = new MaryTTS()
    tts
      .synthesize('hey this is a test')
      .then(r => done())
      .catch(e => done(e))
  })

  it('converts a given audio into an audio works on asterisk', async () => {
    return transcode(
      __dirname + '/../etc/test.wav',
      __dirname + '/../etc/test_transcoded.wav'
    )
  })
})
