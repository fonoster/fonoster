/**
 * @author Pedro Sanders
 * @since v1
 */
const AbstractTTS = require('./abstract_tts')

class MockTTS extends AbstractTTS {

    constructor(options) {
        super('mock-tts', options)
    }

    generate(text) {
        return text
    }
}

module.exports = MockTTS