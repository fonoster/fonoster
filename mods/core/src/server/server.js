/**
 * @author Pedro Sanders
 * @since v1
 */
const path = require('path')
const fs = require('fs')
const grpc = require('../common/grpc_hack')
const AppManagerClient = require("./protos/appmanager_grpc_pb");
const StorageClient = require("./protos/storage_grpc_pb");
const StoragePB = require("./protos/storage_pb");

if(process.env.NODE_ENV === 'dev') {
    require('dotenv').config({ path: __dirname + '/../../../.env.dev' })
}

const {
    getServerCredentials
} = require('../common/trust_util')
const {
    listApps,
    getApp,
    createApp,
    updateApp,
    deleteApp
} = require('./appmanager_srv.js')

function uploadObject(call, callback) {
    const writeStream = fs.createWriteStream(__dirname + '/.nmpignore')

    call.on('data', request => {
        const chunk = request.getChunks()
        writeStream.write(Buffer.alloc(chunk.length, chunk))
    })

    call.on("error", error => {
        console.error(error)
    })

    call.on('end', chunk => {
        const response  = new StoragePB.UploadObjectResponse()
        response.setSize(0)
        callback(null, response)
    })
}

function main() {
    const server = new grpc.Server()
    server.addService(AppManagerClient.AppManagerService,
      { listApps, getApp, createApp, updateApp, deleteApp })

    server.addService(StorageClient.StorageService,
      { uploadObject })

    let credentials = grpc.ServerCredentials.createInsecure()

    //if(!process.env.ENABLE_INSECURE) {
    //    credentials = getServerCredentials()
    //}
    server.bind(process.env.APISERVER_ENDPOINT, credentials)
    server.start()

    console.log(`YAPS APIServer is online @ ${process.env.APISERVER_ENDPOINT} (API version = v1alpha1)`)
}

main()
