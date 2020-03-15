/**
 * @author Pedro Sanders
 * @since v1
 */
const AGIServer = require('agi-node').AGIServer
const Storage = require('../core/storage')
// const MaryTTS = require('../tts/mary_tts')
const MaryTTS = require('@yaps/tts').MaryTTS
const YWC = require('../core/ywc')
const { getIngressApp } = require('./utils')
const { NodeVM } = require('vm2')
const fs = require('fs')
const vm = new NodeVM(require('./vm.json'))
const logger = require('../utils/logger')

function dispatcher(channel) {
    try {
        logger.log('debug', `core.Distpatcher.dispatcher [entering]`)
        logger.log('debug', `core.Distpatcher.dispatcher [extension: ${channel.request.agi_extension}]`)

        const ingressApp = getIngressApp(channel.request.agi_extension)
        const appConfig = ingressApp.getConfig()
        const contents = fs.readFileSync(ingressApp.getPathToEntryPoint(), 'utf8')

        logger.log('debug', `core.Distpatcher.dispatcher [entrypoint: ${ingressApp.getPathToEntryPoint()}]`)
        logger.log('debug', `core.Distpatcher.dispatcher [contents: ${contents}]`)

        const host = process.env.TTS_ENGINE_HOST
        const port = process.env.TTS_ENGINE_PORT
        const chann = new YWC(channel, {
            tts: new MaryTTS({host, port}),
            storage: new Storage(appConfig.storageBucket)
        })

        vm.run(contents, ingressApp.getPathToEntryPoint())(chann)

        logger.log('debug', `core.Distpatcher.dispatcher [cdr: ${JSON.stringify(chann.getCallDetailRecord())}]`)
        logger.log('debug', `core.Distpatcher.dispatcher [leaving]`)
    } catch(e) {
        logger.error(e)
    }
}

new AGIServer(dispatcher, process.env.MC_AGI_PORT)
