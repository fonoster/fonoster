/**
 * @author Pedro Sanders
 * @since v1
 */
const { appManagerService } = require('@yaps/core').client
const promisifyAll = require('grpc-promise').promisifyAll

module.exports = function() {
    promisifyAll(appManagerService)
    this.listApps = async () => appManagerService.listApps().sendMessage()
    this.getApp = async (ref) => appManagerService.getApp().sendMessage({ref})
    this.createApp = async (request) => appManagerService.createApp().sendMessage(request)
    this.updateApp = async (request) => appManagerService.updateApp().sendMessage(request)
    this.deleteApp = async (ref) => appManagerService.deleteApp().sendMessage({ref})
    return this
}
