/**
 * @author Pedro Sanders
 * @since v1
 */
class AbstractTTS {

    constructor(name) {
        this.name = name
    }

    getEngineName() {
        return this.name
    }

    synthesizeSync(text, options) {
        const sleep = require('sync').sleep
        let result
        let error

        this.synthesize(text, options)
          .then(r => result = r)
            .catch(e => error = e)

        while(result === undefined && error === undefined) sleep(100)

        if (error) throw error

        return result
    }
}

module.exports = AbstractTTS
