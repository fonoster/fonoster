'use strict'
var __awaiter =
  (this && this.__awaiter) ||
  function (thisArg, _arguments, P, generator) {
    function adopt (value) {
      return value instanceof P
        ? value
        : new P(function (resolve) {
            resolve(value)
          })
    }
    return new (P || (P = Promise))(function (resolve, reject) {
      function fulfilled (value) {
        try {
          step(generator.next(value))
        } catch (e) {
          reject(e)
        }
      }
      function rejected (value) {
        try {
          step(generator['throw'](value))
        } catch (e) {
          reject(e)
        }
      }
      function step (result) {
        result.done
          ? resolve(result.value)
          : adopt(result.value).then(fulfilled, rejected)
      }
      step((generator = generator.apply(thisArg, _arguments || [])).next())
    })
  }
Object.defineProperty(exports, '__esModule', { value: true })
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
const { accessExist, createAccessFile } = require('@fonos/certs')
const fs = require('fs')
const logger = require('../common/logger')
const grpc = require('../common/grpc_hack')
function main () {
  return __awaiter(this, void 0, void 0, function * () {
    if (!accessExist()) {
      logger.log('info', `No access file found. Creating access file`)
      yield createAccessFile()
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
      `Fonos APIServer is online @ ${endpoint} (API version = v1alpha1)`
    )
  })
}
main()
//# sourceMappingURL=server.js.map
