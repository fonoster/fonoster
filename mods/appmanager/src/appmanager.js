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

/**
 * Test documentation 1
 *
 * @extends AbstractService
 */
class AppManagerSrv extends AbstractService {

    /**
     * Test documentation 2
     *
     * @constructor
     * @param options
     */
    constructor(options) {
        super(options)

        const metadata = new grpc.Metadata()
        metadata.add('access_key_id', super.getOptions().accessKeyId)
        metadata.add('access_key_secret', super.getOptions().accessKeySecret)

        let credentials = grpc.credentials.createInsecure()

        //if(!process.env.ENABLE_INSECURE) {
        //    credentials = getClientCredentials()
        //}

        const client = new AppManager(super.getOptions().endpoint, credentials)

        promisifyAll(client, {metadata})

        /**
         * Lists user applications
         * @async
         * @param {string} n - A string param
         * @return {string} A good string
         */
        this.listApps = () => client.listApps().sendMessage()
        //this.getApp = ref => client.getApp().sendMessage({ref})
        this.createApp = request => client.createApp().sendMessage(request)
        this.updateApp = request => client.updateApp().sendMessage(request)
        this.deleteApp = ref => client.deleteApp().sendMessage({ref})
    }

    async 

}

module.exports = AppManagerSrv
