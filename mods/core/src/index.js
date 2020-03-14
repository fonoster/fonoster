/**
 * @author Pedro Sanders
 * @since v1
 */

/** @ignore */
module.exports.AbstractService = require('./common/abstract_service')
module.exports.AppManagerService = require("./server/protos/appmanager_grpc_pb")
module.exports.StorageService = require("./server/protos/storage_grpc_pb")
module.exports.AppManagerPB = require("./server/protos/appmanager_pb")
module.exports.StoragePB = require("./server/protos/storage_pb")
module.exports.trust_util = require('./common/trust_util')
module.exports.grpc = require('./common/grpc_hack')
module.exports.logger = require('./common/logger')

// Validators
module.exports.validators = {
    storageValidator: require('./schemas/storage.schema'),
    appmanagerValidator: require('./schemas/appmanager.schema')
}
