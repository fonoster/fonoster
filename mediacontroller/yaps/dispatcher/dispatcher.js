/**
 * @author Pedro Sanders
 * @since v1
 */
const AGIServer = require('agi-node').AGIServer
const Storage = require('../core/storage')
const MaryTTS = require('../tts/mary_tts')
const YWC = require('../core/ywc')
const { getIngressApp } = require('./utils')
const { NodeVM } = require('vm2')
const fs = require('fs')
const vm = new NodeVM(require('./vm.json'))
const logger = require('../utils/logger')

function dispatcher(channel) {
    try {
        logger.log('info', 'this log record is sent to fluent daemon')
        logger.info('this log record is sent to fluent daemon')
        logger.info('end of log message')
        logger.end()

        /*const ingressApp = getIngressApp(channel.request.agi_extension)
        const appConfig = ingressApp.getConfig()
        const contents = fs.readFileSync(ingressApp.getPathToEntryPoint(),
            'utf8')

        const host = process.env.TTS_ENGINE_HOST
        const port = process.env.TTS_ENGINE_PORT
        const chann = new YWC(channel, {
            tts: new MaryTTS({host, port}),
            storage: new Storage(appConfig.storageBucket)
        })
        vm.run(contents, ingressApp.getPathToEntryPoint())(chann)

        console.log(`Call record: ${chann.getCallDetailRecord()}`)*/
    } catch(e) {
        console.error(e)
    }
}

new AGIServer(dispatcher, process.env.MC_AGI_PORT)
