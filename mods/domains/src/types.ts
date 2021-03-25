import { Domain } from "@fonos/core/src/server/protos/domains_pb";

/**
 * Create Domain Request object
 *
 * @typedef {Object} CreateDomainRequest
 * @property {string} ref - reference of the domain object
 * @property {string} name - Friendly name for the SIP domain
 * @property {string} domainUri - Domain URI. FQDN is recommended
 * @property {string} egressRule - Regular expression indicating when a
 * call will be routed via request.egressNumberRef
 * @property {string} egressNumberRef - A valid reference to a Number in Fonos
 * @property {string} accessDeny - Optional list of IPs or networks that
 * cannot communicate with this Domain
 * @property {string} request.accessAllow - Optiona list of IPs or networks
 * allow if request.accessDeny is defined
 */
export interface CreateDomainRequest {
  ref?: string,
  name: string,
  domainUri: string,
  egressRule?: string,
  egressNumberRef?: string,
  accessDeny?: string[],
  accessAllow?: string[]
}

/**
 * Create Domain Response object
 *
 * @typedef {Object} CreateDomainResponse
 * @property {string} ref - reference of the domain object
 * @property {string} name - Friendly name for the SIP domain
 * @property {string} domainUri - Domain URI. FQDN is recommended
 * @property {string} egressRule - Regular expression indicating when a
 * call will be routed via request.egressNumberRef
 * @property {string} egressNumberRef - A valid reference to a Number in Fonos
 * @property {string} accessDeny - Optional list of IPs or networks that
 * cannot communicate with this Domain
 * @property {string} request.accessAllow - Optiona list of IPs or networks
 * allow if request.accessDeny is defined
 * @property {string} createdTime - Date when the domain was created
 * @property {string} updatedTime - Date when the domain was updated last time
 */
export interface CreateDomainResponse {
  ref: string,
  name: string,
  domainUri: string,
  egressRule?: string,
  egressNumberRef?: string,
  accessDeny?: string[],
  accessAllow?: string[],
}

export interface CreateGetResponse {
  ref: string,
  name: string,
  domainUri: string,
  egressRule?: string,
  egressNumberRef?: string,
  accessDeny?: string[],
  accessAllow?: string[],
  createdTime?: string,
  updatedTime?: string
}
/**
 * Update Domain Request object
 *
 * @typedef {Object} UpdateDomainRequest
 * @property {string} ref - reference of the domain object
 * @property {string} name - Friendly name for the SIP domain
 * @property {string} domainUri - Domain URI. FQDN is recommended
 * @property {string} egressRule - Regular expression indicating when a
 * call will be routed via request.egressNumberRef
 * @property {string} egressNumberRef - A valid reference to a Number in Fonos
 * @property {string} accessDeny - Optional list of IPs or networks that
 * cannot communicate with this Domain
 * @property {string} request.accessAllow - Optiona list of IPs or networks
 * allow if request.accessDeny is defined
 */
export interface UpdateDomainRequest {
  ref?: string,
  name?: string,
  domainUri?: string,
  egressRule?: string,
  egressNumberRef?: string,
  accessDeny?: string[],
  accessAllow?: string[]
}

/**
 * Update Domain Response object
 *
 * @typedef {Object} UpdateDomainResponse
 * @property {string} ref - Reference of the domain object
 */
export interface UpdateDomainResponse {
  ref: string
}

/**
 * List Domain Request object
 *
 * @typedef {Object} ListDomainsRequest
 * @property {number} pageSize - Number of element per page
 * (defaults to 20)
 * @property {string} pageToken - The next_page_token value returned from
 * a previous List request, if any
 * @property {number} view - Enum to select: 0 = BASIC, 1 = STANDARD, 2 = FULL
 * type of views
 */
export interface ListDomainsRequest {
  pageSize?: number,
  pageToken?: string,
  view?: number
}

/**
 * List Domain Response object
 *
 * @typedef {Object} ListDomainsResponse
 * @property {void} clearDomainsList - Clean the default domain list
 * @property {Array} getDomainsList - Array of the domains
 * @property {value: Array<Domain>: : ListDomainsResponse} setDomainsList - 
 * Set the domains list
 * @property {value?: Domain, index?: number): Domain} addDomains - 
 * Add domains
 * @property {string} getNextPageToken - Token to get the next page of the list
 */
export interface ListDomainsResponse {
  clearDomainsList(): void;
  getDomainsList(): Array<Domain>;
  setDomainsList(value: Array<Domain>): ListDomainsResponse;
  addDomains(value?: Domain, index?: number): Domain;
  getNextPageToken(): string;
  setNextPageToken(value: string): ListDomainsResponse;
}
