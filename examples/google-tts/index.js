/**
 * @author Pedro Sanders
 * @since v1
 */
const GoogleTTS = require('@fonos/googletts')

module.exports = chan => {
  // Overwrite TTS engine
  const conf = chan.getConfig()
  conf.tts = new GoogleTTS()
  chan.config(conf)

  chan.play(url)
}
