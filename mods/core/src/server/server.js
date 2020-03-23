const { AppManagerService } = require('./protos/appmanager_grpc_pb')
const { StorageService } = require('./protos/storage_grpc_pb')
const { NumbersService } = require('./protos/numbers_grpc_pb')
const { DomainsService } = require('./protos/domains_grpc_pb')
const fs = require('fs')
const path = require('path')
const logger = require('../common/logger')
const grpc = require('../common/grpc_hack')
const { getServerCredentials } = require('../common/trust_util')
const {
  listApps,
  getApp,
  createApp,
  updateApp,
  deleteApp
} = require('./appmanager_srv.js')
const { createNumber, getIngressApp } = require('./numbers_srv.js')
const { uploadObject, getObjectURL } = require('./storage_srv.js')
const { createDomain } = require('./domains_srv.js')

if (process.env.NODE_ENV === 'dev') {
  const env = path.join(__dirname, '..', '..', '..', '.env')
  require('dotenv').config({ path: env })
}

function main () {
  const server = new grpc.Server()
  server.addService(AppManagerService, {
    listApps,
    getApp,
    createApp,
    updateApp,
    deleteApp
  })

  server.addService(StorageService, {
    uploadObject,
    getObjectURL
  })

  server.addService(NumbersService, {
    createNumber,
    getIngressApp
  })

  server.addService(DomainsService, {
    createDomain
  })

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
