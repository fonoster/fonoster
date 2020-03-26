const path = require('path')

if (process.env.NODE_ENV === 'dev') {
  const env = path.join(__dirname, '..', '..', '..', '.env')
  require('dotenv').config({ path: env })
}

const { AppManagerService } = require('./protos/appmanager_grpc_pb')
const { StorageService } = require('./protos/storage_grpc_pb')
const { NumbersService } = require('./protos/numbers_grpc_pb')
const { DomainsService } = require('./protos/domains_grpc_pb')
const fs = require('fs')
const logger = require('../common/logger')
const grpc = require('../common/grpc_hack')
const { getServerCredentials } = require('../common/trust_util')

function main () {
  const server = new grpc.Server()

  server.addService(AppManagerService, require('./appmanager_srv.js'))
  server.addService(StorageService, require('./storage_srv.js'))
  server.addService(NumbersService, require('./numbers_srv.js'))
  server.addService(DomainsService, require('./domains_srv.js'))

  let credentials = grpc.ServerCredentials.createInsecure()

  server.bind(process.env.APISERVER_ENDPOINT, credentials)
  server.start()

  logger.log(
    'info',
    `YAPS APIServer is online @ ${
      process.env.APISERVER_ENDPOINT
    } (API version = v1alpha1)`
  )
}

main()
