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
const RESOURCES_PROTO_PATH = path.join(__dirname, '..', 'protos', 'resources.proto')
const resourcesPckgDefinition = protoLoader.loadSync(RESOURCES_PROTO_PATH, protoConfig)

// Proto
const resourcesProto = grpc.loadPackageDefinition(resourcesPckgDefinition).yaps.resources

// Services
const resourcesService = new resourcesProto.ResourcesService('localhost:50052', credentials)

// TODO: This should be a singleton
module.exports.resourcesService = resourcesService
