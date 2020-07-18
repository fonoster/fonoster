import logger from '@fonos/logger'
import  Storage from '@fonos/storage'
import MaryTTS from '@fonos/marytts'
import Verbs from '@fonos/voice'
import getIngressInfo from './utils'
import fs from 'fs'
import path from 'path'
import { NodeVM } from 'vm2'
const { AGIServer } = require('agi-node')
const vm = new NodeVM(require('../etc/vm.json'))
const SERVICE_PORT = process.env.AGI_PORT || 4573

if (process.env.NODE_ENV === 'dev') {
  const env = path.join(__dirname, '..', '..', '..', '.env')
  require('dotenv').config({ path: env })
}

function dispatch (channel: any) {
  try {
    const toHeader = channel.getVariable('TO_HEADER').replace('<', '').replace('>', '')
    const ingressInfo = getIngressInfo(toHeader.match(/^([^@]*)@/)[1])
    const contents = fs.readFileSync(ingressInfo.entryPoint, 'utf8')
    const chann = new Verbs(channel, {
      tts: new MaryTTS(),
      storage: new Storage({ bucket: ingressInfo.bucket }),
      bucket: ingressInfo.bucket
    })
    vm.run(contents, ingressInfo.entryPoint)(chann)
  } catch (err) {
    logger.log('error', err.message)
  }
}

logger.log(
  'info',
  `Fonos Media Controller is online @ ${SERVICE_PORT}`
)

new AGIServer(dispatch, SERVICE_PORT)
