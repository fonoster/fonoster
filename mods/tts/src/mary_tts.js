/**
 * @author Pedro Sanders
 * @since v1
 */
const AbstractTTS = require('./abstract_tts')
const http = require('http')
const fs = require('fs')
const merge = require('deepmerge')
const logger = require('@yaps/core').logger
const {
    computeFilename,
    optionsToQueryString
} = require('./utils')

class MaryTTS extends AbstractTTS {

    constructor(options) {
        super('mary-tts')

        const defaultConfig = {
           host: (process.env.TTS_ENGINE_HOST || 'localhost'),
           port: (process.env.TTS_ENGINE_PORT || 59125),
           locale: 'EN_US'
        }

        const opts = merge(defaultConfig, options || {})

        if (!opts.host) throw 'host field is required'
        if (!opts.port) throw 'port field is required'

        const q = `INPUT_TYPE=TEXT&AUDIO=WAVE_FILE&OUTPUT_TYPE=AUDIO&LOCALE=${opts.locale}`
        this.serviceUrl = `http://${opts.host}:${opts.port}/process?${q}`

        logger.log('debug', `@yaps/tts.MaryTTS.constructor [initializing with config: ${JSON.stringify(opts)}]`)
        logger.log('verbose', `@yaps/tts.MaryTTS.constructor [serviceUrl: ${this.serviceUrl}]`)
    }

    /**
     * Use options to change the voice and other basic parameters.
     *
     * options {
     *    voice: peter
     *    locale: language
     * }
     */
    synthesize(text, options) {
        options = options || {}

        logger.log('debug', `@yaps/tts.MaryTTS.synthesize [text: ${text}, options: ${JSON.stringify(options)}]`)

        const tmpDirFromEnv = process.env.MC_TTS_TEMP_FOLDER
        const tmpDir = tmpDirFromEnv ? tmpDirFromEnv : __dirname
        const pathToFile = tmpDir + '/' + computeFilename(text, options)
        let complete
        const file = fs.createWriteStream(pathToFile)
        const query = optionsToQueryString(options)

        logger.log('debug', `@yaps/tts.MaryTTS.synthesize [pathToFile: ${pathToFile}]`)
        logger.log('debug', `@yaps/tts.MaryTTS.synthesize [query: ${query}]`)

        return new Promise((resolve, reject) => {
            http.get(`${this.serviceUrl}&INPUT_TEXT=${encodeURI(text)}&${query}`,
                response => {
                const { statusCode } = response
                if (statusCode !== 200) {
                   reject(`Request failed status code: ${statusCode}`)
                }
                response.pipe(file)

                logger.log('debug', `@yaps/tts.MaryTTS.synthesize [finished]`)
                resolve(pathToFile)
            })
        })
    }
}

module.exports = MaryTTS
