/**
 * @author Pedro Sanders
 * @since v1
 */
const path = require('path')
const grpc = require('../common/grpc_hack')
const AppManagerClient = require("./protos/appmanager_grpc_pb");
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

function main() {
    const server = new grpc.Server()
    server.addService(AppManagerClient.AppManagerService,
      { listApps, getApp, createApp, updateApp, deleteApp })

    let credentials = grpc.ServerCredentials.createInsecure()

    //if(!process.env.ENABLE_INSECURE) {
    //    credentials = getServerCredentials()
    //}

    server.bind('0.0.0.0:50052', credentials)
    server.start()

    console.log('YAPS API Server is online (API version = v1alpha1)')
}

main()
