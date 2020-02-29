const PROTO_PATH = __dirname + '/protos/storage.proto'
const grpc = require('grpc')
const protoLoader = require('@grpc/proto-loader')
const packageDefinition = protoLoader.loadSync(
    PROTO_PATH,
    {
        keepCase: true,
        longs: String,
        enums: String,
        defaults: true,
        oneofs: true
    })

const storage_proto = grpc.loadPackageDefinition(packageDefinition).yaps.storage

function sayHello(call, callback) {
    callback(null, {result: 'Hello ' + call.request.name})
}

function main() {
    const server = new grpc.Server()
    server.addService(storage_proto.Storage.service, {sayHello: sayHello})
    server.bind('0.0.0.0:50052', grpc.ServerCredentials.createInsecure())
    server.start()
}

main()
