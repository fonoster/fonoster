"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommonPB = exports.ProvidersPB = void 0;
const common_1 = require("@fonos/common");
const providers_grpc_pb_1 = require("../service/protos/providers_grpc_pb");
const providers_pb_1 = __importDefault(require("../service/protos/providers_pb"));
exports.ProvidersPB = providers_pb_1.default;
const common_pb_1 = __importDefault(require("../service/protos/common_pb"));
exports.CommonPB = common_pb_1.default;
const grpc_promise_1 = require("grpc-promise");
const grpc_1 = __importDefault(require("grpc"));
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
class Providers extends common_1.FonosService {
    /**
     * Constructs a new Providers object.
     *
     * @param {ServiceOptions} options - Options to indicate the objects endpoint
     * @see module:core:FonosService
     */
    constructor(options) {
        super(providers_grpc_pb_1.ProvidersClient, options);
        super.init(grpc_1.default);
        grpc_promise_1.promisifyAll(super.getService(), { metadata: super.getMeta() });
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
    async createProvider(request) {
        const provider = new providers_pb_1.default.Provider();
        provider.setName(request.name);
        provider.setUsername(request.username);
        provider.setSecret(request.secret);
        provider.setHost(request.host);
        provider.setTransport(request.transport || "tcp");
        provider.setExpires(request.expires || 3600);
        const req = new providers_pb_1.default.CreateProviderRequest();
        req.setProvider(provider);
        const res = await super.getService().createProvider().sendMessage(req);
        return {
            ref: res.getRef(),
            name: res.getName(),
            username: res.getUsername(),
            secret: res.getSecret(),
            host: res.getHost(),
            transport: res.getTransport(),
            expires: res.getExpires(),
            createTime: res.getCreateTime(),
            updateTime: res.getUpdateTime()
        };
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
     * }).catch(e => console.error(e));   // an error occurred
     */
    async getProvider(ref) {
        const request = new providers_pb_1.default.GetProviderRequest();
        request.setRef(ref);
        const res = await super.getService().getProvider().sendMessage(request);
        return {
            ref: res.getRef(),
            name: res.getName(),
            username: res.getUsername(),
            secret: res.getSecret(),
            host: res.getHost(),
            transport: res.getTransport(),
            expires: res.getExpires(),
            createTime: res.getCreateTime(),
            updateTime: res.getUpdateTime()
        };
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
     *   ref: "hYTHYCYv_U",
     *   host: "sip.provider.net"
     * };
     *
     * providers.updateProvider(request)
     * .then(result => {
     *   console.log(result)            // returns the Provider from the DB
     * }).catch(e => console.error(e));  // an error occurred
     */
    async updateProvider(request) {
        const getProviderRequest = new providers_pb_1.default.GetProviderRequest();
        getProviderRequest.setRef(request.ref);
        const provider = await this.getService()
            .getProvider()
            .sendMessage(getProviderRequest);
        if (request.name)
            provider.setName(request.name);
        if (request.username)
            provider.setUsername(request.username);
        if (request.secret)
            provider.setSecret(request.secret);
        if (request.host)
            provider.setHost(request.host);
        if (request.transport)
            provider.setTransport(request.transport);
        if (request.expires)
            provider.setExpires(request.expires);
        const req = new providers_pb_1.default.UpdateProviderRequest();
        req.setProvider(provider);
        const res = await super.getService().updateProvider().sendMessage(req);
        return {
            ref: res.getRef()
        };
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
     * };
     *
     * providers.listProviders(request)
     * .then(() => {
     *   console.log(result)            // returns a ListProvidersResponse object
     * }).catch(e => console.error(e));  // an error occurred
     */
    async listProviders(request) {
        const r = new providers_pb_1.default.ListProvidersRequest();
        r.setPageSize(request.pageSize);
        r.setPageToken(request.pageToken);
        r.setView(request.view);
        const paginatedList = await this.getService()
            .listProviders()
            .sendMessage(r);
        return {
            nextPageToken: paginatedList.getNextPageToken(),
            providers: paginatedList
                .getProvidersList()
                .map((provider) => {
                return {
                    ref: provider.getRef(),
                    name: provider.getName(),
                    username: provider.getUsername(),
                    secret: provider.getSecret(),
                    host: provider.getHost(),
                    transport: provider.getTransport(),
                    expires: provider.getExpires(),
                    createTime: provider.getCreateTime(),
                    updateTime: provider.getUpdateTime()
                };
            })
        };
    }
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
    async deleteProvider(ref) {
        const req = new providers_pb_1.default.DeleteProviderRequest();
        req.setRef(ref);
        await super.getService().deleteProvider().sendMessage(req);
        return { ref };
    }
}
exports.default = Providers;
// WARNING: Workaround to support commonjs clients
module.exports = Providers;
module.exports.ProvidersPB = providers_pb_1.default;
module.exports.CommonPB = common_pb_1.default;
