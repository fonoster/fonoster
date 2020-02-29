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

function main() {
    const client = new storage_proto.Storage('localhost:50052', grpc.credentials.createInsecure())

    client.sayHello({name: 'Peter'}, (err, response) => {
        console.log('Greeting:', response.result)
    })
}
main()
