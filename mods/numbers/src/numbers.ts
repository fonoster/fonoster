import { FonosService, NumbersService, NumbersPB } from '@fonos/core'
import { Number } from '@fonos/core/src/server/protos/numbers_pb'

/**
 * @classdesc Use Fonos Numbers, a capability of Fonos SIP Proxy subsystem,
 * to create, update, get and delete numbers. Fonos Numbers requires of a
 * running Fonos deployment.
 *
 * @extends FonosService
 * @example
 *
 * const Fonos = require('@fonos/sdk')
 * const numbers = new Fonos.Numbers()
 *
 * const request = {
 *   providerRef: '516f1577bcf86cd797439012',
 *   e164Number: '+17853177343',
 *   ingressApp: 'hello-monkeys'
 * }
 *
 * numbers.createNumber(request)
 * .then(result => {
 *   console.log(result)             // successful response
 * }).catch(e => console.error(e))   // an error occurred
 */
class Numbers extends FonosService {
  /**
   * Constructs a new Numbers object.
   *
   * @see module:core:FonosService
   */
  constructor (options?: any) {
    super(NumbersService.NumbersClient, options)
    super.init()
    const { promisifyAll } = require('grpc-promise')
    promisifyAll(super.getService(), { metadata: super.getMeta() })
  }

  /**
   * Creates a new Number on the SIP Proxy subsystem.
   *
   * @param {Object} request -  Request for the provision of a new Number
   * @param {string} request.providerRef - Idenfier to the Provider this Number belongs
   * with
   * @param {string} request.e164_number - A valid number @ Provider
   * @param {string} request.aorLink - An AOR where ingress calls will be
   * directed to
   * @param {string} request.ingress_app - An Application where ingress calls
   * will be directed to
   * @note You can only provider an aorLink or an ingressApp but no both
   * @return {Promise<Object>}
   * @example
   *
   * const request = {
   *   providerRef: '516f1577bcf86cd797439012',
   *   e164Number: '+17853177343',
   *   aorLink: 'sip:1001@sip.local'
   * }
   *
   * numbers.createNumber(request)
   * .then(result => {
   *   console.log(result)            // returns the Number object
   * }).catch(e => console.error(e))  // an error occurred
   */
  async createNumber (request: {
    providerRef: any
    e164Number: any
    ingressApp: any
    aorLink: any
  }) {
    const number = new Number()
    number.setProviderRef(request.providerRef)
    number.setE164Number(request.e164Number)
    number.setIngressApp(request.ingressApp)
    number.setAorLink(request.aorLink)

    const req = new NumbersPB.CreateNumberRequest()
    req.setNumber(number)

    return super
      .getService()
      .createNumber()
      .sendMessage(req)
  }

  /**
   * Retrives a Number by its reference.
   *
   * @param {string} ref - Reference to Number
   * @return {Promise<Object>} The number
   * @throws if ref is null or Number does not exist
   * @example
   *
   * numbers.getNumber(ref)
   * .then(result => {
   *   console.log(result)             // returns the Number object
   * }).catch(e => console.error(e))   // an error occurred
   */
  async getNumber (ref: string) {
    const request = new NumbersPB.GetNumberRequest()
    request.setRef(ref)
    return this.service.getNumber().sendMessage(request)
  }

  /**
   * Update a Number at the SIP Proxy subsystem.
   *
   * @param {Object} request - Request for the update of an existing Number
   * @param {string} request.aorLink - An AOR where ingress calls will be
   * directed to
   * @param {string} request.ingress_app - An Application where ingress calls
   * will be directed to
   * @note You can only provider an aorLink or an ingressApp but no both
   * @return {Promise<Object>}
   * @example
   *
   * const request = {
   *   ref: '516f1577bcf86cd797439012',
   *   aorLink: 'sip:1001@sip.local'
   * }
   *
   * numbers.updateNumber(request)
   * .then(result => {
   *   console.log(result)            // returns the Number from the DB
   * }).catch(e => console.error(e))  // an error occurred
   */
  async updateNumber (request: { ref: any; aorLink: any; ingressApp: any }) {
    const numberFromDB = await this.getNumber(request.ref)

    if (request.aorLink && request.ingressApp) {
      throw `'ingressApp' and 'aorLink' are not compatible parameters`
    } else if (!request.aorLink && !request.ingressApp) {
      throw `You must provider either an 'ingressApp' or and 'aorLink'`
    }

    if (request.aorLink) {
      numberFromDB.setAorLink(request.aorLink)
      numberFromDB.setIngressApp(void 0)
    } else {
      numberFromDB.setAorLink(void 0)
      numberFromDB.setIngressApp(request.ingressApp)
    }

    const req = new NumbersPB.UpdateNumberRequest()
    req.setNumber(numberFromDB)

    return super
      .getService()
      .updateNumber()
      .sendMessage(req)
  }

  /**
   * List the Numbers registered in Fonos SIP Proxy subsystem.
   *
   * @param {Object} request
   * @param {number} request.pageSize - Number of element per page
   * (defaults to 20)
   * @param {string} request.pageToken - The next_page_token value returned from
   * a previous List request, if any
   * @return {Promise<ListNumbersResponse>} List of Numbers
   * @example
   *
   * const request = {
   *    pageSize: 20,
   *    pageToken: 2
   * }
   *
   * numbers.listNumbers(request)
   * .then(() => {
   *   console.log(result)            // returns a ListNumbersResponse object
   * }).catch(e => console.error(e))  // an error occurred
   */
  async listNumbers (request: { pageSize: any; pageToken: any; view: any }) {
    const r = new NumbersPB.ListNumbersRequest()
    r.setPageSize(request.pageSize)
    r.setPageToken(request.pageToken)
    r.setView(request.view)
    return this.service.listNumbers().sendMessage(r)
  }

  /**
   * Deletes a Number from SIP Proxy subsystem.
   *
   * @param {string} ref - Reference to the Number
   * @example
   *
   * const ref = '507f1f77bcf86cd799439011'
   *
   * numbers.deleteNumber(ref)
   * .then(() => {
   *   console.log('done')            // returns an empty object
   * }).catch(e => console.error(e))  // an error occurred
   */
  async deleteNumber (ref: string) {
    const req = new NumbersPB.DeleteNumberRequest()
    req.setRef(ref)

    return super
      .getService()
      .deleteNumber()
      .sendMessage(req)
  }

  /**
   * Get the Ingress App for a given e164 number.
   *
   * @param {Object} request
   * @param {string} request.e164Number - A number in E164 format for
   * incomming calls
   * @return {Promise<Object>}
   * @throws if the Number is not register in Fonos
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
  async getIngressApp (request: any) {
    const req = new NumbersPB.GetIngressAppRequest()
    req.setE164Number(request.e164Number)

    return super
      .getService()
      .getIngressApp()
      .sendMessage(req)
  }

  // Internal API
  getIngressAppSync (request: any) {
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

export default Numbers
