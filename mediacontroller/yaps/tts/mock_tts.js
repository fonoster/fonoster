/**
 * @author Pedro Sanders
 * @since v1
 */
const AbstractTTS = require('./abstract_tts')

class MockTTS extends AbstractTTS {

    constructor(config) {
        super('mock-tts', config)
    }

    synthesize(text, options) {
        // You must implement your own callback for each new TTSEngine
        return super.generateSpeach(text, options,
          (text, options) => __dirname + '/test.wav')
    }
}

module.exports = MockTTS
