/**
 * @author Pedro Sanders
 * @since v1
 */
const { Storage }= require('@yaps/storage')
const { AGIServer } = require('agi-node')
const { MaryTTS } = require('@yaps/tts')
const { YWC } = require('@yaps/voice')
const { NodeVM } = require('vm2')
const { getIngressApp } = require('./utils')
const { logger } = require('@yaps/core')
const fs = require('fs')
const path = require('path')
const dotenv = require('dotenv')
const vm = new NodeVM(require('../etc/vm.json'))

if(process.env.NODE_ENV === 'dev') {
    const env = path.join(__dirname, '..', '..', '.env.dev')
    require('dotenv').config({ path: env })
}

function dispatch(channel) {
    try {
        logger.log('verbose', `@yaps/dispatcher dispatch [entering]`)
        logger.log('debug', `@yaps/dispatcher dispatch [extension: ${channel.request.agi_extension}]`)

        const ingressApp = getIngressApp(channel.request.agi_extension)
        const appConfig = ingressApp.getConfig()
        const contents = fs.readFileSync(ingressApp.getPathToEntryPoint(), 'utf8')

        logger.log('debug', `@yaps/dispatcher dispatch [entrypoint: ${ingressApp.getPathToEntryPoint()}]`)
        logger.log('debug', `@yaps/dispatcher dispatch [appConfig: ${JSON.stringify(appConfig)}]`)
        logger.log('silly', `@yaps/dispatcher dispatch [contents: ${contents}]`)

        const chann = new YWC(channel, {
            tts: new MaryTTS(),
            storage: new Storage({bucket: appConfig.bucket})
        })

        vm.run(contents, ingressApp.getPathToEntryPoint())(chann)

        logger.log('debug', `@yaps/dispatcher dispatch [cdr: ${JSON.stringify(chann.getCallDetailRecord())}]`)
        logger.log('verbose', `@yaps/dispatcher dispatch [leaving]`)
    } catch(e) {
        logger.log('error', e.message)
    }
}

logger.log('info',`YAPS Media Controller is online @ ${process.env.MC_AGI_PORT}`)

new AGIServer(dispatch, process.env.MC_AGI_PORT)
