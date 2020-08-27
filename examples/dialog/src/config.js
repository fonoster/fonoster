const GoogleTTS = require('@fonos/googletts').default
const GoogleASR = require('@fonos/googleasr').default
const Talk = require('./talk')
const { join } = require('path')
const PROJECT_ID = 'clever-tube-275321'

// You need to have a set of Google credentials for this to work
function getCredentials() {
  return {
    PROJECT_ID,
    keyFilename: join(__dirname, `../google_credentials.json`)
  }
}

const talk = new Talk(PROJECT_ID, getCredentials())
const asr = new GoogleASR(getCredentials())
const tts = new GoogleTTS(getCredentials())

function listen(chan, asr) {
  const result = chan.record({ silenceSeconds: 1, beep: false })
  return asr.transcribeSync(result.recordingUri)
}

module.exports = { talk, listen, asr, tts}
