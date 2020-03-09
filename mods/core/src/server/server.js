/**
 * @author Pedro Sanders
 * @since v1
 */
const path = require('path')
const grpc = require('grpc')
const protoLoader = require('@grpc/proto-loader')
const protoConfig = require('../common/proto_config')
const {
    getServerCredentials,
    auth
} = require('../common/trust_util')

const PROTO_PATH = path.join(__dirname, '..', 'protos', 'appmanager.proto')
const packageDefinition = protoLoader.loadSync(PROTO_PATH, protoConfig)

const appProto = grpc
    .loadPackageDefinition(packageDefinition).yaps.appmanager.v1alpha1

function listApps(call, callback) {
    try {
       auth(call)
    } catch(e) {
       console.error(e)
       callback(new Error('Unauthorized'), null)
       return
    }

    const data = { apps: [
        { ref: 'hello-world', name: 'hello-world', description:
          'Simple voice application'},
        { ref: 'presidential-poll', name: 'presidential-poll',
          description: 'Advance example'}
    ]}

    callback(null, data)
}

function getApp(call, callback) {
    try {
        auth(call)
    } catch(e) {
       callback(new Error('Unauthorized'), null)
       return
    }

    const app = { ref: 'hello-world', name: 'hello-world',
        description: 'Simple voice application'}
    callback(null, app)
}

function createApp(call, callback) {
    try {
        auth(call)
    } catch(e) {
       console.error(e)
       callback(new Error('Unauthorized'), null)
       return
    }

    console.log(`creating app with ref: ${JSON.stringify(call.request)}`)
    // -- Operate here
    // ---
    callback(null, call.request.app)
}

function updateApp(call, callback) {
    try {
        auth(call)
    } catch(e) {
       callback(new Error('Unauthorized'), null)
       return
    }
    console.log(`updating app with ref: ${JSON.stringify(call.request)}`)
    // -- Operate here
    // ---
    callback(null, call.request.app)
}

function deleteApp(call, callback) {
    try {
        auth(call)
    } catch(e) {
       callback(new Error('Unauthorized'), null)
       return
    }
    console.log(`deleting app with ref: ${JSON.stringify(call.request)}`)
    // -- Operate here
    // ---
    callback(null, call.request.app)
}

const server = new grpc.Server()
server.addService(appProto.AppManager.service,
  { listApps, getApp, createApp, updateApp, deleteApp })

let credentials = grpc.ServerCredentials.createInsecure()

//if(!process.env.ENABLE_INSECURE) {
//    credentials = getServerCredentials()
//}

server.bind('0.0.0.0:50052', credentials)
server.start()

console.log('YAPS API Server is online (API version = v1alpha1)')
