/**
 * @author Pedro Sanders
 * @since v1
 */
const path = require('path')
const grpc = require('grpc')
const protoLoader = require('@grpc/proto-loader')
const protoConfig = require('../common/proto_config')

// Packages Def
const PROTO_PATH = path.join(__dirname, '..', 'protos', 'appmanager.proto')
const pckgDefinition = protoLoader.loadSync(PROTO_PATH, protoConfig)

// Proto
const appManagerProto = grpc
  .loadPackageDefinition(pckgDefinition).yaps.appmanager.v1alpha1

// TODO: This should be a singleton
module.exports.AppManager = appManagerProto.AppManager
module.exports.grpc = grpc
