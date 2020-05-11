const AbstractTTS = require('./abstract_tts')
const http = require('http')
const fs = require('fs')
const path = require('path')
const merge = require('deepmerge')
const logger = require('@fonos/core').logger
const { computeFilename, optionsToQueryString } = require('./utils')

/**
 * @classdesc The default TTS engine in a Fonos deployment.
 *
 * @extends AbstractTTS
 * @example
 *
 * const MaryTTS = require('@fonos/tts/marytts')
 * const Storage = require('@fonos/storage')
 * const { transcodeSync } = require('@fonos/tts/utils')

 *
 * // This is all done automatically when using the Say verb.
 * module.exports = chan => {
 *    const storage = new Storage()
 *    const tts = new MaryTTS()
 *    const pathToFile = tts.synthesizeSync('Hello World')
 *    const pathToTranscodedFile = transcodeSync(pathToFile)
 *    const url = storage.uploadFileSync('hello-world.wav', pathToTranscodedFile)
 *    chan.play(url)
 * }
 */
class MaryTTS extends AbstractTTS {
  /**
   * Constructs a new MaryTTS object.
   *
   * @see module:tts:AbstractTTS
   */
  constructor (options) {
    super('mary-tts')

    const defaultConfig = {
      host: process.env.TTS_ENGINE_HOST || 'localhost',
      port: process.env.TTS_ENGINE_PORT || 59125,
      locale: 'EN_US'
    }

    const opts = merge(defaultConfig, options || {})

    if (!opts.host) throw new Error('host field is required')
    if (!opts.port) throw new Error('port field is required')

    const q = `INPUT_TYPE=TEXT&AUDIO=WAVE_FILE&OUTPUT_TYPE=AUDIO&LOCALE=${
      opts.locale
    }`
    this.serviceUrl = `http://${opts.host}:${opts.port}/process?${q}`

    logger.log(
      'debug',
      `@fonos/tts.MaryTTS.constructor [initializing with config: ${JSON.stringify(
        opts
      )}]`
    )
    logger.log(
      'verbose',
      `@fonos/tts.MaryTTS.constructor [serviceUrl: ${this.serviceUrl}]`
    )
  }

  /**
   * @inherit
   */
  synthesize (text, options) {
    options = options || {}

    logger.log(
      'debug',
      `@fonos/tts.MaryTTS.synthesize [text: ${text}, options: ${JSON.stringify(
        options
      )}]`
    )

    const tmpDirFromEnv = process.env.MC_TTS_TEMP_DIR
    const tmpDir = tmpDirFromEnv ? tmpDirFromEnv : __dirname
    const pathToFile = path.join(tmpDir, computeFilename(text, options))
    let complete
    const file = fs.createWriteStream(pathToFile)
    const query = optionsToQueryString(options)

    logger.log(
      'debug',
      `@fonos/tts.MaryTTS.synthesize [pathToFile: ${pathToFile}]`
    )
    logger.log('debug', `@fonos/tts.MaryTTS.synthesize [query: ${query}]`)

    return new Promise((resolve, reject) => {
      http.get(
        `${this.serviceUrl}&INPUT_TEXT=${encodeURI(text)}&${query}`,
        response => {
          const { statusCode } = response
          if (statusCode !== 200) {
            reject(`Request failed status code: ${statusCode}`)
          }
          response.pipe(file)

          logger.log('debug', `@fonos/tts.MaryTTS.synthesize [finished]`)
          resolve(pathToFile)
        }
      )
    })
  }
}

module.exports = MaryTTS
