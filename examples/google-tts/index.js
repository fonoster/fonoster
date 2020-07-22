/**
 * @author Pedro Sanders
 * @since v1
 */
const GoogleTTS = require('@fonos/googletts').default
const path = require('path')
const googleCredentials = {
  projectId: 'clever-tube-275321',
  keyFilename: path.join(__dirname, 'google_credentials.json')
}

module.exports = chan => {
  // Overwrite TTS engine
  const conf = chan._config
  conf.tts = new GoogleTTS(googleCredentials)
  chan.config(conf)
  chan.say('Hello from google text to speech')
}
