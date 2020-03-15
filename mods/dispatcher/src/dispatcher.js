/**
 * @author Pedro Sanders
 * @since v1
 */
const { AGIServer } = require('agi-node')
const { MaryTTS } = require('@yaps/tts')
const { Storage } = require('@yaps/storage')
const { YWC } = require('@yaps/voice')
const { NodeVM } = require('vm2')
const { getIngressApp } = require('./utils')
const { logger } = require('@yaps/logger')
const fs = require('fs')
const vm = new NodeVM(require('../etc/vm.json'))

function dispatch(channel) {
    try {
        logger.log('verbose', `@yaps/dispatcher.Distpatcher.dispatch [entering]`)
        logger.log('debug', `@yaps/dispatcher.Distpatcher.dispatch [extension: ${channel.request.agi_extension}]`)

        const ingressApp = getIngressApp(channel.request.agi_extension)
        const appConfig = ingressApp.getConfig()
        const contents = fs.readFileSync(ingressApp.getPathToEntryPoint(), 'utf8')

        logger.log('debug', `@yaps/dispatcher.Distpatcher.dispatch [entrypoint: ${ingressApp.getPathToEntryPoint()}]`)
        logger.log('debug', `@yaps/dispatcher.Distpatcher.dispatch [contents: ${contents}]`)

        const chann = new YWC(channel, {
            tts: new MaryTTS(),
            storage: new Storage({bucket: appConfig.bucket})
        })

        vm.run(contents, ingressApp.getPathToEntryPoint())(chann)

        logger.log('debug', `@yaps/dispatcher.Distpatcher.dispatch [cdr: ${JSON.stringify(chann.getCallDetailRecord())}]`)
        logger.log('verbose', `@yaps/dispatcher.Distpatcher.dispatch [leaving]`)
    } catch(e) {
        logger.error(e)
    }
}

new AGIServer(dispatch, process.env.MC_AGI_PORT)
