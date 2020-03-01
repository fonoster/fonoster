/**
 * @author Pedro Sanders
 * @since v1
 */
const AGIServer = require('agi-node').AGIServer
const Storage = require('../core/storage')
const YWC = require('../core/ywc')
const EventsAPI = require('../core/events_api')
const MaryTTS = require('../tts/mary_tts')

const { NodeVM } = require('vm2')
const fs = require('fs')
const vm = new NodeVM(require('./vm.json'))
const eventsAPI = new EventsAPI()
const defaultTTSEngine = new MaryTTS()

function dispatcher(channel) {
    try {
        const appPath = `/functions${process.env.MC_APP_ENTRYPOINT}`
        const contents = fs.readFileSync(appPath, 'utf8')
        const chann = new YWC(channel, {
            eventsAPI,
            tts: defaultTTSEngine,
            storage: new Storage()
        })
        // TODO: Pass parameter with simplify request
        vm.run(contents)(chann)
    } catch(e) {
        console.err(e)
    }
}

new AGIServer(dispatcher, process.env.MC_AGI_PORT)
