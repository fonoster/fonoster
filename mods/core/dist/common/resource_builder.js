"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Privacy = exports.Kind = exports.ResourceBuilder = void 0;
const nanoid_1 = require("nanoid");
var Kind;
(function (Kind) {
    Kind["AGENT"] = "Agent";
    Kind["GATEWAY"] = "Gateway";
    Kind["PEER"] = "Peer";
    Kind["DOMAIN"] = "Domain";
    Kind["NUMBER"] = "Number";
})(Kind || (Kind = {}));
exports.Kind = Kind;
var Privacy;
(function (Privacy) {
    Privacy["PRIVATE"] = "Private";
    Privacy["NONE"] = "None";
})(Privacy || (Privacy = {}));
exports.Privacy = Privacy;
class ResourceBuilder {
    constructor(kind, name, ref, apiVersion = "v1beta1") {
        this.kind = kind;
        this.apiVersion = apiVersion;
        // TODO: Perhaps this should be a variable value?
        if (!ref)
            ref = nanoid_1.nanoid(10);
        this.metadata = {
            name: name,
            ref: ref
        };
        this.spec = {};
        if (kind === Kind.DOMAIN)
            this.spec.context = {};
        if (!ref)
            delete this.metadata.ref;
    }
    withMetadata(metadata) {
        const merge = require("deepmerge");
        this.metadata = merge(this.metadata, metadata);
        return this;
    }
    withCredentials(username, secret) {
        if (![Kind.AGENT, Kind.GATEWAY, Kind.PEER].includes(this.kind))
            throw new Error(`Kind ${this.kind} resources don't have 'spec.credentials'`);
        this.spec.credentials = { username, secret };
        if (!secret)
            delete this.spec.credentials.secret;
        // We removed if both are empty because Gateways may not have credentials
        if (!username && !secret)
            delete this.spec.credentials;
        return this;
    }
    withHost(host) {
        if (this.kind != Kind.GATEWAY)
            throw new Error(`Kind ${this.kind} does not holds 'spec.host' value`);
        this.spec.host = host;
        if (!host)
            delete this.spec.host;
        return this;
    }
    withTransport(transport) {
        if (this.kind != Kind.GATEWAY)
            throw new Error(`Kind ${this.kind} does not holds 'spec.transport' value`);
        this.spec.transport = transport;
        if (!transport)
            delete this.spec.transport;
        return this;
    }
    withExpires(expires) {
        if (this.kind != Kind.GATEWAY)
            throw new Error(`Kind ${this.kind} does not holds 'spec.expires' value`);
        this.spec.expires = expires;
        if (!expires)
            delete this.spec.expires;
        return this;
    }
    withLocation(telUrl, aorLink) {
        if (this.kind != Kind.NUMBER)
            throw new Error(`Kind ${this.kind} does not holds 'spec.location' value`);
        this.spec.location = { telUrl, aorLink };
        if (!telUrl && !aorLink)
            delete this.spec.location;
        return this;
    }
    withGatewayRef(ref) {
        if (this.kind != Kind.NUMBER)
            throw new Error(`Kind ${this.kind} does not holds 'spec.metadata.gwRef' value`);
        this.metadata.gwRef = ref;
        if (!ref)
            delete this.metadata.gwRef;
        return this;
    }
    withDomainUri(domainUri) {
        if (this.kind != Kind.DOMAIN)
            throw new Error(`Kind ${this.kind} does not holds 'spec.context.domainUri' value`);
        this.spec.context.domainUri = domainUri;
        if (!domainUri)
            delete this.spec.context.domainUri;
        return this;
    }
    withEgressPolicy(rule, numberRef) {
        if (this.kind != Kind.DOMAIN)
            throw new Error(`Kind ${this.kind} does not holds 'spec.context.egressPolicy' value`);
        this.spec.context.egressPolicy = { rule, numberRef };
        if (!rule && !numberRef)
            delete this.spec.context.egressPolicy;
        return this;
    }
    withACL(allow, deny) {
        if (this.kind != Kind.DOMAIN)
            throw new Error(`Kind ${this.kind} does not holds 'spec.context.egressPolicy' value`);
        this.spec.context.accessControlList = { allow, deny };
        if (!allow || allow.length === 0)
            delete this.spec.context.accessControlList.allow;
        if (!deny || deny.length === 0)
            delete this.spec.context.accessControlList.deny;
        if ((!allow && !deny) || allow.length === 0)
            delete this.spec.context.accessControlList;
        return this;
    }
    withPrivacy(privacy) {
        if (this.kind != Kind.AGENT)
            throw new Error(`Kind ${this.kind} does not holds 'spec.privacy' value`);
        this.spec.privacy = privacy;
        if (!privacy)
            delete this.spec.privacy;
        return this;
    }
    withDomains(domains) {
        if (this.kind != Kind.AGENT)
            throw new Error(`Kind ${this.kind} does not holds 'spec.domains' value`);
        this.spec.domains = domains;
        if (!this.spec.domains || this.spec.domains.length === 0)
            delete this.spec.domains;
        return this;
    }
    build() {
        return this;
    }
}
exports.ResourceBuilder = ResourceBuilder;
