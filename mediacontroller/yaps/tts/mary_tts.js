/**
 * @author Pedro Sanders
 * @since v1
 */
const AbstractTTS = require('./abstract_tts')
const http = require('http')
const fs = require('fs')
const sleep = require('syncho').sleep
const {
    computeFilename,
    optionsToQueryString
} = require('./utils')
const logger = require('../utils/logger')

class MaryTTS extends AbstractTTS {

    constructor(config) {
        super('mary-tts')
        logger.info(`tts.MaryTTS [initializing with config: ${JSON.stringify(config)}]`)

        if (!config.host) throw 'host field is required'

        config = config || {}
        const port = config.port || 59125
        const host = config.host
        const locale = config.locale || 'EN_US'
        const options = `INPUT_TYPE=TEXT&AUDIO=WAVE_FILE&OUTPUT_TYPE=AUDIO&LOCALE=${locale}`

        this.serviceUrl = `http://${host}:${port}/process?${options}`

        logger.info(`tts.MaryTTS [serviceUrl: ${serviceUrl}]`)
    }

    /**
     * Use options to change the voice and other basic parameters.
     *
     * options {
     *    voice: peter
     *    locale: language
     * }
     */
    synthesizeSync(text, options) {
        logger.debug(`tts.MaryTTS.synthesizeSync [text: ${text}, options: ${JSON.stringify(options)}]`)
        options = options || {}

        const tmpDirFromEnv = process.env.MC_TTS_TEMP_FOLDER
        const tmpDir = tmpDirFromEnv ? tmpDirFromEnv : __dirname
        const pathToFile = tmpDir + '/' + computeFilename(text, options)
        let complete
        const file = fs.createWriteStream(pathToFile)
        const query = optionsToQueryString(options)

        logger.debug(`tts.MaryTTS.synthesizeSync [pathToFile: ${pathToFile}]`)
        logger.debug(`tts.MaryTTS.synthesizeSync [query: ${query}]`)

        http.get(`${this.serviceUrl}&INPUT_TEXT=${encodeURI(text)}&${query}`,
            response => {
            response.pipe(file)
            complete = true
            logger.debug(`tts.MaryTTS.synthesizeSync [finished]`)
        })

        while(complete === undefined) sleep(1200)

        return pathToFile
    }
}

module.exports = MaryTTS
