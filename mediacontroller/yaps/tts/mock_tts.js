/**
 * @author Pedro Sanders
 * @since v1
 */
const AbstractTTS = require('./abstract_tts')

class MockTTS extends AbstractTTS {

    constructor(config) {
        super('mock-tts', config)
    }

    generate(text) {
        return text
    }
}

module.exports = MockTTS