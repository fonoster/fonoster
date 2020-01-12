/**
 * @author Pedro Sanders
 * @since v1
 *
 * Unit Test for the "Voice API"
 */
const assert = require('assert')
const MockChannel = require('./mock_channel')
const MockTTS = require('../tts/mock_tts')
const VoiceAPI = require('./voice_api')
const EventsAPI = require('./events_api')
const eventsAPI = new EventsAPI()

describe('Voice API tests', () => {

    it('Test verb answer', done => {
        const channel = new MockChannel()
        const voice = new VoiceAPI(channel, {eventsAPI})
        assert.equal(0, voice.answer())
        done()
    })

    it('Test verb hangup', done => {
        const channel = new MockChannel()
        const voice = new VoiceAPI(channel, {eventsAPI})
        assert.equal(1, voice.hangup())
        done()
    })
    
    it('Test verb play', done => {
        const channel = new MockChannel()
        const voice = new VoiceAPI(channel, {eventsAPI})
        channel.setData(['1'])
        const result = voice.play('beep')
        assert.equal('1', result)

        try {
            voice.play('beep', {finishOnKey: '%'})
            done('Error: Failed exception')
        } catch(e) {
        }      

        done()
    })

    it('Test verb say', done => {
        const channel = new MockChannel()
        const voice = new VoiceAPI(channel, {eventsAPI})
        channel.setData(['1'])

        try {
            voice.say('Hello World')
            done('Error: Failed exception')
        } catch(e) {
        }

        voice.config({tts: new MockTTS({})})
        voice.say('Hello World')
        done()
    })    

    it('Test verb gather', done => {
        const channel = new MockChannel()
        const voice = new VoiceAPI(channel, {eventsAPI})

        try {
            voice.gather('', {finishOnKey: 'aa', maxDigits: 'p'})
            done('Error: Failed exception')
        } catch(e) {
        }

        try {
            voice.gather('', {timeout: 0})
            done('Error: Failed exception')
        } catch(e) {
        }

        channel.setData(['1', '2', '3', '4', '#'])
        let result = voice.gather('', {maxDigits: 4})
        assert.equal('1234', result)

        channel.setData(['1', '2', '3', null])
        channel.resetDataPointer()
        result = voice.gather('', {timeout: 5, maxDigits: 4})
        assert.equal('123', result)

        done()
    })     

    it('Test verb wait', done => {
        const channel = new MockChannel()
        const voice = new VoiceAPI(channel, {eventsAPI})

        try {
            voice.wait(-1)
            done('Error: Failed exception')
        } catch(e) {
        }
        
        done()
    })  

    it('Test verb record', done => {
        const channel = new MockChannel()

        const voice = new VoiceAPI(channel, {eventsAPI})
        
        try {
            voice.record({beep: 'a'})
            done('Error: Failed exception')
        } catch(e) {
        }
        
        voice.record()

        done()
    }) 
    
    it('Test verb stash', done => {
        const channel = new MockChannel()
        const voice = new VoiceAPI(channel, {eventsAPI})
        voice.stash('key1', 'val1')
        voice.stash('key2', 'val2')
        voice.stash('key1', 'val3')
        assert.equal(2, voice.getCallDetailRecord().vars.size)
        done()
    })    

})
