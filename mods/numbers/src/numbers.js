/**
 * @author Pedro Sanders
 * @module @yaps/numbers
 * @since v1
 */
const { grpc } = require('@yaps/core')
const { logger } = require('@yaps/core')
const {
    AbstractService,
    NumbersService,
    NumbersPB
} = require('@yaps/core')
const promisifyAll = require('grpc-promise').promisifyAll
const {
    getClientCredentials
} = require('@yaps/core').trust_util

/**
 * @alias module:@yaps/numbers.Numbers
 * @typicalname numbers
 * @classdesc Use YAPS Numbers, a capability of YAPS Systems Numbers,
 * to create, and manage numbers. The Numbers service requires of a running
 * YAPS plattform.
 *
 * @extends AbstractService
 * @example
 *
 * ```Basic example```
 *
 * const YAPS = require('@yaps/sdk')
 * const numbers = new YAPS.Numbers()
 *
 * numbers.listNumbers()
 * .then(result => {
 *    console.log(result)            // successful response
 * }).catch(e => console.error(e))   // an error occurred
 */
class Numbers extends AbstractService {

    /**
     * Numbers object
     *
     * @typedef {Object} Number
     * @property {string} e164Number - A e164 valid number
     * @property {number} createTime - Time the application was created.
     * @property {number} updateTime - Last time the application was updated.
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

        const service = new NumbersService
            .NumbersClient(super.getOptions().endpoint, credentials)

        promisifyAll(service, {metadata})

        /**
         * Creates a new application.
         *
         * @async
         * @function
         * @param {Object} request - Request for object creation.
         * @return {Promise<Number>} - The number just created.
         * @example
         *
         * const request = {
         *    e164Number: '+17853178070',
         *    ingressApp: 'hello-world'      // optional
         * }
         *
         * numbers.createNumber(request)
         * .then(result => {
         *    console.log(result)            // returns the app object
         * }).catch(e => console.error(e))   // an error occurred
         */
         this.createNumber = request => {
             logger.log('verbose', `@yaps/numbers createNumber [request: ${JSON.stringify(request)}]`)
             logger.log('debug', `@yaps/numbers createNumber [validating number:  ${request.e164Number}]`)

             // TODO: Validate number

             const number = new NumbersPB.Number()
             number.setE164Number(request.e164Number)
             number.setIngressApp(request.ingressApp)

             const req = new NumbersPB.CreateNumberRequest()
             req.setNumber(number)

             return service.createNumber().sendMessage(req)
         }

         /**
          * Gets application linked to a Number.
          *
          * @async
          * @function
          * @param {Object} request - Request for app link to number
          * @return {Promise<App>} - The app link to this number
          * @example
          *
          * const YAPS = require('@yaps/sdk')
          * const numbers = new YAPS.Numbers()
          *
          * const request = {
          *    e164Number: '+17853178070'
          * }
          *
          * numbers.getIngressApp(request)
          * .then(result => {
          *    console.log(result)            // returns the app object
          * }).catch(e => console.error(e))   // an error occurred
          */
          this.getIngressApp = request => {
              logger.log('verbose', `@yaps/numbers getIngressApp [request: ${JSON.stringify(request)}]`)
              logger.log('debug', `@yaps/numbers getIngressApp [validating number:  ${request.e164Number}]`)

              // TODO: Validate number

              const req = new NumbersPB.GetIngressAppRequest()
              req.setE164Number(request.e164Number)

              return service.getIngressApp().sendMessage(req)
          }

          /**
           * Gets application linked to a Number synchronously.
           *
           * @private
           * @function
           * @param {Object} request - Object upload request
           * @return {Promise<UploadObjectResponse>} - The response
           * @example
           *
           * const YAPS = require('@yaps/sdk')
           * const numbers = new YAPS.Numbers()
           *
           * const request = {
           *    e164Number: '+17853178070'
           * }
           *
           * const result = numbers.getIngressAppSync(request)
           */
          this.getIngressAppSync = request => {
              const sleep = require('sync').sleep
              let result
              let error
              this.getIngressApp(request)
              .then(r => result = r)
              .catch(e => error = e)

              while(result === undefined && error === undefined) sleep(100)

              if (error) throw error

              return result
          }
    }

}

module.exports = Numbers
