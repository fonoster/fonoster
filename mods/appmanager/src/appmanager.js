/**
 * A module for adding two values.
 */

const tar = require('tar')
const fs = require('fs-extra')
const path = require('path')
const { grpc } = require('@yaps/core')
const { logger } = require('@yaps/core')
const { Storage } = require('@yaps/storage')
const { appManagerValidator } = require('@yaps/core').validators
const promisifyAll = require('grpc-promise').promisifyAll
const {
    AbstractService,
    AppManagerService,
    AppManagerPB
} = require('@yaps/core')
const {
    getClientCredentials
} = require('@yaps/core').trust_util

const STATUS = {
  UNKNOWN: 0,
  CREATING: 1,
  RUNNING: 2,
  STOPPED: 3
}

/**
 * @classdesc Use YAPS AppManager, a capability of YAPS Systems Manager,
 * to create, manage, and deploy an application. The AppManager requires of a
 * running YAPS platform.
 *
 * @extends AbstractService
 * @example
 *
 * const YAPS = require('@yaps/sdk')
 * const appManager = new YAPS.AppManager()
 *
 * appManager.deployApp('/path/to/app')
 * .then(result => {
 *   console.log(result)            // successful response
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
      * Constructs a new AppManager Object
      *
      * @see module:core:AbstractService
      */
    constructor(options) {
        super(options)

        const metadata = new grpc.Metadata()
        metadata.add('access_key_id', super.getOptions().accessKeyId)
        metadata.add('access_key_secret', super.getOptions().accessKeySecret)

        const credentials = grpc.credentials.createInsecure()

        logger.log('info', `Connecting with API Server @ ${super.getOptions().endpoint}`)

        const service = new AppManagerService
          .AppManagerClient(super.getOptions().endpoint, credentials)

        this.service = service
        this.storage = new Storage(super.getOptions())

        promisifyAll(service, {metadata})

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
         * @return {Promise<App>} The application
         * @throws Will throw an error if the argument is null.
         * @example
         *
         * appManager.getApp(name)
         * .then(result => {
         *   console.log(result)            // returns the app object
         * }).catch(e => console.error(e))   // an error occurred
         */
        this.getApp = name => {
            const request = new AppManagerPB.GetAppRequest()
            request.setName(name)
            return service.getApp().sendMessage(request)
        }

        this.deleteApp = name => service.deleteApp().sendMessage({name})
    }

    /**
     * Deploys an application to YAPS
     * @param {string} path - path to the application
     * @return {Promise<App>} The application just created.
     * @example
     *
     * const path = '/path/to/project'
     *
     * appManager.deployApp(path)
     * .then(result => {
     *   console.log(result)            // returns the app object
     * }).catch(e => console.error(e))   // an error occurred
     *
     * @todo if the file uploading fails the state of the application should
     * change to UNKNOWN
     */
    async deployApp(appPath) {
        logger.log('verbose', `@yaps/appmananger deployApp [path -> ${appPath}]`)
        logger.log('debug', '@yaps/appmananger deployApp [validating app]')
        logger.log('debug', '@yaps/appmananger deployApp [getting package info]')

        try {
            const packagePath = path.join(appPath, 'package.json')

            // Expects an existing valid package.json
            const packageInfo = p => JSON.parse(fs.readFileSync(p))
            let pInfo

            try {
                pInfo = packageInfo(packagePath)
                logger.log('debug', `@yaps/appmananger deployApp [package info -> ${JSON.stringify(pInfo)}]`)
            } catch(err) {
                throw new Error(`Unable to open project folder '${appPath}'`)
            }

            const request = {
                dirPath: appPath,
                app: {
                    name: pInfo.name,
                    description: pInfo.description
                }
            }

            logger.log('debug', `@yaps/appmananger deployApp [modified request -> ${JSON.stringify(request)} ]`)

            // WARNING: I'm not happy with this. Seems inconsistent with the other
            // errors...
            console.log('PINGITA: ', appManagerValidator)
            const errors = appManagerValidator.createAppRequest.validate({
                app: {
                  name: request.app.name,
                  description: request.app.description
                }
            })

            if(errors.length > 0) {
                logger.log('warn', `@yaps/appmananger deployApp [invalid argument/s]`)
                throw new Error(errors[0].message)
            }

            if(!fs.existsSync(request.dirPath) ||
                !fs.lstatSync(request.dirPath).isDirectory()) {
                throw new Error(`${request.dirPath} does not exist or is not a directory`)
            }

            if(!fs.existsSync(packagePath)) {
                throw new Error(`not package.json found in ${request.dirPath}`)
            }

            logger.log('debug', '@yaps/appmananger deployApp [registering app]')

            const app = new AppManagerPB.App()
            app.setName(request.app.name)
            app.setDescription(request.app.description)

            const createAppRequest = new AppManagerPB.CreateAppRequest()
            createAppRequest.setApp(app)

            const response = await this.service.createApp().sendMessage(createAppRequest)

            // TODO: Validate that the name is lower case and has no spaces
            const dirName = `${request.app.name}`
            await fs.copy(request.dirPath, `/tmp/${dirName}`)

            logger.log('debug', `@yaps/appmananger deployApp [copyed '${request.dirPath}' into '/tmp/${dirName}'}]`)
            logger.log('debug', '@yaps/appmananger deployApp [archiving project folder]')

            await tar.create({file: `/tmp/${dirName}.tgz`, cwd: '/tmp'},
                [dirName])

            logger.log('debug', `@yaps/appmananger deployApp [uploading to bucket -> ${super.getOptions().bucket}]`)

            // Will fail because of bad argument filenam
            await this.storage.uploadObject({
                filename: `/tmp/${dirName}.tgz`,
                bucket: super.getOptions().bucket
            })

            return response
        } catch(e) {
            throw e
        }
    }

    static get STATES() {
      return STATES
    }
}

module.exports = AppManager
