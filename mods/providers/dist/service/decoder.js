"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const providers_pb_1 = require("./protos/providers_pb");
function default_1(jsonObj) {
    const provider = new providers_pb_1.Provider();
    const spec = jsonObj.spec;
    provider.setRef(jsonObj.metadata.ref);
    provider.setName(jsonObj.metadata.name);
    provider.setCreateTime(jsonObj.metadata.createdOn);
    provider.setUpdateTime(jsonObj.metadata.modifiedOn);
    provider.setHost(spec.host);
    provider.setTransport(spec.transport);
    provider.setExpires(spec.expires);
    if (spec.credentials) {
        provider.setUsername(spec.credentials.username);
        provider.setSecret(spec.credentials.secret);
    }
    return provider;
}
exports.default = default_1;
