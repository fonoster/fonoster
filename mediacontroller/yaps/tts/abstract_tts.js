/**
 * @author Pedro Sanders
 * @since v1
 */
const flat = require('flat')
const crypto = require('crypto')

class AbstractTTS {

    constructor(name) {
        this.name = name
    }

    computeFilename(text, options) {
        let c = text
        if (options.cachingFields) {
            const flatObj = flat(options)
            c = options.cachingFields
                    .map(opt => flatObj[opt])
                    .sort()
                    .join()
        }
        return crypto.createHash('md5')
            .update(`${text},${c}`).digest('hex')
    }

    generateSpeach(generateCbk, text, options) {
        const filename = this.computeFilename(text, options)
        const response = this.getFileURI(filename)

        if(response.status === 200) {
            return response.data
        } 

        try {
            const origFilePath = generateCbk(filename, options)
            const finalFilePath = this.convertToWav(origFilePath)
            this.pushFileToFS(finalFilePath)
            return finalFilePath
        } catch(e) {
            console.error(e)
        }
    }

    convertToWav(filename) {
        // TODO: Determine current format
        // TODO: Convert to new for mat
    }

    pushFileToFS(filename) {
        // TODO: Use yaps_fs to push file
    }

    getEngineName() {
        return this.name
    }
}

module.exports = AbstractTTS