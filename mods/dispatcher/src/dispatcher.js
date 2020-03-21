const { Storage } = require('@yaps/storage')
const { AGIServer } = require('agi-node')
const { MaryTTS } = require('@yaps/tts')
const { YWC } = require('@yaps/voice')
const { NodeVM } = require('vm2')
const { getIngressInfo } = require('./utils')
const fs = require('fs')
const path = require('path')
const dotenv = require('dotenv')
const vm = new NodeVM(require('../etc/vm.json'))
const { logger, updateBucketPolicy } = require('@yaps/core')

if (process.env.NODE_ENV === 'dev') {
  const env = path.join(__dirname, '..', '..', '..', '.env')
  require('dotenv').config({ path: env })
}

function dispatch (channel) {
  try {
    logger.log('verbose', `@yaps/dispatcher dispatch [entering]`)
    logger.log(
      'debug',
      `@yaps/dispatcher dispatch [extension: ${channel.request.extension}]`
    )

    const ingressInfo = getIngressInfo(channel.request.extension)
    logger.log(
      'silly',
      `@yaps/dispatcher dispatch [appConfig: ${JSON.stringify(ingressInfo)}]`
    )

    const contents = fs.readFileSync(ingressInfo.entryPoint, 'utf8')
    logger.log('silly', `@yaps/dispatcher dispatch [contents: ${contents}]`)

    const chann = new YWC(channel, {
      tts: new MaryTTS(),
      storage: new Storage({ bucket: ingressInfo.bucket }),
      bucket: ingressInfo.bucket
    })

    logger.log('verbose', `@yaps/dispatcher dispatch [running app]`)

    vm.run(contents, ingressInfo.entryPoint)(chann)

    logger.log(
      'debug',
      `@yaps/dispatcher dispatch [cdr: ${JSON.stringify(
        chann.getCallDetailRecord()
      )}]`
    )
    logger.log('verbose', `@yaps/dispatcher dispatch [leaving]`)
  } catch (err) {
    logger.log('error', err.message)
  }
}

logger.log(
  'info',
  `YAPS Media Controller is online @ ${process.env.MC_AGI_PORT}`
)

new AGIServer(dispatch, process.env.MC_AGI_PORT)
