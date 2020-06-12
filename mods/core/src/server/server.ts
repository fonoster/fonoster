import path from 'path'
import logger from '@fonos/logger'
//import createAccessFile from '@fonos/certs'
//import grpc from '../common/grpc_hack'
import grpc from 'grpc'
//import { StorageService } from './protos/storage_grpc_pb'
const { StorageService } = require('./protos/storage_grpc_pb')
import { getObjectURL } from './storage_srv'

if (!process.env.NODE_ENV || process.env.NODE_ENV === 'dev') {
  const env = path.join(__dirname, '..', '..', '..', '.env')
  require('dotenv').config({ path: env })
}

async function main () {
  //if (!accessExist()) {
  //  logger.log('info', `No access file found. Creating access file`)
  //  await createAccessFile()
  //}

  const server = new grpc.Server()

  server.addService(StorageService, { getObjectURL })

  const endpoint = process.env.BINDADDR || '0.0.0.0:50052'
  server.bind(endpoint, grpc.ServerCredentials.createInsecure())
  server.start()

  logger.log(
    'info',
    `Fonos APIServer is online @ ${endpoint} (API version = v1alpha1)`
  )
}

main()
