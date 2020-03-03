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

class MaryTTS extends AbstractTTS {

    constructor(config) {
        super('mary-tts')

        if (!config.host) throw 'host field is required'

        config = config || {}
        const port = config.port || 59125
        const host = config.host
        const locale = config.locale || 'EN_US'
        const options = `INPUT_TYPE=TEXT&AUDIO=WAVE_FILE&OUTPUT_TYPE=AUDIO&LOCALE=${locale}`

        this.serviceUrl = `http://${host}:${port}/process?${options}`
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
        options = options || {}

        const tmpDirFromEnv = process.env.MC_TTS_TEMP_FOLDER
        const tmpDir = tmpDirFromEnv ? tmpDirFromEnv : __dirname
        const pathToFile = tmpDir + '/' + computeFilename(text, options)
        let complete
        const file = fs.createWriteStream(pathToFile)
        const query = optionsToQueryString(options)

        http.get(`${this.serviceUrl}&INPUT_TEXT=${encodeURI(text)}&${query}`,
            response => {
            response.pipe(file)
            complete = true
        })

        while(complete === undefined) sleep(1200)

        return pathToFile
    }
}

module.exports = MaryTTS
