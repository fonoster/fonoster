/**
 * @author Pedro Sanders
 * @since v1
 */
const { AbstractService } = require('@yaps/core')
const { AppManager, grpc } = require('@yaps/core').client
// const grpc = require('grpc') Using this causes issues
// for now I'm just hacking this by exporting/import grpc
const promisifyAll = require('grpc-promise').promisifyAll
const {
    getClientCredentials
} = require('@yaps/core').trust_util

class AppManagerSrv extends AbstractService {

    constructor(options) {
        super(options)

        const metadata = new grpc.Metadata()
        metadata.add('access_key_id', super.getOptions().accessKeyId)
        metadata.add('access_key_secret', super.getOptions().accessKeySecret)

        const client = new AppManager(super.getOptions().endpoint,
          getClientCredentials())

        promisifyAll(client, {metadata})

        this.listApps = () => client.listApps().sendMessage()
        this.getApp = ref => client.getApp().sendMessage({ref})
        this.createApp = request => client.createApp().sendMessage(request)
        this.updateApp = request => client.updateApp().sendMessage(request)
        this.deleteApp = ref => client.deleteApp().sendMessage({ref})
    }
}

module.exports = AppManagerSrv
