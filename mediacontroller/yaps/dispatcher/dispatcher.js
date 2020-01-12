/**
 * @author Pedro Sanders
 * @since v1
 */
const AGIServer = require('agi-node').AGIServer
const { NodeVM } = require('vm2')
const fs = require('fs')
const vm = new NodeVM(require('./vm.json'))
const YWC = require('../core/ywc')
const EventsAPI = require('../core/events_api')

// TODO: replace with a functional TTS engine
const MockTTS = require('../tts/mock_tts') 

const eventsAPI = new EventsAPI()
const defaultTTSEngine = new MockTTS({})

function dispatcher(channel) {
    try {
        const appPath = `/functions${process.env.MC_APP_ENTRYPOINT}`
        const contents = fs.readFileSync(appPath, 'utf8')
        const chann = new YWC(channel, {
            eventsAPI,
            tts: defaultTTSEngine
        })
        // TODO: Pass parameter with simplify request
        vm.run(contents)(chann)
    } catch(e) {
        console.err(e)
    }
}

new AGIServer(dispatcher, process.env.MC_AGI_PORT)
