const path = require('path')

if (!process.env.NODE_ENV || process.env.NODE_ENV === 'dev') {
  const env = path.join(__dirname, '..', '..', '..', '.env')
  require('dotenv').config({ path: env })
}

const { AppManagerService } = require('./protos/appmanager_grpc_pb')
const { StorageService } = require('./protos/storage_grpc_pb')
const { ProvidersService } = require('./protos/providers_grpc_pb')
const { NumbersService } = require('./protos/numbers_grpc_pb')
const { DomainsService } = require('./protos/domains_grpc_pb')
const { AgentsService } = require('./protos/agents_grpc_pb')
const { getServerCredentials } = require('../common/trust_util')
const { accessExist, createAccessFile } = require('@yaps/certs')
const fs = require('fs')
const logger = require('../common/logger')
const grpc = require('../common/grpc_hack')

async function main () {
  if (!accessExist()) {
    logger.log('info', `No access file found. Creating access file`)
    await createAccessFile()
  }

  const server = new grpc.Server()

  server.addService(AppManagerService, require('./appmanager_srv.js'))
  server.addService(StorageService, require('./storage_srv.js'))
  server.addService(ProvidersService, require('./providers_srv.js'))
  server.addService(NumbersService, require('./numbers_srv.js'))
  server.addService(DomainsService, require('./domains_srv.js'))
  server.addService(AgentsService, require('./agents_srv.js'))

  const endpoint = process.env.APISERVER_ENDPOINT || '0.0.0.0:50052'
  server.bind(endpoint, getServerCredentials())
  server.start()

  logger.log(
    'info',
    `YAPS APIServer is online @ ${endpoint} (API version = v1alpha1)`
  )
}

main()
