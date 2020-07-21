/**
 * @author Pedro Sanders
 * @since v1
 */
const GoogleTTS = require('@fonos/googletts').default

module.exports = chan => {
  // Overwrite TTS engine
  const conf = chan._config
  conf.tts = new GoogleTTS()
  chan.config(conf)
  chan.say('Hello from google text to speech')
}
