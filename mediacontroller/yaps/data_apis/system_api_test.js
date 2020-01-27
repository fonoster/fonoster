/**
 * @author Pedro Sanders
 * @since v1
 *
 * Unit Test for the "Abstract TTs Object"
 */
const assert = require('assert')
const SystemAPI = require('./system_api')

describe('Abstract TTS tests', () => {

    it('Test create/get tts uri', function(done) {
        const sys = new SystemAPI()
        const speach = sys.getTTSSpeachURI('fn')
        console.log(speach)
        done()
    })

})
