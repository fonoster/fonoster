const { logger, updateBucketPolicy } = require('@fonos/core')
const { Storage } = require('@fonos/storage')
const { AGIServer } = require('agi-node')
const { MaryTTS } = require('@fonos/tts')
const { Verbs } = require('@fonos/voice')
const { NodeVM } = require('vm2')
const { getIngressInfo } = require('./utils')
const fs = require('fs')
const path = require('path')
const dotenv = require('dotenv')
const vm = new NodeVM(require('../etc/vm.json'))

if (process.env.NODE_ENV === 'dev') {
  const env = path.join(__dirname, '..', '..', '..', '.env')
  require('dotenv').config({ path: env })
}

function dispatch (channel: { request: { extension: any } }) {
  try {
    logger.log('verbose', `@fonos/dispatcher dispatch [entering]`)
    logger.log(
      'debug',
      `@fonos/dispatcher dispatch [extension: ${channel.request.extension}]`
    )

    const ingressInfo = getIngressInfo(channel.request.extension)
    logger.log(
      'silly',
      `@fonos/dispatcher dispatch [appConfig: ${JSON.stringify(ingressInfo)}]`
    )

    const contents = fs.readFileSync(ingressInfo.entryPoint, 'utf8')
    logger.log('silly', `@fonos/dispatcher dispatch [contents: ${contents}]`)

    const chann = new Verbs(channel, {
      tts: new MaryTTS(),
      storage: new Storage({ bucket: ingressInfo.bucket }),
      bucket: ingressInfo.bucket
    })

    logger.log('verbose', `@fonos/dispatcher dispatch [running app]`)

    vm.run(contents, ingressInfo.entryPoint)(chann)

    logger.log(
      'debug',
      `@fonos/dispatcher dispatch [cdr: ${JSON.stringify(
        chann.getCallDetailRecord()
      )}]`
    )
    logger.log('verbose', `@fonos/dispatcher dispatch [leaving]`)
  } catch (err) {
    logger.log('error', err.message)
  }
}

logger.log(
  'info',
  `Fonos Media Controller is online @ ${process.env.AGI_PORT || 4573}`
)

new AGIServer(dispatch, process.env.AGI_PORT || 4573)
