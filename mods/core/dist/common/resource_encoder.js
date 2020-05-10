var Kind = {
  AGENT: 'Agent',
  GATEWAY: 'Gateway',
  PEER: 'Peer',
  DOMAIN: 'Domain',
  NUMBER: 'Number'
}
var Privacy = {
  PRIVATE: 'Private',
  NONE: 'None'
}
var REncoder = /** @class */ (function () {
  function REncoder (kind, name, ref, apiVersion) {
    if (apiVersion === void 0) {
      apiVersion = 'v1beta1'
    }
    this.kind = kind
    this.apiVersion = apiVersion
    this.metadata = {
      name: name,
      ref: ref
    }
    this.spec = {}
    if (kind === Kind.DOMAIN) this.spec.context = {}
  }
  REncoder.prototype.withMetadata = function (metadata) {
    var merge = require('deepmerge')
    this.metadata = merge(this.metadata, metadata)
    return this
  }
  REncoder.prototype.withCredentials = function (username, secret) {
    if (![Kind.AGENT, Kind.GATEWAY, Kind.PEER].includes(this.kind))
      throw new Error(
        'Kind ' + this.kind + " resources don't have 'spec.credentials'"
      )
    this.spec.credentials = { username: username, secret: secret }
    // We removed if both are empty because Gateways may not have credentials
    if (!username && !secret) delete this.spec.credentials
    return this
  }
  REncoder.prototype.withHost = function (host) {
    if (this.kind != Kind.GATEWAY)
      throw new Error('Kind ' + this.kind + " does not holds 'spec.host' value")
    this.spec.host = host
    if (!host) delete this.spec.host
    return this
  }
  REncoder.prototype.withTransport = function (transport) {
    if (this.kind != Kind.GATEWAY)
      throw new Error(
        'Kind ' + this.kind + " does not holds 'spec.transport' value"
      )
    this.spec.transport = transport
    if (!transport) delete this.spec.transport
    return this
  }
  REncoder.prototype.withExpires = function (expires) {
    if (this.kind != Kind.GATEWAY)
      throw new Error(
        'Kind ' + this.kind + " does not holds 'spec.expires' value"
      )
    this.spec.expires = expires
    if (!expires) delete this.spec.expires
    return this
  }
  REncoder.prototype.withLocation = function (telUrl, aorLink) {
    if (this.kind != Kind.NUMBER)
      throw new Error(
        'Kind ' + this.kind + " does not holds 'spec.location' value"
      )
    this.spec.location = { telUrl: telUrl, aorLink: aorLink }
    if (!telUrl && !aorLink) delete this.spec.location
    return this
  }
  REncoder.prototype.withGatewayRef = function (ref) {
    if (this.kind != Kind.NUMBER)
      throw new Error(
        'Kind ' + this.kind + " does not holds 'spec.metadata.gwRef' value"
      )
    this.metadata.gwRef = ref
    if (!ref) delete this.metadata.gwRef
    return this
  }
  REncoder.prototype.withDomainUri = function (domainUri) {
    if (this.kind != Kind.DOMAIN)
      throw new Error(
        'Kind ' + this.kind + " does not holds 'spec.context.domainUri' value"
      )
    this.spec.context.domainUri = domainUri
    if (!domainUri) delete this.spec.context.domainUri
    return this
  }
  REncoder.prototype.withEgressPolicy = function (rule, numberRef) {
    if (this.kind != Kind.DOMAIN)
      throw new Error(
        'Kind ' +
          this.kind +
          " does not holds 'spec.context.egressPolicy' value"
      )
    this.spec.context.egressPolicy = { rule: rule, numberRef: numberRef }
    if (!rule && !numberRef) delete this.spec.context.egressPolicy
    return this
  }
  REncoder.prototype.withACL = function (allow, deny) {
    if (this.kind != Kind.DOMAIN)
      throw new Error(
        'Kind ' +
          this.kind +
          " does not holds 'spec.context.egressPolicy' value"
      )
    this.spec.context.accessControlList = { allow: allow, deny: deny }
    if (!allow || allow.length === 0)
      delete this.spec.context.accessControlList.allow
    if (!deny || deny.length === 0)
      delete this.spec.context.accessControlList.deny
    if ((!allow && !deny) || (allow.length === 0 && allow.length === 0))
      delete this.spec.context.accessControlList
    return this
  }
  REncoder.prototype.withPrivacy = function (privacy) {
    if (this.kind != Kind.AGENT)
      throw new Error(
        'Kind ' + this.kind + " does not holds 'spec.privacy' value"
      )
    this.spec.privacy = privacy
    if (!privacy) delete this.spec.privacy
    return this
  }
  REncoder.prototype.withDomains = function (domains) {
    if (this.kind != Kind.AGENT)
      throw new Error(
        'Kind ' + this.kind + " does not holds 'spec.domains' value"
      )
    this.spec.domains = domains
    if (!this.spec.domains || this.spec.domains.length === 0)
      delete this.spec.domains
    return this
  }
  REncoder.prototype.build = function () {
    return this
  }
  return REncoder
})()
module.exports.REncoder = REncoder
module.exports.Kind = Kind
module.exports.Privacy = Privacy
//# sourceMappingURL=resource_encoder.js.map
