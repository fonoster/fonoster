/**
 * @author Pedro Sanders
 * @since v1
 */
const { AbstractService } = require('@yaps/core')
const { AppManagerService, grpc } = require('@yaps/core').client
// const grpc = require('grpc') Using this causes issues
// for now I'm just hacking this by exporting/import grpc
const promisifyAll = require('grpc-promise').promisifyAll
const {
    getClientCredentials
} = require('@yaps/core').trust_util

/**
 * Use YAPS AppManager, a capability of YAPS Systems Manager, to create,
 * manage, and quickly deploy application configurations.
 *
 * @extends AbstractService
 * @example
 *
 * const appmanager = new YAPS.AppManager()
 *
 * appmanager.listApps()
 * .then(result => {
 *    console.log(result)            // successful response
 *  }).catch(e => console.error(e))  // an error occurred
 */
class AppManager extends AbstractService {

    /**
     * Service Options
     *
     * @typedef {Object} Options
     * @property {string} endpoint - Endpoint for this service
     * @property {string} accessKeyId - Access Key Id
     * @property {string} accessKeySecret - Access Key Secret
     */

    /**
     * App.Status
     *
     * @typedef {Object} App.Status
     * @property {string} status - Status of the application
     */

    /**
     * Application object
     *
     * @typedef {Object} App
     * @property {App.Status} status - Current status of the application
     * @property {string} ref - Application reference
     * @property {string} name - A name for the application
     * @property {string} description - A description for the application
     * @property {number} create_time - Time the application was created
     * @property {number} update_time - Last time the application was updated
     * @property {number} entry_point - Last time the application was updated
     * @property {map} labels - Metadata for this application
     */

    /**
     * Constructs a service object.
     *
     * @constructor
     * @param {Options} options - Optional configurations for the service
     */
    constructor(options) {
        super(options)

        const metadata = new grpc.Metadata()
        metadata.add('access_key_id', super.getOptions().accessKeyId)
        metadata.add('access_key_secret', super.getOptions().accessKeySecret)

        const credentials = grpc.credentials.createInsecure()

        //if(!process.env.ENABLE_INSECURE) {
        //    credentials = getClientCredentials()
        //}

        const service = new AppManagerService(super.getOptions().endpoint, credentials)

        promisifyAll(client, {metadata})

        /**
         * List all applications in your YAPS system.
         *
         * @async
         * @function
         * @return {Promise<App[]>} - A collection of applications
         */
        this.listApps = () => service.listApps().sendMessage()

        /**
         * Retrives a single application by its reference.
         *
         * @async
         * @param {string} ref - The reference
         * @return {Promise<App>} apps - The application
         */
        this.getApp = ref => service.getApp().sendMessage({ref})

        /**
         * Creates a new application.
         *
         * @async
         * @function
         * @param {*} - Request for object update
         * @return {Promise<App>} - The application just created
         */
        this.createApp = request => service.createApp().sendMessage(request)

        /**
         * Updates a previously created application.
         *
         * @async
         * @function
         * @param {*} - Request for object update
         * @return {Promise<App>} - The application just updated
         */
        this.updateApp = request => service.updateApp().sendMessage(request)

        /**
         * Delete an application.
         *
         * @async
         * @param {string} ref
         * @return {Promise<App>}
         */
        this.deleteApp = ref => service.deleteApp().sendMessage({ref})
    }

}

module.exports = AppManager
