import { FonosService, DomainsService, DomainsPB } from '@fonos/core'
import { CreateDomainRequest, CreateDomainResponse, UpdateDomainRequest,
UpdateDomainResponse, ListDomainsRequest, ListDomainsResponse, CreateGetResponse } from './types'

/**
 * @classdesc Use Fonos Domains, a capability of Fonos SIP Proxy Subsystem,
 * to create, update, get and delete domains. Fonos Domains requires of a
 * running Fonos deployment.
 *
 * @extends FonosService
 * @example
 *
 * const Fonos = require('@fonos/sdk')
 * const domains = new Fonos.Domains()
 *
 * domains.createDomain({name: 'Local Domain', domainUri: 'sip.local'...})
 * .then(result => {
 *   console.log(result)             // successful response
 * }).catch(e => console.error(e))   // an error occurred
 */
class Domains extends FonosService {
  /**
   * Constructs a new Domains object.
   *
   * @see module:core:FonosService
   */
  constructor (options?: any) {
    super(DomainsService.DomainsClient, options)
    super.init()
    const promisifyAll = require('grpc-promise').promisifyAll
    promisifyAll(super.getService(), { metadata: super.getMeta() })
  }

  /**
   * Creates a new Domain on the SIP Proxy subsystem.
   *
   * @param {Object} request - Request for the provision of a new Domain
   * @param {string} request.name - Friendly name for the SIP domain
   * @param {string} request.domainUri - Domain URI. FQDN is recommended
   * @param {string} request.egressNumberRef - A valid reference to a Number in Fonos
   * @param {string} request.egressRule - Regular expression indicating when a
   * call will be routed via request.egressNumberRef
   * @param {string} request.accessDeny - Optional list of IPs or networks that
   * cannot communicate with this Domain
   * @param {string} request.accessAllow - Optiona list of IPs or networks
   * allow if request.accessDeny is defined
   * @return {Promise<Object>}
   * @example
   *
   * const request = {
   *    name: 'Local Domain',
   *    domainUri: 'sip.local',
   *    egressRule: '.*',
   *    egressNumberRef: '507f1f77bcf86cd799439011',
   *    accessDeny: ['0.0.0.0/1']     // Deny all
   *    accessAllow: ['192.168.1.0/255.255.255.0', '192.168.0.1/31']
   * }
   *
   * domains.createDomain(request)
   * .then(result => {
   *   console.log(result)            // returns the CreateDomainResponse interface
   * }).catch(e => console.error(e))  // an error occurred
   */
  async createDomain (request: CreateDomainRequest): Promise<CreateGetResponse> {
    const domain = new DomainsPB.Domain()
    domain.setName(request.name)
    domain.setDomainUri(request.domainUri)
    domain.setEgressRule(request.egressRule)
    domain.setEgressNumberRef(request.egressNumberRef)
    domain.setAccessDenyList(request.accessDeny)
    domain.setAccessAllowList(request.accessAllow)

    const req = new DomainsPB.CreateDomainRequest()
    req.setDomain(domain)

    const res = await super
      .getService()
      .createDomain()
      .sendMessage(req)

    return {
      ref: res.getRef(),
      name: res.getName(),
      domainUri: res.getDomainUri(),
      egressRule: res.getEgressRule(),
      egressNumberRef: res.getEgressNumberRef(),
      accessDeny: res.getAccessDenyList(),
      accessAllow: res.getAccessAllowList()
    }
  }

  /**
   * Retrives a Domain by its reference.
   *
   * @param {string} ref - Reference to Domain
   * @return {Promise<Object>} The domain
   * @throws if ref is null or Domain does not exist
   * @example
   *
   * domains.getDomain(ref)
   * .then(result => {
   *   console.log(result)             // returns the CreateGetResponse interface
   * }).catch(e => console.error(e))   // an error occurred
   */
  async getDomain (ref: string): Promise<CreateGetResponse> {
    const request = new DomainsPB.GetDomainRequest()
    request.setRef(ref)
    
    const res = await super
      .getService()
      .getDomain()
      .sendMessage(request)

    return {
      ref: res.getRef(),
      name: res.getName(),
      domainUri: res.getDomainUri(),
      egressRule: res.getEgressRule(),
      egressNumberRef: res.getEgressNumberRef(),
      accessDeny: res.getAccessDenyList(),
      accessAllow: res.getAccessAllowList(),
      createdTime: res.getCreateTime(),
      updatedTime: res.getUpdateTime()
    }
  }

