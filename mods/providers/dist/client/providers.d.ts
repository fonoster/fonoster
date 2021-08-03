import { CreateProviderRequest, CreateProviderResponse, UpdateProviderRequest, UpdateProviderResponse, ListProviderRequest, ListProviderResponse, GetProviderResponse, DeleteProviderResponse } from "../types";
import { FonosService, ServiceOptions } from "@fonos/common";
import ProvidersPB from "../service/protos/providers_pb";
import CommonPB from "../service/protos/common_pb";
/**
 * @classdesc Use Fonos Providers, a capability of Fonos SIP Proxy subsystem,
 * to create, update, get and delete providers. Fonos Providers requires of a
 * running Fonos deployment.
 *
 * @extends FonosService
 * @example
 *
 * const Fonos = require("@fonos/sdk");
 * const providers = new Fonos.Providers();
 *
 * const request = {
 *   name: "SIP Provider",
 *   username: "trunk001",
 *   secret: "secretkey",
 *   host: "sip.provider.net"
 * };
 *
 * providers.createProvider(request)
 * .then(result => {
 *   console.log(result)             // successful response
 * }).catch(e => console.error(e));   // an error occurred
 */
export default class Providers extends FonosService {
    /**
     * Constructs a new Providers object.
     *
     * @param {ServiceOptions} options - Options to indicate the objects endpoint
     * @see module:core:FonosService
     */
    constructor(options?: ServiceOptions);
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
     *   name: "Provider Name",
     *   username: "trunk001",
     *   secret: "secretkey",
     *   host: "sip.provider.net"
     * };
     *
     * providers.createProvider(request)
     * .then(result => {
     *   console.log(result)            // returns the Provider object
     * }).catch(e => console.error(e));  // an error occurred
     */
    createProvider(request: CreateProviderRequest): Promise<CreateProviderResponse>;
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
     * }).catch(e => console.error(e));   // an error occurred
     */
    getProvider(ref: string): Promise<GetProviderResponse>;
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
     *   ref: "hYTHYCYv_U",
     *   host: "sip.provider.net"
     * };
     *
     * providers.updateProvider(request)
     * .then(result => {
     *   console.log(result)            // returns the Provider from the DB
     * }).catch(e => console.error(e));  // an error occurred
     */
    updateProvider(request: UpdateProviderRequest): Promise<UpdateProviderResponse>;
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
     * };
     *
     * providers.listProviders(request)
     * .then(() => {
     *   console.log(result)            // returns a ListProvidersResponse object
     * }).catch(e => console.error(e));  // an error occurred
     */
    listProviders(request: ListProviderRequest): Promise<ListProviderResponse>;
    /**
     * Deletes a Provider from SIP Proxy subsystem. Notice, that in order to delete
     * a Provider, you must first delete all it"s Agents.
     *
     * @param {string} ref - Reference to the Provider
     * @example
     *
     * const ref = "hYTHYCYv_U";
     *
     * providers.deleteProvider(ref)
     * .then(() => {
     *   console.log("done")            // returns an empty object
     * }).catch(e => console.error(e));  // an error occurred
     */
    deleteProvider(ref: string): Promise<DeleteProviderResponse>;
}
export { ProvidersPB, CommonPB };
