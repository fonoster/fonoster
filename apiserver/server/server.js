/**
 * @author Pedro Sanders
 * @since v1
 */
const path = require('path')
const grpc = require('grpc')
const protoLoader = require('@grpc/proto-loader')
const protoConfig = require('../common/proto_config')
const credentials = grpc.ServerCredentials.createInsecure()

const RESOURCES_PROTO_PATH = path.join(__dirname, '..', 'protos', 'resources.proto')
const resourcesPckgDefinition = protoLoader.loadSync(RESOURCES_PROTO_PATH, protoConfig)

const resourcesProto = grpc.loadPackageDefinition(resourcesPckgDefinition).yaps.resources

function listResources(call, callback) {
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

function createResource(call, callback) {
    console.log(`creating resource with ref: ${JSON.stringify(call.request)}`)
    // -- Operate here
    // ---
    callback(null, { result: 'OK'})
}

function getResource(call, callback) {}
function deleteResource(call, callback) {}
function updateResource(call, callback) {}

const server = new grpc.Server()
server.addService(resourcesProto.ResourcesService.service,{
    listResources: listResources,
    createResource: createResource,
    getResource: getResource,
    deleteResource: deleteResource,
    updateResource: updateResource
})
server.bind('0.0.0.0:50052', credentials)
server.start()
