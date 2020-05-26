/**
 * @classdesc A building block for new TTS engines. You might use this class
 * to create integration with ANY TTS by providing the abstracted functions, and
 * with help of the `tts/utils.`
 */
abstract class AbstractTTS {
  name: string

  /**
   * Constructs a new AbstractTTS object.
   *
   * @param {string} name friendly name for the TTS engine
   * @see module:tts:MaryTTS
   */
  constructor (name: string) {
    this.name = name
  }

  /**
   * Converts a text to audio.
   *
   * @param {string} text - Text to convert to a audio sound
   * @param {Object} options - An object pass to the final implementation with
   * settings for the TTS engine
   * @returns {string} The path to the synthesized audio
   */
  synthesizeSync (text: string, options: any): string {
    const sleep = require('sync').sleep
    let result
    let error

    this.synthesize(text, options)
      .then((r: string) => (result = r))
      .catch((e: string) => (error = e))

    while (result === undefined && error === undefined) sleep(100)

    if (error) throw error

    return result
  }

  /**
   * Converts a text to audio.
   *
   * @param {string} text - Text to convert to a audio sound
   * @param {Object} options - An object pass to the final implementation with
   * settings for the TTS engine
   * @returns {string} The path to the synthesized audio
   */
  abstract synthesize (text: string, options?: any): Promise<string>

  /**
   * Gets the name of the TTS engine
   */
  getName (): string {
    return this.name
  }
}

export default AbstractTTS
