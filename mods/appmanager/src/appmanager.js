/**
 * @author Pedro Sanders
 * @module @yaps/appmanager
 * @since v1
 */
const tar = require('tar')
const fs = require('fs-extra')
const path = require('path')
const { grpc } = require('@yaps/core')
const { logger } = require('@yaps/core')
const { Storage } = require('@yaps/storage')
const { appmanagerValidator } = require('@yaps/core').validators
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
 * to create, manage, and deploy an application. The AppManager requires of a
 * running YAPS plattform.
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
     * @property {App.Status} status - Current status of the application.
     * @property {string} name - A name, globally unique, for the application.
     * @property {string} description - A description for the application.
     * @property {number} createTime - Time the application was created.
     * @property {number} updateTime - Last time the application was updated.
     * @property {map} labels - Metadata for this application.
     */

    /**
     * Use the Options object to overwrite the service default configuration.
     *
     * @typedef {Object} Options
     * @property {string} endpoint - The endpoint URI to send requests to.
     * The endpoint should be a string like '{serviceHost}:{servicePort}'.
     * @property {string} accessKeyId - your YAPS access key ID.
     * @property {string} accessKeySecret - your YAPS secret access key.
     * @property {string} bucket - The bucket to upload apps and media files.
     */

    /**
     * Constructs a service object.
     *
     * @param {Options} options - Overwrite for the service's defaults configuration.
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

        logger.log('info', `Connecting with API Server @ ${super.getOptions().endpoint}`)

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
        this.listApps = request => {
            logger.log('verbose', `@yaps/appmananger listApps [request -> ${JSON.stringify(request)}]`)
            const r = new AppManagerPB.ListAppsRequest()
            r.setPageSize(request.pagSize)
            r.setPageToken(request.pageToken)
            r.setView(request.view)
            return service.listApps().sendMessage(r)
        }

        /**
         * Retrives a single application by its reference.
         *
         * @async
         * @param {string} name - The app identifier
         * @return {Promise<App>} app - The application
         * @example
         *
         * appmanager.getApp(name)
         * .then(result => {
         *    console.log(result)            // returns the app object
         * }).catch(e => console.error(e))   // an error occurred
         */
        this.getApp = name => {
            const request = new AppManagerPB.GetAppRequest()
            request.setName(name)
            return service.getApp().sendMessage(request)
        }

        /**
         * Creates a new application.
         *
         * @async
         * @function
         * @param {Object} request - Request for object creation.
         * @return {Promise<App>} - The application just created.
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
         * appmanager.createApp(request)
         * .then(result => {
         *    console.log(result)            // returns the app object
         * }).catch(e => console.error(e))   // an error occurred
         *
         * @todo if the file uploading fails the state of the application should
         * change to UNKNOWN
         */
        this.createApp = async(request) => {
            logger.log('verbose', `@yaps/appmananger createApp [request -> ${JSON.stringify(request)}]`)
            logger.log('debug', '@yaps/appmananger createApp [validating app]')
            logger.log('debug', '@yaps/appmananger createApp [getting package info]')

            try {
                const packagePath = request.dirPath + '/package.json'

                // Expects an existing valid package.json
                const packageInfo = path => JSON.parse(fs.readFileSync(path))
                let pInfo

                try {
                    pInfo = packageInfo(packagePath)
                    logger.log('debug', `@yaps/appmananger createApp [package info -> ${JSON.stringify(pInfo)}]`)
                } catch(err) {
                    throw new Error(`Unable to open project directory '${request.dirPath}'`)
                }

                request.app = request.app || {}
                request.app.name = request.app.name || pInfo.name
                request.app.description = request.app.description || pInfo.description

                logger.log('debug', `@yaps/appmananger createApp [modified request -> ${JSON.stringify(request)} ]`)

                // WARNING: I'm not happy with this. Seems inconsistent with the other
                // errors...
                const errors = appmanagerValidator.createAppRequest.validate({
                    app: {
                      name: request.app.name,
                      description: request.app.description
                    }
                })

                if(errors.length > 0) {
                    logger.log('warn', `@yaps/appmananger createApp [invalid argument/s]`)
                    throw new Error(errors[0].message)
                }

                if(!fs.existsSync(request.dirPath) ||
                    !fs.lstatSync(request.dirPath).isDirectory()) {
                    throw new Error(`${request.dirPath} does not exist or is not a directory`)
                }

                if(!fs.existsSync(packagePath)) {
                    throw new Error(`not package.json found in ${request.dirPath}`)
                }

                logger.log('debug', '@yaps/appmananger createApp [registering app]')

                const app = new AppManagerPB.App()
                app.setName(request.app.name)
                app.setDescription(request.app.description)

                const createAppRequest = new AppManagerPB.CreateAppRequest()
                createAppRequest.setApp(app)

                const response = await service.createApp().sendMessage(createAppRequest)

                // TODO: Validate that the name is lower case and has no spaces
                const dirName = `${request.app.name}`
                await fs.copy(request.dirPath, `/tmp/${dirName}`)

                logger.log('debug', `@yaps/appmananger createApp [copyed '${request.dirPath}' into '/tmp/${dirName}'}]`)
                logger.log('debug', '@yaps/appmananger createApp [archiving project folder]')

                await tar.create({file: `/tmp/${dirName}.tgz`, cwd: '/tmp'},
                    [dirName])

                logger.log('debug', `@yaps/appmananger createApp [uploading to bucket -> ${super.getOptions().bucket}]`)

                // Will fail because of bad argument filenam
                await storage.uploadObject({
                    filename: `/tmp/${dirName}.tgz`,
                    bucket: super.getOptions().bucket
                })

                return response
            } catch(e) {
                throw e
            }
        }

        /**
         * Updates a previously created application.
         *
         * @async
         * @function
         * @param {Object} request - Request for object update.
         * @return {Promise<App>} - The application just updated.
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
         * @param {string} name - Unique reference to the application
         * @return {Promise<void>} - The application just updated
         * @example
         *
         * appmanager.deleteApp(name)
         * .then(result => {
         *    console.log(result)            // returns an empty result
         * }).catch(e => console.error(e))   // an error occurred
         */
        this.deleteApp = name => service.deleteApp().sendMessage({name})
    }

    static get STATES() {
      return STATES
    }
}

module.exports = AppManager
