/**
 * @author Pedro Sanders
 * @module @yaps/appmanager
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
 * App.Status
 *
 * @typedef {enum} App.Status
 * @property {number} status - Status of the application
 * @example
 *
 * Possible values:
 *    'UNKNOWN'
 *    'CREATING'
 *    'RUNNING'
 *    'STOPPED'
 */
const STATUS = {
  UNKMNOWN: 0,
  CREATING: 1,
  RUNNING: 2,
  STOPPED: 3
}

/**
 * Add two values.
 * @alias module:@yaps/appmanager.AppManager
 * @typicalname appmanager
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
class AppManager extends AbstractService {

    /**
     * Application object
     *
     * @typedef {Object} App
     * @property {App.Status} status - Current status of the application
     * @property {string} ref - Application reference
     * @property {string} name - A name for the application
     * @property {string} description - A description for the application
     * @property {number} createTime - Time the application was created
     * @property {number} updateTime - Last time the application was updated
     * @property {number} entryPoint - main script for the application (ie: main.js or index.js)
     * @property {map} labels - Metadata for this application
     */

    /**
     * Service Options
     * @typedef {Object} Options
     * @property {string} endpoint - Endpoint for this service
     * @property {string} accessKeyId - Access Key Id
     * @property {string} accessKeySecret - Access Key Secret
     */

    /**
     * Constructs a service object.
     *
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

        promisifyAll(service, {metadata})

        /**
         * List all applications in your YAPS system.
         *
         * @async
         * @function
         * @return {Promise<App[]>} apps - A collection of applications
         * @example
         *
         * appmanager.listApps()
         * .then(result => {
         *    console.log(result)            // successful response
         * }).catch(e => console.error(e))   // an error occurred
         */
        this.listApps = () => service.listApps().sendMessage()

        /**
         * Retrives a single application by its reference.
         *
         * @async
         * @param {string} ref - The reference
         * @return {Promise<App>} app - The application
         * @example
         *
         * appmanager.getApp(ref)
         * .then(result => {
         *    console.log(result)            // returns the app object
         * }).catch(e => console.error(e))   // an error occurred
         */
        this.getApp = ref => service.getApp().sendMessage({ref})

        /**
         * Creates a new application.
         *
         * @async
         * @function
         * @param {Object} - Request for object update
         * @return {Promise<App>} - The application just created
         * @example
         *
         * appmanager.creteApp(request)
         * .then(result => {
         *    console.log(result)            // returns the app object
         * }).catch(e => console.error(e))   // an error occurred
         */
        this.createApp = request => service.createApp().sendMessage(request)

        /**
         * Updates a previously created application.
         *
         * @async
         * @function
         * @param {*} - Request for object update
         * @return {Promise<App>} - The application just updated
         * @example
         *
         * appmanager.updateApp(request)
         * .then(result => {
         *    console.log(result)            // returns the app object
         * }).catch(e => console.error(e))   // an error occurred
         */
        this.updateApp = request => service.updateApp().sendMessage(request)

        /**
         * Delete an application.
         *
         * @async
         * @function
         * @param {string} ref - The reference
         * @return {Promise<{void}>} - The application just updated
         * @example
         *
         * appmanager.deleteApp(ref)
         * .then(result => {
         *    console.log(result)            // returns an empty result
         * }).catch(e => console.error(e))   // an error occurred
         */
        this.deleteApp = ref => service.deleteApp().sendMessage({ref})
    }

    static get STATES() {
      return STATES
    }
}

module.exports = AppManager
