/**
 * @author Pedro Sanders
 * @since v1
 */
const path = require('path')
const grpc = require('grpc')
const protoLoader = require('@grpc/proto-loader')
const protoConfig = require('../common/proto_config')
const credentials = grpc.ServerCredentials.createInsecure()

const PROTO_PATH = path.join(__dirname, '..', 'protos', 'appmanager.proto')
const packageDefinition = protoLoader.loadSync(PROTO_PATH, protoConfig)

const appProto = grpc
    .loadPackageDefinition(packageDefinition).yaps.appmanager.v1alpha1

function listApps(call, callback) {
    const data = { apps: [
        { ref: 'hello-world', name: 'hello-world', description:
          'Simple voice application'},
        { ref: 'presidential-poll', name: 'presidential-poll',
          description: 'Advance example'}
    ]}

    callback(null, data)
}

function getApp(call, callback) {
    const app = { ref: 'hello-world', name: 'hello-world',
        description: 'Simple voice application'}
    callback(null, app)
}

function createApp(call, callback) {
    console.log(`creating app with ref: ${JSON.stringify(call.request)}`)
    // -- Operate here
    // ---
    callback(null, call.request.app)
}

function updateApp(call, callback) {
    console.log(`updating app with ref: ${JSON.stringify(call.request)}`)
    // -- Operate here
    // ---
    callback(null, call.request.app)
}

function deleteApp(call, callback) {
    console.log(`deleting app with ref: ${JSON.stringify(call.request)}`)
    // -- Operate here
    // ---
    callback(null, call.request.app)
}

const server = new grpc.Server()
server.addService(appProto.AppManager.service,
  { listApps, getApp, createApp, updateApp, deleteApp })

server.bind('0.0.0.0:50052', credentials)
server.start()
