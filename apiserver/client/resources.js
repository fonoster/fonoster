/**
 * @author Pedro Sanders
 * @since v1
 */
const { resourcesService } = require('./client')
const promisifyAll = require('grpc-promise').promisifyAll
promisifyAll(resourcesService)

module.exports.App = function() {
    this.listApps = async () => resourcesService.listResources().sendMessage()
    this.createApp = async (app) => resourcesService.createResource().sendMessage({ app })
    this.updateApp = async (app) => resourcesService.updateResource().sendMessage({ app })
    this.getApp = async (ref) => resourcesService.getResource().sendMessage(ref)
    this.deleteApp = async (ref) => resourcesService.deleteResource().sendMessage(ref)
    return this
}

module.exports.Gateway = function() {
    this.listGateway = async () => resourcesService.listResources().sendMessage()
    this.createGateway = async (gateway) => resourcesService.createResource().sendMessage({ gateway })
    this.updateGateway = async (gateway) => resourcesService.updateResource().sendMessage({ gateway })
    this.getGateway = async (ref) => resourcesService.getResource().sendMessage(ref)
    this.deleteGateway = async (ref) => resourcesService.deleteResource().sendMessage(ref)
    return this
}