  /**
   * Update a Domain at the SIP Proxy subsystem.
   *
   * @param {Object} request - Request for the update of an existing Domain
   * @param {string} request.ref - To update a Domain you must provide its reference
   * @param {string} request.name - Friendly name for the SIP domain
   * @param {string} request.egressNumberRef - A valid reference to a Number in Fonos
   * @param {string} request.egressRule - Regular expression indicating when a
   * call will be routed via request.egressNumberRef
   * @param {string} request.accessDeny - Optional list of IPs or networks that
   * cannot communicate with this Domain
   * @param {string} request.accessAllow - Optiona list of IPs or networks
   * allow if request.accessDeny is defined
   * @return {Promise<Object>}
   * @example
   *
   * const request = {
   *    ref: '507f1f77bcf86cd799439011'
   *    name: 'Office Domain ',
   *    accessAllow: ['192.168.1.0/255.255.255.0', '192.168.0.1/31']
   * }
   *
   * domains.updateDomain(request)
   * .then(result => {
   *   console.log(result)            // returns the UpdateDomainResponse interface
   * }).catch(e => console.error(e))  // an error occurred
   */
  async updateDomain (request: UpdateDomainRequest): Promise<UpdateDomainResponse> {
    const getDomainRequest = new DomainsPB.GetDomainRequest()
    getDomainRequest.setRef(request.ref)
    const domain = await this.getService().getDomain().sendMessage(getDomainRequest)
    
    if (request.name) domain.setName(request.name)
    if (request.egressRule) domain.setEgressRule(request.egressRule)
    if (request.egressNumberRef)
      domain.setEgressNumberRef(request.egressNumberRef)
    if (request.accessDeny) domain.setAccessDenyList(request.accessDeny)
    if (request.accessAllow) domain.setAccessAllowList(request.accessAllow)

    const req = new DomainsPB.UpdateDomainRequest()
    req.setDomain(domain)

    const res = await super
      .getService()
      .updateDomain()
      .sendMessage(req)

    return {
      ref: res.getRef()
    }
  }

  /**
   * List the Domains registered in Fonos SIP Proxy subsystem.
   *
   * @param {Object} request
   * @param {number} request.pageSize - Number of element per page
   * (defaults to 20)
   * @param {string} request.pageToken - The next_page_token value returned from
   * a previous List request, if any
   * @return {Promise<ListDomainsResponse>} List of Domains
   * @example
   *
   * const request = {
   *    pageSize: 20,
   *    pageToken: 2
   * }
   *
   * domains.listDomains(request)
   * .then(() => {
   *   console.log(result)            // returns a ListDomainsResponse interface
   * }).catch(e => console.error(e))  // an error occurred
   */
  async listDomains (request: ListDomainsRequest): Promise<ListDomainsResponse> {
    const r = new DomainsPB.ListDomainsRequest()
    r.setPageSize(request.pageSize)
    r.setPageToken(request.pageToken)
    r.setView(request.view)
    return this.getService().listDomains().sendMessage(r)
  }

  /**
   * Deletes a Domain from SIP Proxy subsystem. Notice, that in order to delete
   * a Domain, you must first delete all it's Agents.
   *
   * @param {string} ref - Reference to the Domain
   * @example
   *
   * const ref = '507f1f77bcf86cd799439011'
   *
   * domains.deleteDomain(ref)
   * .then(() => {
   *   console.log('done')            // returns a reference of the domain
   * }).catch(e => console.error(e))  // an error occurred
   */
  async deleteDomain (ref: string): Promise<string> {
    const req = new DomainsPB.DeleteDomainRequest()
    req.setRef(ref)
    return super
      .getService()
      .deleteDomain()
      .sendMessage(req)
  }
}

export default Domains
