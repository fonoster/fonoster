import { FonosService, ProvidersService, ProvidersPB } from '@fonos/core'
import { CreateProviderRequest, CreateProviderResponse, UpdateProviderRequest, UpdateProviderResponse } from './types'
/**
 * @classdesc Use Fonos Providers, a capability of Fonos SIP Proxy subsystem,
 * to create, update, get and delete providers. Fonos Providers requires of a
 * running Fonos deployment.
 *
 * @extends FonosService
 * @example
 *
 * const Fonos = require('@fonos/sdk')
 * const providers = new Fonos.Providers()
 *
 * const request = {
 *   name: 'Provider Name',
 *   username: 'trunk001',
 *   secret: 'secretkey',
 *   host: 'sip.provider.net'
 * }
 *
 * providers.createProvider(request)
 * .then(result => {
 *   console.log(result)             // successful response
 * }).catch(e => console.error(e))   // an error occurred
 */
export default class Providers extends FonosService {
  /**
   * Constructs a new Providers object.
   *
   * @see module:core:FonosService
   */
  constructor (options?: any) {
    super(ProvidersService.ProvidersClient, options)
    super.init()
    const promisifyAll = require('grpc-promise').promisifyAll
    promisifyAll(super.getService(), { metadata: super.getMeta() })
  }

  /**
   * Creates a new Provider on the SIP Proxy subsystem.
   *
   * @param {Object} request -  Request for the provision of a new Provider
   * @param {string} request.name - Friendly name to the Provider
   * @param {string} request.username - Username for the trunk. No required for
   * static IP authentication
   * @param {string} request.secret - Password for the trunk. No required for
   * static IP authentication
   * @param {string} request.host - Hostname or IP of the Provider
   * @param {string} request.transport - The transport for the Provider.
   * Fonos will use TCP if none is provided
   * @param {string} request.expires - Expiration time for the registration.
   * Fonos will use 3600 if non is provided
   * @return {Promise<Object>}
   * @example
   *
   * const request = {
   *   name: 'Provider Name',
   *   username: 'trunk001',
   *   secret: 'secretkey',
   *   host: 'sip.provider.net'
   * }
   *
   * providers.createProvider(request)
   * .then(result => {
   *   console.log(result)            // returns the Provider object
   * }).catch(e => console.error(e))  // an error occurred
   */
  async createProvider (request: CreateProviderRequest) : Promise<CreateProviderResponse> {
    const provider = new ProvidersPB.Provider()
    provider.setName(request.name)
    provider.setUsername(request.username)
    provider.setSecret(request.secret)
    provider.setHost(request.host)
    provider.setTransport(request.transport || 'tcp')
    provider.setExpires(request.expires || 3600)

    const req = new ProvidersPB.CreateProviderRequest()
    req.setProvider(provider)

    return super
      .getService()
      .createProvider()
      .sendMessage(req)
  }

  /**
   * Retrives a Provider by its reference.
   *
   * @param {string} ref - Reference to Provider
   * @return {Promise<Object>} The provider
   * @throws if ref is null or Provider does not exist
   * @example
   *
   * providers.getProvider(ref)
   * .then(result => {
   *   console.log(result)             // returns the Provider object
   * }).catch(e => console.error(e))   // an error occurred
   */
  async getProvider (ref: string) {
    const request = new ProvidersPB.GetProviderRequest()
    request.setRef(ref)
    return this.service.getProvider().sendMessage(request)
  }

  /**
   * Update a Provider at the SIP Proxy subsystem.
   *
   * @param {Object} request - Request to update a Provider
   * @param {string} request.ref - Providers reference
   * @param {string} request.name - Friendly name to the Provider
   * @param {string} request.username - Username for the trunk. No required for
   * static IP authentication
   * @param {string} request.secret - Password for the trunk. No required for
   * static IP authentication
   * @param {string} request.host - Hostname or IP of the Provider
   * @param {string} request.transport - The transport for the Provider.
   * Fonos will use TCP if none is provided
   * @param {string} request.expires - Expiration time for the registration.
   * Fonos will use 3600 if non is provided
   * @return {Promise<Object>}
   * @example
   *
   * const request = {
   *   ref: '516f1577bcf86cd797439012',
   *   host: 'sip.zone2.provider.net'
   * }
   *
   * providers.updateProvider(request)
   * .then(result => {
   *   console.log(result)            // returns the Provider from the DB
   * }).catch(e => console.error(e))  // an error occurred
   */
  async updateProvider (request: UpdateProviderRequest) {
    const providerFromDB = await this.getProvider(request.ref)

    if (request.name) providerFromDB.setName(request.name)
    if (request.username) providerFromDB.setUsername(request.username)
    if (request.secret) providerFromDB.setSecret(request.secret)
    if (request.host) providerFromDB.setHost(request.host)
    if (request.transport) providerFromDB.setTransport(request.transport)
    if (request.expires) providerFromDB.setExpires(request.expires)

    const req = new ProvidersPB.UpdateProviderRequest()
    req.setProvider(providerFromDB)

    return super
      .getService()
      .updateProvider()
      .sendMessage(req)
  }

  /**
   * List the Providers registered in Fonos SIP Proxy subsystem.
   *
   * @param {Object} request
   * @param {provider} request.pageSize - Provider of element per page
   * (defaults to 20)
   * @param {string} request.pageToken - The next_page_token value returned from
   * a previous List request, if any
   * @return {Promise<ListProvidersResponse>} List of Providers
   * @example
   *
   * const request = {
   *    pageSize: 20,
   *    pageToken: 2
   * }
   *
   * providers.listProviders(request)
   * .then(() => {
   *   console.log(result)            // returns a ListProvidersResponse object
   * }).catch(e => console.error(e))  // an error occurred
   */
  async listProviders (request: any) {
    const r = new ProvidersPB.ListProvidersRequest()
    r.setPageSize(request.pageSize)
    r.setPageToken(request.pageToken)
    r.setView(request.view)
    return this.service.listProviders().sendMessage(r)
  }

  /**
   * Deletes a Provider from SIP Proxy subsystem. Notice, that in order to delete
   * a Provider, you must first delete all it's Agents.
   *
   * @param {string} ref - Reference to the Provider
   * @example
   *
   * const ref = '507f1f77bcf86cd799439011'
   *
   * providers.deleteProvider(ref)
   * .then(() => {
   *   console.log('done')            // returns an empty object
   * }).catch(e => console.error(e))  // an error occurred
   */
  async deleteProvider (ref: any) {
    const req = new ProvidersPB.DeleteProviderRequest()
    req.setRef(ref)

    return super
      .getService()
      .deleteProvider()
      .sendMessage(req)
  }
}
