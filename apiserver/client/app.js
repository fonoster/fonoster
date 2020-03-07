/**
 * @author Pedro Sanders
 * @since v1
 */
const { appService } = require('./client')
const promisifyAll = require('grpc-promise').promisifyAll
promisifyAll(appService)

module.exports = function() {
    this.listApps = async () => await appService.listApps().sendMessage()
    this.createApp = async (app) => await appService.createApp().sendMessage(app)
    this.getApp = async (ref) => await appService.getApp().sendMessage(ref)
    this.updateApp = async (app) => await appService.updateApp().sendMessage(app)
    this.deleteApp = async (app) => await appService.deleteApp().sendMessage(app)
    return this
}
