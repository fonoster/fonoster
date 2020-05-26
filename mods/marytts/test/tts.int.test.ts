import MaryTTS from '../src/mary_tts'
import { join } from 'path'

if (process.env.NODE_ENV === 'dev') {
  require('dotenv').config({ path: join(__dirname, '..', '..', '.env') })
}

describe('TTS Utils', () => {
  it('Test marytts plus transcode', done => {
    const tts = new MaryTTS()
    tts
      .synthesize('hey this is a test')
      .then((r: string) => done())
      .catch((e: any) => done(e))
  })
})
