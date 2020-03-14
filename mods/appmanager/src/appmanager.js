/**
 * @author Pedro Sanders
 * @module @yaps/appmanager
 * @since v1
 */
const Storage = require('@yaps/storage')
const tar = require('tar')
const fs = require('fs-extra')
const path = require('path')
const grpc = require('@yaps/core').grpc
const logger = require('@yaps/core').logger
const {
    AbstractService,
    AppManagerService,
    AppManagerPB
} = require('@yaps/core')
const promisifyAll = require('grpc-promise').promisifyAll
const {
    getClientCredentials
} = require('@yaps/core').trust_util

/**
 * An app will be in one of the following status at any given time.
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
 * @alias module:@yaps/appmanager.AppManager
 * @typicalname appmanager
 * @classdesc Use YAPS AppMAnager, a capability of YAPS Systems Manager,
 * to create, manage, and deploy an application. AppManager supports controlled
 * The AppManager requires of a running YAPS plattform.
 *
 * @extends AbstractService
 * @example
 *
 * ```Basic example```
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
     * @property {string} ref - Unique identifier for the application
     * @property {string} name - A name for the application
     * @property {string} description - A description for the application
     * @property {number} createTime - Time the application was created
     * @property {number} updateTime - Last time the application was updated
     * @property {number} entryPoint - main script for the application (ie: main.js or index.js).
     * this is use by the Media Controller to properly route a call.
     * @property {map} labels - Metadata for this application
     */

    /**
     * Use the Options object to overwrite the service default configuration.
     *
     * @typedef {Object} Options
     * @property {string} endpoint - The endpoint URI to send requests to.
     * The endpoint should be a string like '{serviceHost}:{servicePort}'.
     * @property {string} accessKeyId - your YAPS access key ID.
     * @property {string} accessKeySecret - your YAPS secret access key.
     */

    /**
     * Constructs a service object.
     *
     * @param {Options} options - Overwrite for the service's defaults configuration
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

        console.log(`Connecting with API Server @ ${super.getOptions().endpoint}`)

        const service = new AppManagerService
          .AppManagerClient(super.getOptions().endpoint, credentials)

        const storage = new Storage(super.getOptions())

        promisifyAll(service, {metadata})

        /**
         * List all applications in your YAPS system.
         *
         * @async
         * @function
         * @param {Object} request - Optional request
         * @return {Promise<App[]>} apps - A collection of applications
         * @example
         *
         * const request = { pageSize: 1, pageToken: 2, view: 'FULL'}
         *
         * appmanager.listApps(request)
         * .then(result => {
         *    console.log(result)            // successful response
         * }).catch(e => console.error(e))   // an error occurred
         */
        this.listApps = request => service.listApps().sendMessage(request)

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
         * const request = {
         *    dirPath: '/path/to/project',
         *    app: {
         *        name: 'hello-world',
         *        description: 'Simple Voice App'
         *    }
         * }
         *
         * appmanager.creteApp(request)
         * .then(result => {
         *    console.log(result)            // returns the app object
         * }).catch(e => console.error(e))   // an error occurred
         */
        this.createApp = async(request) => {
            logger.log('verbose', `@yaps/appmananger createApp [request -> ${JSON.stringify(request)}]`)
            logger.log('debug', '@yaps/appmananger createApp [validating app]')

            const packagePath = request.dirPath + '/package.json'

            if(!fs.lstatSync(request.dirPath).isDirectory()) {
                throw new Error(`${request.dirPath} is not a directory`)
            }

            if(!fs.existsSync(packagePath)) {
                throw new Error(`not package.json found in ${request.dirPath}`)
            }

            logger.log('debug', '@yaps/appmananger createApp [getting package info]')

            // Expects an existing valid package.json
            const packageInfo = path => JSON.parse(fs.readFileSync(path))
            const pInfo = packageInfo(packagePath)

            request.app = request.app || {}
            request.app.name = request.app.name || pInfo.name
            request.app.description = request.app.description || pInfo.description
            request.app.entryPoint = request.app.entryPoint || pInfo.main

            logger.log('debug', '@yaps/appmananger createApp [registering app]')
            logger.log('debug', `@yaps/appmananger createApp [package info -> ${JSON.stringify(pInfo)}]`)

            const app = new AppManagerPB.App()
            app.setName(request.app.name)
            app.setDescription(request.app.description)

            const createAppRequest = new AppManagerPB.CreateAppRequest()
            createAppRequest.setApp(app)

            const response = await service.createApp().sendMessage(createAppRequest)

            logger.log('debug', `@yaps/appmananger createApp [copyed '${request.dirPath}' into '/tmp/'}]`)

            const dirName = path.basename(request.dirPath)
            await fs.copy(request.dirPath, `/tmp/yaps/${dirName}`)

            logger.log('debug', '@yaps/appmananger createApp [archiving project folder]')

            await tar.create({cwd: '/tmp/yaps', file: `/tmp/yaps/${dirName}.tgz`},
                [dirName])

            logger.log('debug', '@yaps/appmananger createApp [uploading files]')

            // Will fail because of bad argument filenam
            await storage.uploadObject({
                filename: `/tmp/yaps/${dirName}.tgz`,
                bucket: 'default'
            })

            return response
        }

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
         *    console.log(result)            // returns the application object
         * }).catch(e => console.error(e))   // an error occurred
         */
        this.updateApp = request => service.updateApp().sendMessage(request)

        /**
         * Delete an application.
         *
         * @async
         * @function
         * @param {string} ref - Unique reference to the application
         * @return {Promise<void>} - The application just updated
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
