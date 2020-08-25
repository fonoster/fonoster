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
  const result = chan.record({ silenceSeconds: 1.5, beep: false })
  return asr.transcribeSync(result.recordingUri)
}

module.exports = chan => {
  // Setting up Google TTS
  chan.overrideTTS(tts)
  chan.say(`Hi! What reminder do you want to schedule?`)

  // We keep a loop until we see the 'session.close' intent
  while(true) {
    try {
      const result = talk.findIntent.sync(talk, listen(chan, asr))
      chan.say(result.fulfillmentText)

      // Add here your action handler
      if (result.action === 'session.close') break

      if (result.action.startsWith('reminders.') &&
        result.allRequiredParamsPresent) {
        chan.say('Anything else I can help with?')
      }
    } catch(e) {
      // There was no input
      chan.say(`Sorry, I didn't quite get that. Can you say again?`)
    }
  }
}
