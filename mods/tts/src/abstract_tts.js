/**
 * @classdesc A building block for new TTS engines. You might use this class
 * to create integration with ANY TTS by providing he abstracted functions, and
 * with help of the `tts/utils.`
 */
class AbstractTTS {
  /**
   * Constructs a new AbstractTTS object.
   *
   * @see module:tts:MaryTTS
   */
  constructor (name) {
    this.name = name
  }

  /**
   * Converts a text to audio.
   *
   * @param {string} text - Text to convert to a audio sound
   * @param {Object} options - A an object pass to the final implementation with
   * settings for the TTS engine.
   * @returns {string} - The path to the audio synthesized from the text
   */
  synthesizeSync (text, options) {
    const sleep = require('sync').sleep
    let result
    let error

    this.synthesize(text, options)
      .then(r => (result = r))
      .catch(e => (error = e))

    while (result === undefined && error === undefined) sleep(100)

    if (error) throw error

    return result
  }

  /**
   * Gets the name of the final implementating TTS engine
   */
  getEngineName () {
    return this.name
  }
}

module.exports = AbstractTTS
