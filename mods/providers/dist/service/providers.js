"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProvidersService = exports.default = void 0;
const providers_pb_1 = require("./protos/providers_pb");
const common_pb_1 = require("./protos/common_pb");
const providers_grpc_pb_1 = require("./protos/providers_grpc_pb");
Object.defineProperty(exports, "ProvidersService", { enumerable: true, get: function () { return providers_grpc_pb_1.ProvidersService; } });
const core_1 = require("@fonos/core");
const core_2 = require("@fonos/core");
const decoder_1 = __importDefault(require("./decoder"));
class ProvidersServer {
    async listProviders(call, callback) {
        const result = await core_2.ResourceServer.listResources(core_1.Kind.GATEWAY, call);
        const response = new providers_pb_1.ListProvidersResponse();
        if (result.resources) {
            const providers = result.resources.map((resource) => decoder_1.default(resource));
            response.setNextPageToken(result.nextPageToken + "");
            response.setProvidersList(providers);
        }
        callback(null, response);
    }
    async createProvider(call, callback) {
        const provider = call.request.getProvider();
        try {
            const resource = new core_1.ResourceBuilder(core_1.Kind.GATEWAY, provider.getName(), provider.getRef())
                .withCredentials(provider.getUsername(), provider.getSecret())
                .withHost(provider.getHost())
                .withTransport(provider.getTransport())
                .withExpires(provider.getExpires())
                .withMetadata({ accessKeyId: core_2.getAccessKeyId(call) })
                .build();
            const result = await core_2.createResource(resource);
            callback(null, decoder_1.default(result));
        }
        catch (e) {
            callback(e, null);
        }
    }
    async updateProvider(call, callback) {
        const provider = call.request.getProvider();
        try {
            const resource = new core_1.ResourceBuilder(core_1.Kind.GATEWAY, provider.getName(), provider.getRef())
                .withMetadata({
                createdOn: provider.getCreateTime(),
                modifiedOn: provider.getUpdateTime()
            })
                .withCredentials(provider.getUsername(), provider.getSecret())
                .withHost(provider.getHost())
                .withTransport(provider.getTransport())
                .withExpires(provider.getExpires())
                .build();
            const result = await core_2.updateResource({
                resource,
                accessKeyId: core_2.getAccessKeyId(call)
            });
            callback(null, decoder_1.default(result));
        }
        catch (e) {
            callback(e, null);
        }
    }
    async getProvider(call, callback) {
        try {
            const result = await core_2.ResourceServer.getResource(core_1.Kind.GATEWAY, call);
            callback(null, decoder_1.default(result));
        }
        catch (e) {
            callback(e, null);
        }
    }
    async deleteProvider(call, callback) {
        try {
            await core_2.ResourceServer.deleteResource(core_1.Kind.GATEWAY, call);
            callback(null, new common_pb_1.Empty());
        }
        catch (e) {
            callback(e, null);
        }
    }
}
exports.default = ProvidersServer;
