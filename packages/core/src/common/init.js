/**
 * @author Pedro Sanders
 * @since v1
 */
const APP_PROTO_PATH = __dirname + '/../protos/app.proto'
const grpc = require('grpc')
const protoLoader = require('@grpc/proto-loader')
const protoConfig = require('../common/proto_config')
const credentials = grpc.credentials.createInsecure()
