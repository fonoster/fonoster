/**
 * @author Pedro Sanders
 * @since v1
 */
const path = require('path')
const grpc = require('grpc')
const protoLoader = require('@grpc/proto-loader')
const protoConfig = require('../common/proto_config')
const credentials = grpc.credentials.createInsecure()

// Packages Def
const APP_PROTO_PATH = path.join(__dirname, '..', 'protos', 'app.proto')
const appPckgDefinition = protoLoader.loadSync(APP_PROTO_PATH, protoConfig)

// Proto
const appProto = grpc.loadPackageDefinition(appPckgDefinition).yaps.app

// Services
const appService = new appProto.AppService('localhost:50052', credentials)

// TODO: This should be a singleton
module.exports.appService = appService
