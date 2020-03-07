/**
 * @author Pedro Sanders
 * @since v1
 */
const path = require('path')
const grpc = require('grpc')
const protoLoader = require('@grpc/proto-loader')
const protoConfig = require('../common/proto_config')
const credentials = grpc.ServerCredentials.createInsecure()

const APP_PROTO_PATH = path.join(__dirname, '..', 'protos', 'app.proto')
const appPckgDefinition = protoLoader.loadSync(APP_PROTO_PATH, protoConfig)

const appProto = grpc.loadPackageDefinition(appPckgDefinition).yaps.app

function listApps(call, callback) {
    const data = [
        { app: { ref: '001', name: 'test001', description: 'test.test001'} },
        { app: { ref: '002', name: 'test001', description: 'test.test001'} }
    ]

    data.forEach(entry => {
      //write to the stream
        call.write(entry)
    })

    call.end()
}

function createApp(call, callback) {
    console.log(`creating app with ref: ${JSON.stringify(call.request)}`)
    // -- Operate here
    // ---
    callback(null, { result: 'OK'})
}

function getApp(call, callback) {}
function deleteApp(call, callback) {}
function updateApp(call, callback) {}

const server = new grpc.Server()
server.addService(appProto.AppService.service,{
    listApps: listApps,
    createApp: createApp,
    getApp: getApp,
    deleteApp: deleteApp,
    updateApp: updateApp
})
server.bind('0.0.0.0:50052', credentials)
server.start()
