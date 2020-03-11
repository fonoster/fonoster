/**
 * @author Pedro Sanders
 * @module @yaps/storage
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
 * Add two values.
 * @alias module:@yaps/storage.Storage
 * @typicalname storage
 * @classdesc Use YAPS AppManager, a capability of YAPS Systems Manager, to create,
 * manage, and quickly deploy application configurations..
 *
 * @extends AbstractService
 * @example
 *
 * const YAPS = require('@yaps/sdk')
 * const appmanager = new YAPS.AppManager()
 *
 * appmanager.listApps()
 * .then(result => {
 *    console.log(result)            // successful response
 * }).catch(e => console.error(e))   // an error occurred
 */
class Storage extends AbstractService {

    /**
     * Test documentation 2
     *
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

}

module.exports = Storage
