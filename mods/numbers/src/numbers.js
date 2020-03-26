const { grpc } = require('@yaps/core')
const { logger } = require('@yaps/core')
const { AbstractService, NumbersService, NumbersPB } = require('@yaps/core')
const promisifyAll = require('grpc-promise').promisifyAll
const { getClientCredentials } = require('@yaps/core').trust_util

/**
 * @classdesc Use YAPS Numbers, is a capability of YAPS SIP Proxy Subsystem,
 * to create, update, get and delete Numbers. YAPS Domains requires of a
 * running YAPS deployment.
 * @example
 *
 * const YAPS = require('@yaps/sdk')
 * const numbers = new YAPS.Numbers()
 *
 * const request = {
 *    e164Number: '+17853178071',
 *    ingressApp: 'hello-monkeys'
 * }
 *
 * numbers.createNumber(request)
 * .then(result => {
 *   console.log(result)             // successful response
 * }).catch(e => console.error(e))   // an error occurred
 */
class Numbers extends AbstractService {
  /**
   * Constructs a new Numbers object.
   *
   * @see module:domains:Domains
   */
  constructor (options) {
    super(options, NumbersService.NumbersClient)
    promisifyAll(super.getService(), { metadata: super.getMeta() })
  }

  /**
   * Creates a new Number on the SIP Proxy subsystem.
   *
   * @param {Object} request
   * @param {string} request.e164Number - A number in E164 format that you own
   * @param {string} request.ingressApp - Name of a registered application
   * incomming calls
   * @return {Promise<Object>}
   * @throws if the application does not exist
   * @throws The number is not a valid E164
   * @example
   *
   * const request = {
   *    e164Number: '+17853178071',
   *    ingressApp: 'hello-monkeys'
   * }
   *
   * numbers.createNumber(request)
   * .then(result => {
   *   console.log(result)            // returns the Number you created
   * }).catch(e => console.error(e))  // an error occurred
   */
  async createNumber (request) {
    logger.log(
      'verbose',
      `@yaps/numbers createNumber [request: ${JSON.stringify(request)}]`
    )
    logger.log(
      'debug',
      `@yaps/numbers createNumber [validating number:  ${request.e164Number}]`
    )

    // TODO: Validate number

    const number = new NumbersPB.Number()
    number.setE164Number(request.e164Number)
    number.setIngressApp(request.ingressApp)

    const req = new NumbersPB.CreateNumberRequest()
    req.setNumber(number)

    return super
      .getService()
      .createNumber()
      .sendMessage(req)
  }

  /**
   * Get the Ingress App for a given Number.
   *
   * @param {Object} request
   * @param {string} request.e164Number - A number in E164 format that you own
   * incomming calls
   * @return {Promise<Object>}
   * @throws if the Number is not register in YAPS
   * @example
   *
   * const request = {
   *    e164Number: '+17853178071'
   * }
   *
   * numbers.getIngressApp(request)
   * .then(result => {
   *   console.log(result)            // returns the Application
   * }).catch(e => console.error(e))  // an error occurred
   */
  async getIngressApp (request) {
    logger.log(
      'verbose',
      `@yaps/numbers getIngressApp [request: ${JSON.stringify(request)}]`
    )
    logger.log(
      'debug',
      `@yaps/numbers getIngressApp [validating number:  ${request.e164Number}]`
    )

    const req = new NumbersPB.GetIngressAppRequest()
    req.setE164Number(request.e164Number)

    return super
      .getService()
      .getIngressApp()
      .sendMessage(req)
  }

  // Internal API
  async getIngressAppSync (request) {
    const sleep = require('sync').sleep
    let result
    let error
    this.getIngressApp(request)
      .then(r => (result = r))
      .catch(e => (error = e))

    while (result === undefined && error === undefined) sleep(100)

    if (error) throw error

    return result
  }
}

module.exports = Numbers
