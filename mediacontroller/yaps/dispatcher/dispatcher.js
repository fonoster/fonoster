/**
 * @author Pedro Sanders
 * @since v1
 */
const AGIServer = require('agi-node').AGIServer
const Storage = require('../core/storage')
const MaryTTS = require('../tts/mary_tts')
const YWC = require('../core/ywc')
const { NodeVM } = require('vm2')
const fs = require('fs')
const vm = new NodeVM(require('./vm.json'))

function dispatcher(channel) {
    try {
        const contents = fs.readFileSync(process.env.MC_APP_ENTRYPOINT, 'utf8')
        const host = process.env.TTS_ENGINE_HOST
        const port = process.env.TTS_ENGINE_PORT
        const chann = new YWC(channel, {
            tts: new MaryTTS({host, port}),
            // WARNING: This should be taken from the app 'config.js'
            storage: new Storage('default-test')
        })
        // TODO: Pass parameter with simplify request
        vm.run(contents, process.env.MC_APP_ENTRYPOINT)(chann)
    } catch(e) {
        console.error(e)
    }
}

new AGIServer(dispatcher, process.env.MC_AGI_PORT)
